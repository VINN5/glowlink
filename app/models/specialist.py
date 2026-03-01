from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SpecialtyCategory(str, Enum):
    hair = "hair"
    makeup = "makeup"
    nails = "nails"
    skincare = "skincare"
    massage = "massage"
    lashes = "lashes"
    brows = "brows"
    other = "other"


class AvailabilitySlot(BaseModel):
    day: str           # e.g. "Monday"
    start_time: str    # e.g. "09:00"
    end_time: str      # e.g. "17:00"


class SpecialistProfile(BaseModel):
    user_id: str
    bio: Optional[str] = None
    categories: List[SpecialtyCategory] = []
    location: Optional[str] = None
    city: Optional[str] = None
    years_of_experience: Optional[int] = None
    portfolio_images: List[str] = []
    rating: float = 0.0
    total_reviews: int = 0
    is_verified: bool = False
    availability: List[AvailabilitySlot] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SpecialistProfileCreate(BaseModel):
    bio: Optional[str] = None
    categories: List[SpecialtyCategory] = []
    location: Optional[str] = None
    city: Optional[str] = None
    years_of_experience: Optional[int] = None
    availability: List[AvailabilitySlot] = []


class SpecialistProfileUpdate(BaseModel):
    bio: Optional[str] = None
    categories: Optional[List[SpecialtyCategory]] = None
    location: Optional[str] = None
    city: Optional[str] = None
    years_of_experience: Optional[int] = None
    availability: Optional[List[AvailabilitySlot]] = None