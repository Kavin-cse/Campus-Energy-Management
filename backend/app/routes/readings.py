from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from datetime import date
from ..database import get_db
from ..models import ElectricityReading
from ..schemas import ElectricityReadingCreate, ElectricityReadingUpdate, ElectricityReadingResponse
from ..services.readings_service import ReadingsService

router = APIRouter(prefix="/readings", tags=["readings"])

@router.get("/", response_model=list[ElectricityReadingResponse])
def list_readings(db: Session = Depends(get_db), room_id: int = Query(None), start_date: date = Query(None), end_date: date = Query(None)):
    svc = ReadingsService(db)
    return svc.list_readings(room_id=room_id, start_date=start_date, end_date=end_date)

@router.post("/", response_model=ElectricityReadingResponse, status_code=201)
def create_reading(data: ElectricityReadingCreate, db: Session = Depends(get_db)):
    svc = ReadingsService(db)
    return svc.create_reading(data)

@router.delete("/{reading_id}", status_code=204)
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    svc = ReadingsService(db)
    if not svc.delete_reading(reading_id):
        raise HTTPException(status_code=404, detail="Reading not found")
    return None

@router.post("/import", status_code=201)
def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = file.file.read().decode("utf-8")
    svc = ReadingsService(db)
    return svc.import_csv(content)
