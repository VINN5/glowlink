# backend/app/routers/payments.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timezone

from app.database import get_database
from app.routers.auth import get_current_user
from app.mpesa import stk_push

router = APIRouter(prefix="/payments", tags=["Payments"])


class PayRequest(BaseModel):
    booking_id: str
    phone: str  # e.g. 0712345678 or 254712345678


def now_utc():
    return datetime.now(timezone.utc)


# ── Initiate STK Push ─────────────────────────────────────────────────────────

@router.post("/pay")
async def initiate_payment(
    body: PayRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()

    # Fetch booking
    try:
        booking = await db["bookings"].find_one({"_id": ObjectId(body.booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Only the client who made the booking can pay
    if str(booking["client_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your booking")

    # Don't allow double payment
    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")

    amount = int(booking["total_price"])

    try:
        result = await stk_push(
            phone=body.phone,
            amount=amount,
            booking_id=body.booking_id,
            description="GlowLink Booking",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"M-Pesa error: {str(e)}")

    # Save the checkout request ID so we can match the callback
    checkout_id = result.get("CheckoutRequestID")
    await db["bookings"].update_one(
        {"_id": ObjectId(body.booking_id)},
        {"$set": {
            "checkout_request_id": checkout_id,
            "payment_status": "pending",
            "payment_phone": body.phone,
            "updated_at": now_utc(),
        }}
    )

    return {
        "message": "STK Push sent. Check your phone.",
        "checkout_request_id": checkout_id,
    }


# ── M-Pesa Callback (called by Safaricom) ────────────────────────────────────

@router.post("/callback")
async def mpesa_callback(payload: dict):
    """
    Safaricom POSTs here after the customer completes or cancels payment.
    No auth — this is a public endpoint called by Safaricom's servers.
    """
    db = get_database()

    try:
        body = payload["Body"]["stkCallback"]
        result_code = body["ResultCode"]
        checkout_id = body["CheckoutRequestID"]

        booking = await db["bookings"].find_one({"checkout_request_id": checkout_id})
        if not booking:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        if result_code == 0:
            # Payment successful
            items = body.get("CallbackMetadata", {}).get("Item", [])
            meta = {item["Name"]: item.get("Value") for item in items}

            await db["bookings"].update_one(
                {"checkout_request_id": checkout_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "pending",          # now awaits specialist confirmation
                    "mpesa_receipt": meta.get("MpesaReceiptNumber"),
                    "mpesa_amount": meta.get("Amount"),
                    "mpesa_phone": meta.get("PhoneNumber"),
                    "paid_at": now_utc(),
                    "updated_at": now_utc(),
                }}
            )
        else:
            # Payment failed or cancelled — auto-cancel the booking
            await db["bookings"].update_one(
                {"checkout_request_id": checkout_id},
                {"$set": {
                    "payment_status": "failed",
                    "status": "cancelled",
                    "payment_failure_reason": body.get("ResultDesc"),
                    "updated_at": now_utc(),
                }}
            )

    except Exception as e:
        # Always return 200 to Safaricom even on our errors
        print(f"Callback error: {e}")

    return {"ResultCode": 0, "ResultDesc": "Accepted"}


# ── Poll Payment Status ───────────────────────────────────────────────────────

@router.get("/status/{booking_id}")
async def payment_status(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    try:
        booking = await db["bookings"].find_one({"_id": ObjectId(booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if str(booking["client_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your booking")

    return {
        "booking_id": booking_id,
        "payment_status": booking.get("payment_status", "pending"),
        "status": booking.get("status"),
        "mpesa_receipt": booking.get("mpesa_receipt"),
    }