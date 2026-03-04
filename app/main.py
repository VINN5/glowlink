import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.specialists import router as specialists_router
from app.routers.services import router as services_router
from app.routers.bookings import router as bookings_router
from app.routers.admin import router as admin_router
from app.routers.messages import router as messages_router
from app.routers.reviews import router as reviews_router
from app.routers.portfolio import router as portfolio_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="GlowLink Beauty Platform API",
)

# CORS — allow localhost for dev and any extra origins from env
extra_origins = os.environ.get("CORS_ORIGINS", "").split(",")
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://glowlink.onrender.com",
] + [o.strip() for o in extra_origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://glowlink.onrender.com",
        "https://glowlink-backend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (profile pictures)
os.makedirs("uploads/profile_pictures", exist_ok=True)
app.mount("/static", StaticFiles(directory="."), name="static")

# DB lifecycle
@app.on_event("startup")
async def startup():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()

# Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(specialists_router)
app.include_router(services_router)
app.include_router(bookings_router)
app.include_router(messages_router)
app.include_router(reviews_router)
app.include_router(portfolio_router)
app.include_router(admin_router)

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME} API", "version": settings.VERSION}