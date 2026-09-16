from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas import IoTDeviceCreate, IoTDeviceResponse, IoTSensorPayload, IoTSensorReading, MessageResponse
from ..services.iot_service import IoTService

router = APIRouter(prefix="/iot", tags=["IoT"])

@router.get("/devices", response_model=List[IoTDeviceResponse])
def get_devices(db: Session = Depends(get_db)):
    iot_service = IoTService(db)
    return iot_service.get_devices()

@router.post("/devices", response_model=IoTDeviceResponse)
def register_device(device: IoTDeviceCreate, db: Session = Depends(get_db)):
    iot_service = IoTService(db)
    try:
        return iot_service.register_device(device)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate", response_model=IoTSensorReading)
def simulate_reading(payload: IoTSensorPayload, db: Session = Depends(get_db)):
    iot_service = IoTService(db)
    try:
        return iot_service.process_sensor_payload(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/occupancy/{room_id}")
def get_occupancy(room_id: int, db: Session = Depends(get_db)):
    iot_service = IoTService(db)
    return iot_service.get_room_occupancy(room_id)