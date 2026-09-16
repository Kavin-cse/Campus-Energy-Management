from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
from .firebase_service import firebase_service
from ..models import Room, IoTDevice, IoTDeviceStatus, IoTDeviceMode, IoTDeviceType, ElectricityReading
from ..schemas import IoTDeviceCreate, IoTSensorPayload, IoTSensorReading

class IoTService:
    def __init__(self, db: Session):
        self.db = db

    def get_devices(self):
        devices = self.db.query(IoTDevice).all()
        return devices

    def register_device(self, device_data: IoTDeviceCreate):
        db_device = IoTDevice(
            id=device_data.id,
            room_id=device_data.room_id,
            device_type=device_data.device_type,
            mode=device_data.mode,
            status=device_data.status
        )
        self.db.add(db_device)
        self.db.commit()
        self.db.refresh(db_device)
        
        # Initialize device status in Firebase
        device_ref = firebase_service.get_ref(f"campusEnergy/devices/{db_device.id}")
        device_ref.set({
            "roomId": db_device.room_id,
            "deviceType": db_device.device_type.value,
            "mode": db_device.mode.value,
            "status": db_device.status.value,
            "lastSeen": datetime.now(timezone.utc).isoformat()
        })
        
        return db_device

    def update_device_status(self, device_id: str, status: IoTDeviceStatus, mode: IoTDeviceMode):
        db_device = self.db.query(IoTDevice).filter(IoTDevice.id == device_id).first()
        if db_device:
            db_device.status = status
            db_device.mode = mode
            db_device.last_seen = datetime.now(timezone.utc)
            self.db.commit()
            
            device_ref = firebase_service.get_ref(f"campusEnergy/devices/{device_id}")
            device_ref.update({
                "status": status.value,
                "mode": mode.value,
                "lastSeen": db_device.last_seen.isoformat()
            })
            return True
        return False

    def get_room_occupancy(self, room_id: int):
        occupancy_ref = firebase_service.get_ref(f"campusEnergy/occupancy/{room_id}")
        data = occupancy_ref.get()
        if data:
            return data
        return {"currentCount": 0, "totalEntries": 0, "totalExits": 0, "lastUpdated": None}

    def process_sensor_payload(self, payload: IoTSensorPayload):
        db_device = self.db.query(IoTDevice).filter(IoTDevice.id == payload.deviceId).first()
        if not db_device:
            raise ValueError(f"Device {payload.deviceId} not found.")

        # Ensure device status is updated
        self.update_device_status(db_device.id, IoTDeviceStatus.ONLINE, db_device.mode)

        room_id = db_device.room_id
        occupancy_ref = firebase_service.get_ref(f"campusEnergy/occupancy/{room_id}")
        current_occ = occupancy_ref.get() or {"currentCount": 0, "totalEntries": 0, "totalExits": 0}

        new_count = current_occ.get("currentCount", 0)
        total_entries = current_occ.get("totalEntries", 0)
        total_exits = current_occ.get("totalExits", 0)

        # Classroom logic
        if db_device.device_type == IoTDeviceType.CLASSROOM:
            if payload.entryEvent:
                new_count += 1
                total_entries += 1
            if payload.exitEvent:
                new_count -= 1
                total_exits += 1
            
            if new_count < 0:
                new_count = 0
                
            # If motion detected but occupancy is 0, we can optionally bump it
            if payload.pirMotion and new_count == 0:
                new_count = 1
                
        # Camera logic
        elif db_device.device_type == IoTDeviceType.LAB_CAMERA:
            if payload.occupancy is not None:
                new_count = payload.occupancy
                
        # Update Firebase Occupancy
        occupancy_ref.update({
            "currentCount": new_count,
            "totalEntries": total_entries,
            "totalExits": total_exits,
            "lastUpdated": payload.timestamp.isoformat()
        })

        # Save Reading to Firebase
        readings_ref = firebase_service.get_ref("campusEnergy/readings")
        reading_data = payload.dict(exclude_none=True)
        reading_data["timestamp"] = payload.timestamp.isoformat()
        reading_data["roomId"] = room_id
        reading_data["occupancy"] = new_count
        readings_ref.push(reading_data)

        # Convert to Unified IoT Reading
        unified_reading = IoTSensorReading(
            deviceId=payload.deviceId,
            roomId=room_id,
            timestamp=payload.timestamp,
            occupancy=new_count,
            powerWatts=payload.powerWatts,
            energyKwh=payload.energyKwh,
            motionDetected=payload.pirMotion,
            entryEvent=payload.entryEvent,
            exitEvent=payload.exitEvent,
            dataMode=db_device.mode.value,
            source=db_device.device_type.value
        )
        
        # Also create a legacy electricity reading so existing features don't break immediately
        if payload.energyKwh is not None:
            self._sync_legacy_reading(unified_reading)
            
        return unified_reading
        
    def _sync_legacy_reading(self, reading: IoTSensorReading):
        # Fallback sync to local DB for legacy AI queries
        date = reading.timestamp.date()
        time = reading.timestamp.time()
        # Simply append it
        new_reading = ElectricityReading(
            room_id=reading.roomId,
            date=date,
            start_time=time,
            end_time=time,
            energy_kwh=reading.energyKwh or 0.0,
            occupancy_count=reading.occupancy,
            is_occupied=reading.occupancy > 0,
            notes=f"Synced from IoT ({reading.source})"
        )
        self.db.add(new_reading)
        self.db.commit()
