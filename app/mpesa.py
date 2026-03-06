# backend/app/mpesa.py
import httpx
import base64
from datetime import datetime, timezone
from app.core.config import settings

DARAJA_BASE = "https://sandbox.safaricom.co.ke"  # swap to https://api.safaricom.co.ke for production


def get_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")


def get_password(timestamp: str) -> str:
    raw = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
    return base64.b64encode(raw.encode()).decode()


async def get_access_token() -> str:
    credentials = base64.b64encode(
        f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {credentials}"},
            timeout=10,
        )
        res.raise_for_status()
        return res.json()["access_token"]


async def stk_push(phone: str, amount: int, booking_id: str, description: str = "GlowLink Booking") -> dict:
    """
    Initiates an STK Push to the customer's phone.
    phone: format 2547XXXXXXXX
    amount: integer KSh amount
    booking_id: used as AccountReference and passed in callback
    """
    token = await get_access_token()
    timestamp = get_timestamp()
    password = get_password(timestamp)

    # Normalize phone number
    phone = phone.strip().replace("+", "").replace(" ", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": f"{settings.BACKEND_URL}/payments/callback",
        "AccountReference": booking_id[:12],
        "TransactionDesc": description,
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{DARAJA_BASE}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        res.raise_for_status()
        return res.json()