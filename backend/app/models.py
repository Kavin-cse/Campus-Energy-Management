from sqlalchemy import Column, Integer, String, Float, Date, Time, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from .database import Base

class RoomType(str, enum.Enum):
    CLASSROOM = "Classroom"
    COMPUTER_LAB = "Computer Lab"
    PHYSICS_LAB = "Physics Lab"
    ELECTRONICS_LAB = "Electronics Lab"
    CHEMISTRY_LAB = "Chemistry Lab"
    OTHER = "Other"

class RecommendationStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"

class IoTDeviceType(str, enum.Enum):
    CLASSROOM = "classroom"
    LAB_CAMERA = "lab_camera"

class IoTDeviceMode(str, enum.Enum):
    SIMULATED = "simulated"
    REAL = "real"

class IoTDeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    building = Column(String(100), nullable=False, index=True)
    room_type = Column(SQLEnum(RoomType), nullable=False, default=RoomType.CLASSROOM)
    capacity = Column(Integer, default=0)
    operating_start = Column(Time, nullable=False)
    operating_end = Column(Time, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    readings = relationship("ElectricityReading", back_populates="room", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="room", cascade="all, delete-orphan")
    devices = relationship("IoTDevice", back_populates="room", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Room {self.name} ({self.building})>"

class ElectricityReading(Base):
    __tablename__ = "electricity_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    energy_kwh = Column(Float, nullable=False)
    occupancy_count = Column(Integer, default=0)
    is_occupied = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    room = relationship("Room", back_populates="readings")
    
    def __repr__(self):
        return f"<ElectricityReading room_id={self.room_id} date={self.date} energy={self.energy_kwh}kWh>"

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    pattern_type = Column(String(50), nullable=False)
    priority = Column(String(20), nullable=False)  # high, medium, low
    estimated_waste_kwh = Column(Float, default=0.0)
    estimated_savings_inr = Column(Float, default=0.0)
    status = Column(SQLEnum(RecommendationStatus), default=RecommendationStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    room = relationship("Room", back_populates="recommendations")
    
    def __repr__(self):
        return f"<Recommendation {self.title} (priority={self.priority})>"

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    campus_name = Column(String(200), default="WattWise Campus")
    tariff_per_kwh = Column(Float, default=8.5)
    default_operating_start = Column(Time, nullable=True)
    default_operating_end = Column(Time, nullable=True)
    ai_off_hours_threshold = Column(Float, default=0.5)  # kWh threshold for off-hours waste
    ai_idle_threshold = Column(Float, default=1.0)  # kWh threshold for idle waste
    ai_spike_multiplier = Column(Float, default=2.0)  # multiplier for spike detection
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Settings campus={self.campus_name} tariff={self.tariff_per_kwh}>"

class IoTDevice(Base):
    __tablename__ = "iot_devices"
    
    id = Column(String(100), primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    device_type = Column(SQLEnum(IoTDeviceType), nullable=False)
    mode = Column(SQLEnum(IoTDeviceMode), default=IoTDeviceMode.SIMULATED)
    status = Column(SQLEnum(IoTDeviceStatus), default=IoTDeviceStatus.OFFLINE)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    room = relationship("Room", back_populates="devices")
    
    def __repr__(self):
        return f"<IoTDevice {self.id} (room={self.room_id})>"