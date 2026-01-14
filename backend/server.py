from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Models ====================

# User Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

# Baby Models
class Baby(BaseModel):
    baby_id: str = Field(default_factory=lambda: f"baby_{uuid.uuid4().hex[:12]}")
    user_id: str  # Owner
    shared_with: List[str] = []  # List of user_ids who have access
    name: str
    birth_date: str  # ISO date string
    gender: Optional[str] = None  # "male", "female", "other"
    photo: Optional[str] = None  # Base64 encoded image
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BabyCreate(BaseModel):
    name: str
    birth_date: str
    gender: Optional[str] = None
    photo: Optional[str] = None

class BabyUpdate(BaseModel):
    name: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    photo: Optional[str] = None

# Feeding Models
class FeedingRecord(BaseModel):
    feeding_id: str = Field(default_factory=lambda: f"feed_{uuid.uuid4().hex[:12]}")
    baby_id: str
    user_id: str  # Who logged this
    feeding_type: str  # "breast_left", "breast_right", "bottle", "solid"
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    amount_ml: Optional[int] = None  # For bottle feeding
    notes: Optional[str] = None
    food_type: Optional[str] = None  # For solid foods
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedingCreate(BaseModel):
    baby_id: str
    feeding_type: str
    start_time: str  # ISO datetime string
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    amount_ml: Optional[int] = None
    notes: Optional[str] = None
    food_type: Optional[str] = None

# Sleep Models
class SleepRecord(BaseModel):
    sleep_id: str = Field(default_factory=lambda: f"sleep_{uuid.uuid4().hex[:12]}")
    baby_id: str
    user_id: str
    sleep_type: str  # "nap", "night"
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    quality: Optional[str] = None  # "good", "fair", "poor"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SleepCreate(BaseModel):
    baby_id: str
    sleep_type: str
    start_time: str
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    quality: Optional[str] = None
    notes: Optional[str] = None

# Diaper Models
class DiaperRecord(BaseModel):
    diaper_id: str = Field(default_factory=lambda: f"diaper_{uuid.uuid4().hex[:12]}")
    baby_id: str
    user_id: str
    diaper_type: str  # "wet", "dirty", "mixed"
    time: datetime
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DiaperCreate(BaseModel):
    baby_id: str
    diaper_type: str
    time: str
    notes: Optional[str] = None

# Growth Models
class GrowthRecord(BaseModel):
    growth_id: str = Field(default_factory=lambda: f"growth_{uuid.uuid4().hex[:12]}")
    baby_id: str
    user_id: str
    date: str  # ISO date string
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    head_circumference_cm: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GrowthCreate(BaseModel):
    baby_id: str
    date: str
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    head_circumference_cm: Optional[float] = None
    notes: Optional[str] = None

# Activity Timeline Model
class TimelineEntry(BaseModel):
    entry_id: str
    entry_type: str  # "feeding", "sleep", "diaper", "growth"
    time: datetime
    data: dict
    created_by: str

# Sleep Prediction Model
class SleepPrediction(BaseModel):
    next_nap_time: datetime
    confidence: float
    recommended_duration_minutes: int
    wake_window_minutes: int

# Family Sharing Models
class ShareInvite(BaseModel):
    invite_id: str = Field(default_factory=lambda: f"invite_{uuid.uuid4().hex[:12]}")
    baby_id: str
    inviter_user_id: str
    invitee_email: str
    status: str = "pending"  # "pending", "accepted", "declined"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShareInviteCreate(BaseModel):
    baby_id: str
    invitee_email: str

# Reminder Models
class Reminder(BaseModel):
    reminder_id: str = Field(default_factory=lambda: f"reminder_{uuid.uuid4().hex[:12]}")
    baby_id: str
    user_id: str
    reminder_type: str  # "feeding", "sleep", "diaper", "medicine"
    time: datetime
    message: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReminderCreate(BaseModel):
    baby_id: str
    reminder_type: str
    time: str
    message: str

# ==================== Auth Helper ====================

async def get_current_user(request: Request) -> Optional[User]:
    # Check cookies first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check expiry with timezone-aware comparison
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if user_doc:
        return User(**user_doc)
    return None

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# Check if user has access to baby
async def check_baby_access(user_id: str, baby_id: str) -> bool:
    baby = await db.babies.find_one(
        {"baby_id": baby_id},
        {"_id": 0}
    )
    if not baby:
        return False
    return baby["user_id"] == user_id or user_id in baby.get("shared_with", [])

# ==================== Auth Routes ====================

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token and user data"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Exchange with Emergent Auth
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = auth_response.json()
    
    session_data = SessionDataResponse(**user_data)
    
    # Create or update user
    existing_user = await db.users.find_one(
        {"email": session_data.email},
        {"_id": 0}
    )
    
    if not existing_user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": session_data.email,
            "name": session_data.name,
            "picture": session_data.picture,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
    else:
        user_id = existing_user["user_id"]
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_data.session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_data.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_data.session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== Baby Routes ====================

@api_router.post("/baby", response_model=Baby)
async def create_baby(baby_data: BabyCreate, request: Request):
    """Create a new baby profile"""
    user = await require_auth(request)
    
    baby = Baby(
        user_id=user.user_id,
        name=baby_data.name,
        birth_date=baby_data.birth_date,
        gender=baby_data.gender,
        photo=baby_data.photo
    )
    
    await db.babies.insert_one(baby.dict())
    return baby

@api_router.get("/baby", response_model=List[Baby])
async def get_babies(request: Request):
    """Get all babies the user has access to"""
    user = await require_auth(request)
    
    # Get babies owned by user or shared with user
    babies = await db.babies.find(
        {"$or": [
            {"user_id": user.user_id},
            {"shared_with": user.user_id}
        ]},
        {"_id": 0}
    ).to_list(100)
    
    return [Baby(**baby) for baby in babies]

@api_router.get("/baby/{baby_id}", response_model=Baby)
async def get_baby(baby_id: str, request: Request):
    """Get a specific baby"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    baby = await db.babies.find_one({"baby_id": baby_id}, {"_id": 0})
    if not baby:
        raise HTTPException(status_code=404, detail="Baby not found")
    
    return Baby(**baby)

@api_router.put("/baby/{baby_id}", response_model=Baby)
async def update_baby(baby_id: str, baby_data: BabyUpdate, request: Request):
    """Update baby profile"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in baby_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.babies.update_one(
        {"baby_id": baby_id},
        {"$set": update_data}
    )
    
    baby = await db.babies.find_one({"baby_id": baby_id}, {"_id": 0})
    return Baby(**baby)

@api_router.delete("/baby/{baby_id}")
async def delete_baby(baby_id: str, request: Request):
    """Delete baby profile (owner only)"""
    user = await require_auth(request)
    
    baby = await db.babies.find_one({"baby_id": baby_id}, {"_id": 0})
    if not baby:
        raise HTTPException(status_code=404, detail="Baby not found")
    
    if baby["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can delete")
    
    # Delete all related records
    await db.babies.delete_one({"baby_id": baby_id})
    await db.feeding_records.delete_many({"baby_id": baby_id})
    await db.sleep_records.delete_many({"baby_id": baby_id})
    await db.diaper_records.delete_many({"baby_id": baby_id})
    await db.growth_records.delete_many({"baby_id": baby_id})
    await db.reminders.delete_many({"baby_id": baby_id})
    
    return {"message": "Baby profile deleted"}

# ==================== Feeding Routes ====================

@api_router.post("/feeding", response_model=FeedingRecord)
async def create_feeding(feeding_data: FeedingCreate, request: Request):
    """Create a feeding record"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, feeding_data.baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    feeding = FeedingRecord(
        baby_id=feeding_data.baby_id,
        user_id=user.user_id,
        feeding_type=feeding_data.feeding_type,
        start_time=datetime.fromisoformat(feeding_data.start_time.replace('Z', '+00:00')),
        end_time=datetime.fromisoformat(feeding_data.end_time.replace('Z', '+00:00')) if feeding_data.end_time else None,
        duration_minutes=feeding_data.duration_minutes,
        amount_ml=feeding_data.amount_ml,
        notes=feeding_data.notes,
        food_type=feeding_data.food_type
    )
    
    await db.feeding_records.insert_one(feeding.dict())
    return feeding

@api_router.get("/feeding/{baby_id}", response_model=List[FeedingRecord])
async def get_feedings(baby_id: str, request: Request, date: Optional[str] = None):
    """Get feeding records for a baby"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"baby_id": baby_id}
    
    if date:
        start_date = datetime.fromisoformat(date)
        end_date = start_date + timedelta(days=1)
        query["start_time"] = {"$gte": start_date, "$lt": end_date}
    
    records = await db.feeding_records.find(query, {"_id": 0}).sort("start_time", -1).to_list(100)
    return [FeedingRecord(**record) for record in records]

@api_router.delete("/feeding/{feeding_id}")
async def delete_feeding(feeding_id: str, request: Request):
    """Delete a feeding record"""
    user = await require_auth(request)
    
    record = await db.feeding_records.find_one({"feeding_id": feeding_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if not await check_baby_access(user.user_id, record["baby_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.feeding_records.delete_one({"feeding_id": feeding_id})
    return {"message": "Feeding record deleted"}

# ==================== Sleep Routes ====================

@api_router.post("/sleep", response_model=SleepRecord)
async def create_sleep(sleep_data: SleepCreate, request: Request):
    """Create a sleep record"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, sleep_data.baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    sleep = SleepRecord(
        baby_id=sleep_data.baby_id,
        user_id=user.user_id,
        sleep_type=sleep_data.sleep_type,
        start_time=datetime.fromisoformat(sleep_data.start_time.replace('Z', '+00:00')),
        end_time=datetime.fromisoformat(sleep_data.end_time.replace('Z', '+00:00')) if sleep_data.end_time else None,
        duration_minutes=sleep_data.duration_minutes,
        quality=sleep_data.quality,
        notes=sleep_data.notes
    )
    
    await db.sleep_records.insert_one(sleep.dict())
    return sleep

@api_router.get("/sleep/{baby_id}", response_model=List[SleepRecord])
async def get_sleep_records(baby_id: str, request: Request, date: Optional[str] = None):
    """Get sleep records for a baby"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"baby_id": baby_id}
    
    if date:
        start_date = datetime.fromisoformat(date)
        end_date = start_date + timedelta(days=1)
        query["start_time"] = {"$gte": start_date, "$lt": end_date}
    
    records = await db.sleep_records.find(query, {"_id": 0}).sort("start_time", -1).to_list(100)
    return [SleepRecord(**record) for record in records]

@api_router.put("/sleep/{sleep_id}", response_model=SleepRecord)
async def update_sleep(sleep_id: str, sleep_data: SleepCreate, request: Request):
    """Update a sleep record (to add end time)"""
    user = await require_auth(request)
    
    record = await db.sleep_records.find_one({"sleep_id": sleep_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if not await check_baby_access(user.user_id, record["baby_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {}
    if sleep_data.end_time:
        update_data["end_time"] = datetime.fromisoformat(sleep_data.end_time.replace('Z', '+00:00'))
    if sleep_data.duration_minutes:
        update_data["duration_minutes"] = sleep_data.duration_minutes
    if sleep_data.quality:
        update_data["quality"] = sleep_data.quality
    if sleep_data.notes:
        update_data["notes"] = sleep_data.notes
    
    if update_data:
        await db.sleep_records.update_one(
            {"sleep_id": sleep_id},
            {"$set": update_data}
        )
    
    updated_record = await db.sleep_records.find_one({"sleep_id": sleep_id}, {"_id": 0})
    return SleepRecord(**updated_record)

@api_router.delete("/sleep/{sleep_id}")
async def delete_sleep(sleep_id: str, request: Request):
    """Delete a sleep record"""
    user = await require_auth(request)
    
    record = await db.sleep_records.find_one({"sleep_id": sleep_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if not await check_baby_access(user.user_id, record["baby_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.sleep_records.delete_one({"sleep_id": sleep_id})
    return {"message": "Sleep record deleted"}

# ==================== Sleep Prediction ====================

@api_router.get("/sleep/prediction/{baby_id}", response_model=SleepPrediction)
async def get_sleep_prediction(baby_id: str, request: Request):
    """Get sleep prediction based on baby's sleep patterns"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get baby's age
    baby = await db.babies.find_one({"baby_id": baby_id}, {"_id": 0})
    if not baby:
        raise HTTPException(status_code=404, detail="Baby not found")
    
    birth_date = datetime.fromisoformat(baby["birth_date"])
    age_days = (datetime.now(timezone.utc).replace(tzinfo=None) - birth_date).days
    age_months = age_days / 30
    
    # Get recent sleep records (last 7 days)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_sleep = await db.sleep_records.find(
        {"baby_id": baby_id, "start_time": {"$gte": week_ago}},
        {"_id": 0}
    ).sort("start_time", -1).to_list(100)
    
    # Calculate average wake window based on age and recent patterns
    if age_months < 3:
        base_wake_window = 60  # 1 hour
        recommended_duration = 45
    elif age_months < 6:
        base_wake_window = 90  # 1.5 hours
        recommended_duration = 60
    elif age_months < 9:
        base_wake_window = 120  # 2 hours
        recommended_duration = 75
    elif age_months < 12:
        base_wake_window = 150  # 2.5 hours
        recommended_duration = 90
    else:
        base_wake_window = 180  # 3 hours
        recommended_duration = 90
    
    # Adjust based on recent patterns
    if recent_sleep:
        # Find the last sleep end time
        last_sleep = None
        for sleep in recent_sleep:
            if sleep.get("end_time"):
                last_sleep = sleep
                break
        
        if last_sleep and last_sleep.get("end_time"):
            last_wake_time = last_sleep["end_time"]
            if last_wake_time.tzinfo is None:
                last_wake_time = last_wake_time.replace(tzinfo=timezone.utc)
            
            next_nap_time = last_wake_time + timedelta(minutes=base_wake_window)
            
            # If prediction is in the past, calculate from now
            if next_nap_time < datetime.now(timezone.utc):
                next_nap_time = datetime.now(timezone.utc) + timedelta(minutes=30)
            
            confidence = 0.75
        else:
            # No end time recorded, estimate from now
            next_nap_time = datetime.now(timezone.utc) + timedelta(minutes=base_wake_window // 2)
            confidence = 0.5
    else:
        # No recent data, use default
        next_nap_time = datetime.now(timezone.utc) + timedelta(minutes=base_wake_window)
        confidence = 0.4
    
    return SleepPrediction(
        next_nap_time=next_nap_time,
        confidence=confidence,
        recommended_duration_minutes=recommended_duration,
        wake_window_minutes=base_wake_window
    )

# ==================== Diaper Routes ====================

@api_router.post("/diaper", response_model=DiaperRecord)
async def create_diaper(diaper_data: DiaperCreate, request: Request):
    """Create a diaper record"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, diaper_data.baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    diaper = DiaperRecord(
        baby_id=diaper_data.baby_id,
        user_id=user.user_id,
        diaper_type=diaper_data.diaper_type,
        time=datetime.fromisoformat(diaper_data.time.replace('Z', '+00:00')),
        notes=diaper_data.notes
    )
    
    await db.diaper_records.insert_one(diaper.dict())
    return diaper

@api_router.get("/diaper/{baby_id}", response_model=List[DiaperRecord])
async def get_diapers(baby_id: str, request: Request, date: Optional[str] = None):
    """Get diaper records for a baby"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"baby_id": baby_id}
    
    if date:
        start_date = datetime.fromisoformat(date)
        end_date = start_date + timedelta(days=1)
        query["time"] = {"$gte": start_date, "$lt": end_date}
    
    records = await db.diaper_records.find(query, {"_id": 0}).sort("time", -1).to_list(100)
    return [DiaperRecord(**record) for record in records]

@api_router.delete("/diaper/{diaper_id}")
async def delete_diaper(diaper_id: str, request: Request):
    """Delete a diaper record"""
    user = await require_auth(request)
    
    record = await db.diaper_records.find_one({"diaper_id": diaper_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if not await check_baby_access(user.user_id, record["baby_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.diaper_records.delete_one({"diaper_id": diaper_id})
    return {"message": "Diaper record deleted"}

# ==================== Growth Routes ====================

@api_router.post("/growth", response_model=GrowthRecord)
async def create_growth(growth_data: GrowthCreate, request: Request):
    """Create a growth record"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, growth_data.baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    growth = GrowthRecord(
        baby_id=growth_data.baby_id,
        user_id=user.user_id,
        date=growth_data.date,
        weight_kg=growth_data.weight_kg,
        height_cm=growth_data.height_cm,
        head_circumference_cm=growth_data.head_circumference_cm,
        notes=growth_data.notes
    )
    
    await db.growth_records.insert_one(growth.dict())
    return growth

@api_router.get("/growth/{baby_id}", response_model=List[GrowthRecord])
async def get_growth_records(baby_id: str, request: Request):
    """Get growth records for a baby"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    records = await db.growth_records.find(
        {"baby_id": baby_id},
        {"_id": 0}
    ).sort("date", -1).to_list(100)
    
    return [GrowthRecord(**record) for record in records]

@api_router.delete("/growth/{growth_id}")
async def delete_growth(growth_id: str, request: Request):
    """Delete a growth record"""
    user = await require_auth(request)
    
    record = await db.growth_records.find_one({"growth_id": growth_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if not await check_baby_access(user.user_id, record["baby_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.growth_records.delete_one({"growth_id": growth_id})
    return {"message": "Growth record deleted"}

# ==================== Timeline Routes ====================

@api_router.get("/timeline/{baby_id}")
async def get_timeline(baby_id: str, request: Request, date: Optional[str] = None):
    """Get timeline of all activities for a baby"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    timeline = []
    
    # Set date range
    if date:
        start_date = datetime.fromisoformat(date)
    else:
        start_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    end_date = start_date + timedelta(days=1)
    
    # Get feeding records
    feedings = await db.feeding_records.find(
        {"baby_id": baby_id, "start_time": {"$gte": start_date, "$lt": end_date}},
        {"_id": 0}
    ).to_list(100)
    
    for f in feedings:
        timeline.append({
            "entry_id": f["feeding_id"],
            "entry_type": "feeding",
            "time": f["start_time"],
            "data": f,
            "created_by": f["user_id"]
        })
    
    # Get sleep records
    sleep_records = await db.sleep_records.find(
        {"baby_id": baby_id, "start_time": {"$gte": start_date, "$lt": end_date}},
        {"_id": 0}
    ).to_list(100)
    
    for s in sleep_records:
        timeline.append({
            "entry_id": s["sleep_id"],
            "entry_type": "sleep",
            "time": s["start_time"],
            "data": s,
            "created_by": s["user_id"]
        })
    
    # Get diaper records
    diapers = await db.diaper_records.find(
        {"baby_id": baby_id, "time": {"$gte": start_date, "$lt": end_date}},
        {"_id": 0}
    ).to_list(100)
    
    for d in diapers:
        timeline.append({
            "entry_id": d["diaper_id"],
            "entry_type": "diaper",
            "time": d["time"],
            "data": d,
            "created_by": d["user_id"]
        })
    
    # Sort by time (most recent first)
    timeline.sort(key=lambda x: x["time"], reverse=True)
    
    return timeline

# ==================== Statistics Routes ====================

@api_router.get("/stats/{baby_id}")
async def get_stats(baby_id: str, request: Request, date: Optional[str] = None):
    """Get daily statistics for a baby"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Set date range
    if date:
        start_date = datetime.fromisoformat(date)
    else:
        start_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    end_date = start_date + timedelta(days=1)
    
    # Feeding stats
    feedings = await db.feeding_records.find(
        {"baby_id": baby_id, "start_time": {"$gte": start_date, "$lt": end_date}},
        {"_id": 0}
    ).to_list(100)
    
    feeding_count = len(feedings)
    total_feeding_minutes = sum(f.get("duration_minutes", 0) or 0 for f in feedings)
    total_bottle_ml = sum(f.get("amount_ml", 0) or 0 for f in feedings if f.get("feeding_type") == "bottle")
    
    # Sleep stats
    sleep_records = await db.sleep_records.find(
        {"baby_id": baby_id, "start_time": {"$gte": start_date, "$lt": end_date}},
        {"_id": 0}
    ).to_list(100)
    
    sleep_count = len(sleep_records)
    total_sleep_minutes = sum(s.get("duration_minutes", 0) or 0 for s in sleep_records)
    
    # Diaper stats
    diapers = await db.diaper_records.find(
        {"baby_id": baby_id, "time": {"$gte": start_date, "$lt": end_date}},
        {"_id": 0}
    ).to_list(100)
    
    wet_count = len([d for d in diapers if d.get("diaper_type") == "wet"])
    dirty_count = len([d for d in diapers if d.get("diaper_type") == "dirty"])
    mixed_count = len([d for d in diapers if d.get("diaper_type") == "mixed"])
    
    return {
        "date": start_date.isoformat(),
        "feeding": {
            "count": feeding_count,
            "total_minutes": total_feeding_minutes,
            "total_bottle_ml": total_bottle_ml
        },
        "sleep": {
            "count": sleep_count,
            "total_minutes": total_sleep_minutes,
            "total_hours": round(total_sleep_minutes / 60, 1) if total_sleep_minutes else 0
        },
        "diaper": {
            "total": len(diapers),
            "wet": wet_count,
            "dirty": dirty_count,
            "mixed": mixed_count
        }
    }

# ==================== Family Sharing Routes ====================

@api_router.post("/share/invite", response_model=ShareInvite)
async def create_share_invite(invite_data: ShareInviteCreate, request: Request):
    """Invite someone to share baby access"""
    user = await require_auth(request)
    
    # Check if user owns the baby
    baby = await db.babies.find_one({"baby_id": invite_data.baby_id}, {"_id": 0})
    if not baby:
        raise HTTPException(status_code=404, detail="Baby not found")
    
    if baby["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can invite")
    
    # Check if invite already exists
    existing = await db.share_invites.find_one({
        "baby_id": invite_data.baby_id,
        "invitee_email": invite_data.invitee_email,
        "status": "pending"
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Invite already sent")
    
    invite = ShareInvite(
        baby_id=invite_data.baby_id,
        inviter_user_id=user.user_id,
        invitee_email=invite_data.invitee_email
    )
    
    await db.share_invites.insert_one(invite.dict())
    return invite

@api_router.get("/share/invites/pending")
async def get_pending_invites(request: Request):
    """Get pending invites for current user"""
    user = await require_auth(request)
    
    invites = await db.share_invites.find(
        {"invitee_email": user.email, "status": "pending"},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with baby and inviter info
    enriched = []
    for invite in invites:
        baby = await db.babies.find_one({"baby_id": invite["baby_id"]}, {"_id": 0})
        inviter = await db.users.find_one({"user_id": invite["inviter_user_id"]}, {"_id": 0})
        
        enriched.append({
            **invite,
            "baby_name": baby["name"] if baby else "Unknown",
            "inviter_name": inviter["name"] if inviter else "Unknown"
        })
    
    return enriched

@api_router.post("/share/invite/{invite_id}/accept")
async def accept_invite(invite_id: str, request: Request):
    """Accept a share invite"""
    user = await require_auth(request)
    
    invite = await db.share_invites.find_one({"invite_id": invite_id}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite["invitee_email"] != user.email:
        raise HTTPException(status_code=403, detail="Not your invite")
    
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invite already processed")
    
    # Add user to baby's shared_with
    await db.babies.update_one(
        {"baby_id": invite["baby_id"]},
        {"$addToSet": {"shared_with": user.user_id}}
    )
    
    # Update invite status
    await db.share_invites.update_one(
        {"invite_id": invite_id},
        {"$set": {"status": "accepted"}}
    )
    
    return {"message": "Invite accepted"}

@api_router.post("/share/invite/{invite_id}/decline")
async def decline_invite(invite_id: str, request: Request):
    """Decline a share invite"""
    user = await require_auth(request)
    
    invite = await db.share_invites.find_one({"invite_id": invite_id}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite["invitee_email"] != user.email:
        raise HTTPException(status_code=403, detail="Not your invite")
    
    await db.share_invites.update_one(
        {"invite_id": invite_id},
        {"$set": {"status": "declined"}}
    )
    
    return {"message": "Invite declined"}

@api_router.delete("/share/{baby_id}/{user_id}")
async def remove_shared_access(baby_id: str, user_id: str, request: Request):
    """Remove shared access (owner only)"""
    current_user = await require_auth(request)
    
    baby = await db.babies.find_one({"baby_id": baby_id}, {"_id": 0})
    if not baby:
        raise HTTPException(status_code=404, detail="Baby not found")
    
    if baby["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only owner can remove access")
    
    await db.babies.update_one(
        {"baby_id": baby_id},
        {"$pull": {"shared_with": user_id}}
    )
    
    return {"message": "Access removed"}

# ==================== Reminder Routes ====================

@api_router.post("/reminder", response_model=Reminder)
async def create_reminder(reminder_data: ReminderCreate, request: Request):
    """Create a reminder"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, reminder_data.baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    reminder = Reminder(
        baby_id=reminder_data.baby_id,
        user_id=user.user_id,
        reminder_type=reminder_data.reminder_type,
        time=datetime.fromisoformat(reminder_data.time.replace('Z', '+00:00')),
        message=reminder_data.message
    )
    
    await db.reminders.insert_one(reminder.dict())
    return reminder

@api_router.get("/reminder/{baby_id}", response_model=List[Reminder])
async def get_reminders(baby_id: str, request: Request):
    """Get active reminders for a baby"""
    user = await require_auth(request)
    
    if not await check_baby_access(user.user_id, baby_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    reminders = await db.reminders.find(
        {"baby_id": baby_id, "is_active": True},
        {"_id": 0}
    ).sort("time", 1).to_list(100)
    
    return [Reminder(**r) for r in reminders]

@api_router.delete("/reminder/{reminder_id}")
async def delete_reminder(reminder_id: str, request: Request):
    """Delete a reminder"""
    user = await require_auth(request)
    
    reminder = await db.reminders.find_one({"reminder_id": reminder_id}, {"_id": 0})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    if not await check_baby_access(user.user_id, reminder["baby_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.reminders.delete_one({"reminder_id": reminder_id})
    return {"message": "Reminder deleted"}

# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "Baby Day Book API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
