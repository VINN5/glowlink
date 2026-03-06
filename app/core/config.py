from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    MONGODB_URL: str
    DB_NAME: str = "glowlink"

    # JWT Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # Email (Gmail SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""  # Gmail App Password

    # App
    APP_NAME: str = "GlowLink"
    DEBUG: bool = True
    VERSION: str = "1.0.0"
    FRONTEND_URL: str = "http://localhost:5173"

    # M-Pesa / Daraja
    BACKEND_URL: str = "https://glowlink-backend.onrender.com"
    MPESA_CONSUMER_KEY: str = ""
    MPESA_CONSUMER_SECRET: str = ""
    MPESA_SHORTCODE: str = "174379"   # Safaricom sandbox default
    MPESA_PASSKEY: str = ""
    MPESA_ENV: str = "sandbox"        # change to "production" when going live

    class Config:
        env_file = ".env"


settings = Settings()