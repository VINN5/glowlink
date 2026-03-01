from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class BookingBase(BaseModel):
    client_id: str
    specialist_id: str
    service_id: str
    booking_date: datetime
    notes: Optional[str] = None
    status: BookingStatus = BookingStatus.pending
    total_price: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class BookingCreate(BaseModel):
    specialist_id: str
    service_id: str
    booking_date: datetime
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    notes: Optional[str] = None
    booking_date: Optional[datetime] = None


class BookingResponse(BaseModel):
    id: str
    client_id: str
    specialist_id: str
    service_id: str
    booking_date: datetime
    notes: Optional[str] = None
    status: BookingStatus
    total_price: float
    created_at: datetime