from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    client_id: str
    specialist_id: str
    booking_id: str
    rating: int        # 1 to 5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReviewCreate(BaseModel):
    specialist_id: str
    booking_id: str
    rating: int
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    client_id: str
    specialist_id: str
    booking_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime