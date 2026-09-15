from pydantic import BaseModel, Field
from datetime import date, time, datetime
from typing import Optional, List
from enum import Enum

class RoomType(str, Enum):
    CLASSROOM = "Classroom"
    COMPUTER_LAB = "Computer Lab"
    PHYSICS_LAB = "Physics Lab"
    ELECTRONICS_LAB = "Electronics Lab"
    CHEMISTRY_LAB = "Chemistry Lab"
    OTHER = "Other"

class RecommendationStatus(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"

# Room schemas
class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    building: str = Field(..., min_length=1, max_length=100)
    room_type: RoomType = RoomType.CLASSROOM
    capacity: int = Field(default=0, ge=0)
    operating_start: time
    operating_end: time

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    building: Optional[str] = Field(None, min_length=1, max_length=100)
    room_type: Optional[RoomType] = None
    capacity: Optional[int] = Field(None, ge=0)
    operating_start: Optional[time] = None
    operating_end: Optional[time] = None

class RoomResponse(RoomBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Electricity Reading schemas
class ElectricityReadingBase(BaseModel):
    room_id: int
    date: date
    start_time: time
    end_time: time
    energy_kwh: float = Field(..., gt=0)
    occupancy_count: int = Field(default=0, ge=0)
    is_occupied: bool = False
    notes: Optional[str] = None

class ElectricityReadingCreate(ElectricityReadingBase):
    pass

class ElectricityReadingUpdate(BaseModel):
    room_id: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    energy_kwh: Optional[float] = Field(None, gt=0)
    occupancy_count: Optional[int] = Field(None, ge=0)
    is_occupied: Optional[bool] = None
    notes: Optional[str] = None

class ElectricityReadingResponse(ElectricityReadingBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Recommendation schemas
class RecommendationBase(BaseModel):
    room_id: int
    title: str
    description: str
    pattern_type: str
    priority: str
    estimated_waste_kwh: float = 0.0
    estimated_savings_inr: float = 0.0

class RecommendationCreate(RecommendationBase):
    pass

class RecommendationUpdate(BaseModel):
    status: Optional[RecommendationStatus] = None

class RecommendationResponse(RecommendationBase):
    id: int
    status: RecommendationStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

# Settings schemas
class SettingsBase(BaseModel):
    campus_name: str = "WattWise Campus"
    tariff_per_kwh: float = Field(default=8.5, gt=0)
    default_operating_start: Optional[time] = None
    default_operating_end: Optional[time] = None
    ai_off_hours_threshold: float = Field(default=0.5, ge=0)
    ai_idle_threshold: float = Field(default=1.0, ge=0)
    ai_spike_multiplier: float = Field(default=2.0, ge=1.0)

class SettingsUpdate(BaseModel):
    campus_name: Optional[str] = None
    tariff_per_kwh: Optional[float] = Field(None, gt=0)
    default_operating_start: Optional[time] = None
    default_operating_end: Optional[time] = None
    ai_off_hours_threshold: Optional[float] = Field(None, ge=0)
    ai_idle_threshold: Optional[float] = Field(None, ge=0)
    ai_spike_multiplier: Optional[float] = Field(None, ge=1.0)

class SettingsResponse(SettingsBase):
    id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardSummary(BaseModel):
    total_consumption_kwh: float
    estimated_waste_kwh: float
    estimated_cost_inr: float
    rooms_monitored: int
    active_alerts: int
    campus_name: str
    date_range: dict

class RoomConsumption(BaseModel):
    room_id: int
    room_name: str
    building: str
    room_type: str
    total_consumption_kwh: float
    waste_kwh: float
    waste_score: int
    reading_count: int

class DailyTrend(BaseModel):
    date: date
    total_kwh: float
    waste_kwh: float
    cost_inr: float

class OffHoursData(BaseModel):
    room_id: int
    room_name: str
    building: str
    off_hours_kwh: float
    total_kwh: float
    waste_percentage: float

class AIRecommendation(BaseModel):
    id: int
    room_id: int
    room_name: str
    building: str
    title: str
    description: str
    pattern_type: str
    priority: str
    estimated_waste_kwh: float
    estimated_savings_inr: float
    status: RecommendationStatus
    evidence: str
    created_at: datetime

# Analytics schemas
class AnalyticsFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    room_ids: Optional[List[int]] = None
    building: Optional[str] = None
    room_type: Optional[RoomType] = None
    granularity: str = "daily"  # daily, weekly, monthly

class PeakHourData(BaseModel):
    hour: int
    total_kwh: float
    reading_count: int

class OccupancyComparison(BaseModel):
    occupied_kwh: float
    unoccupied_kwh: float
    occupied_percentage: float

# CSV Import
class CSVImportResponse(BaseModel):
    success: bool
    imported: int
    errors: List[str]
    message: str

# Generic response
class MessageResponse(BaseModel):
    message: str
    success: bool = True