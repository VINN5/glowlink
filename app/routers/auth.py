from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from bson import ObjectId
import httpx
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.database import get_database
from app.models.user import UserCreate, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"


def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "role": user["role"],
        "profile_picture": user.get("profile_picture"),
        "is_active": user["is_active"],
        "created_at": user["created_at"],
    }


# ─── Standard Register ────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    db = get_database()
    existing = await db["users"].find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = {
        "full_name": user_data.full_name,
        "email": user_data.email,
        "phone": user_data.phone,
        "role": user_data.role,
        "hashed_password": get_password_hash(user_data.password),
        "profile_picture": None,
        "is_active": True,
        "auth_provider": "local",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db["users"].insert_one(user_dict)
    new_user = await db["users"].find_one({"_id": result.inserted_id})
    return user_helper(new_user)


# ─── Standard Login ───────────────────────────────────────────────────────────

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    user = await db["users"].find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}


# ─── Google OAuth ─────────────────────────────────────────────────────────────

@router.post("/google/token")
async def google_token(payload: dict):
    """
    Exchange Google authorization code for GlowLink JWT.
    Frontend sends: { code, role }
    """
    code = payload.get("code")
    role = payload.get("role", "client")
    redirect_uri = payload.get("redirect_uri", f"{settings.FRONTEND_URL}/auth/google/callback")

    if not code:
        raise HTTPException(status_code=400, detail="Authorization code is required")

    async with httpx.AsyncClient() as client:
        # Exchange code for Google access token
        token_res = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })

        if token_res.status_code != 200:
            error_detail = token_res.json().get("error_description", token_res.text)
            raise HTTPException(status_code=400, detail=f"Failed to exchange Google token: {error_detail}")

        access_token = token_res.json().get("access_token")

        # Fetch Google user info
        user_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

        google_user = user_res.json()

    email = google_user.get("email")
    full_name = google_user.get("name", "")
    picture = google_user.get("picture")
    google_id = google_user.get("id")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google")

    db = get_database()
    user = await db["users"].find_one({"email": email})

    if user:
        # Update profile picture if missing
        if picture and not user.get("profile_picture"):
            await db["users"].update_one(
                {"_id": user["_id"]},
                {"$set": {"profile_picture": picture, "updated_at": datetime.utcnow()}}
            )
        if not user["is_active"]:
            raise HTTPException(status_code=403, detail="Account is deactivated")
    else:
        # Create new Google user
        result = await db["users"].insert_one({
            "full_name": full_name,
            "email": email,
            "phone": None,
            "role": role,
            "hashed_password": None,
            "profile_picture": picture,
            "is_active": True,
            "auth_provider": "google",
            "google_id": google_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        user = await db["users"].find_one({"_id": result.inserted_id})

    token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "user": user_helper(user),
    }


# ─── Get Current User ─────────────────────────────────────────────────────────

async def get_current_user(token: str = Depends(oauth2_scheme)):
    db = get_database()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await db["users"].find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_helper(user)


async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ─── Forgot Password ──────────────────────────────────────────────────────────

def send_reset_email(to_email: str, reset_link: str, name: str):
    """Send password reset email via Gmail SMTP."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        raise ValueError(
            "SMTP credentials missing. Add SMTP_USER and SMTP_PASSWORD to your .env file."
        )

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="text-align:center;margin-bottom:28px;">
        <span style="font-size:28px;font-weight:800;color:#ec4899;">GlowLink</span>
      </div>
      <h2 style="color:#111;font-size:20px;margin-bottom:8px;">Reset your password</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;margin-bottom:24px;">
        Hi {name},<br><br>
        We received a request to reset your GlowLink password. Click the button below to choose a new password.
        This link expires in <strong>1 hour</strong>.
      </p>
      <a href="{reset_link}"
         style="display:inline-block;background:#ec4899;color:#fff;
                text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
        Reset Password
      </a>
      <p style="color:#999;font-size:13px;margin-top:28px;line-height:1.5;">
        If you didn't request this, you can safely ignore this email.<br><br>
        Or copy this link: <a href="{reset_link}" style="color:#ec4899;">{reset_link}</a>
      </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your GlowLink password"
    msg["From"] = f"GlowLink <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    print(f"[EMAIL] Connecting to {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    print(f"[EMAIL] Logging in as {settings.SMTP_USER}")
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        server.set_debuglevel(1)       # prints SMTP conversation to terminal
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
    print(f"[EMAIL] ✅ Sent to {to_email}")


# ─── Test Email Endpoint (dev helper) ────────────────────────────────────────

@router.post("/test-email")
async def test_email(payload: dict):
    """
    Dev helper — POST { "to": "your@email.com" } to test SMTP config.
    Returns detailed error info instead of hiding it.
    """
    to = payload.get("to", settings.SMTP_USER)
    try:
        send_reset_email(
            to,
            "http://localhost:5173/reset-password?token=TEST_TOKEN",
            "Test User"
        )
        return {"status": "ok", "message": f"Test email sent to {to}"}
    except smtplib.SMTPAuthenticationError as e:
        return {
            "status": "error",
            "type": "SMTPAuthenticationError",
            "detail": str(e),
            "fix": "Use a Gmail App Password (not your regular password). Enable 2FA first at myaccount.google.com/security, then create an App Password."
        }
    except smtplib.SMTPConnectError as e:
        return {
            "status": "error",
            "type": "SMTPConnectError",
            "detail": str(e),
            "fix": "Could not connect to smtp.gmail.com:587. Check your firewall or internet connection."
        }
    except ValueError as e:
        return {
            "status": "error",
            "type": "MissingCredentials",
            "detail": str(e),
            "fix": "Add SMTP_USER=yourgmail@gmail.com and SMTP_PASSWORD=your_app_password to backend/.env then restart the server."
        }
    except Exception as e:
        return {
            "status": "error",
            "type": type(e).__name__,
            "detail": str(e),
        }


@router.post("/forgot-password")
async def forgot_password(payload: dict):
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    db = get_database()
    user = await db["users"].find_one({"email": email})

    if not user:
        # Don't reveal whether email exists
        return {"message": "If that email exists, a reset link has been sent."}

    if user.get("auth_provider") == "google":
        raise HTTPException(
            status_code=400,
            detail="This account uses Google sign-in. Please log in with Google instead."
        )

    # Generate secure token
    token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Store token (clear any old ones first)
    await db["password_resets"].delete_many({"email": email})
    await db["password_resets"].insert_one({
        "email": email,
        "token": token,
        "expires_at": expires_at,
        "used": False,
    })

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    try:
        send_reset_email(email, reset_link, user.get("full_name", "there"))
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=500,
            detail="Email authentication failed. Check SMTP_USER and SMTP_PASSWORD in your .env — use a Gmail App Password, not your regular password."
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {type(e).__name__}: {str(e)}")

    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(payload: dict):
    token = payload.get("token", "").strip()
    new_password = payload.get("new_password", "")

    if not token:
        raise HTTPException(status_code=400, detail="Reset token is required")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    db = get_database()
    record = await db["password_resets"].find_one({"token": token})

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    if record.get("used"):
        raise HTTPException(status_code=400, detail="This reset link has already been used")
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    # Update password
    hashed = get_password_hash(new_password)
    await db["users"].update_one(
        {"email": record["email"]},
        {"$set": {"hashed_password": hashed, "updated_at": datetime.utcnow()}}
    )

    # Mark token as used
    await db["password_resets"].update_one({"token": token}, {"$set": {"used": True}})

    return {"message": "Password updated successfully"}

