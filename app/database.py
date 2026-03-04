from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = None
db = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        tlsAllowInvalidCertificates=True,
    )
    db = client[settings.DB_NAME]
    try:
        await client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {settings.DB_NAME}")
    except Exception as e:
        print(f"⚠️ MongoDB connection warning: {e}")
        print("App will continue — retrying on first request...")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed.")


def get_database():
    return db