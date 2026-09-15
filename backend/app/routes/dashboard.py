from fastapi import APIRouter, Depends, Query
from datetime import date, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room, ElectricityReading, Settings
from ..services.ai_service import AIAnalysisService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
def dashboard_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    settings = db.query(Settings).first()
    campus_name = settings.campus_name if settings else "Campus"
    
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    query = db.query(ElectricityReading).filter(ElectricityReading.date >= start_date, ElectricityReading.date <= end_date)
    readings = query.all()
    
    total_kwh = sum(r.energy_kwh for r in readings)
    rooms_count = db.query(Room).count()
    
    ai = AIAnalysisService(db)
    analysis = ai.analyze_all(start_date, end_date)
    waste_kwh = sum(r.get("estimated_waste_kwh", 0) for r in analysis)
    cost = total_kwh * (settings.tariff_per_kwh if settings else 8.5)
    active_alerts = len([r for r in analysis if r.get("priority") == "high"])
    
    return {
        "campus_name": campus_name,
        "total_consumption_kwh": round(total_kwh, 2),
        "estimated_waste_kwh": round(waste_kwh, 2),
        "estimated_cost_inr": round(cost, 2),
        "rooms_monitored": rooms_count,
        "active_alerts": active_alerts,
        "date_range": {"start": str(start_date), "end": str(end_date)},
    }

@router.get("/trends")
def dashboard_trends(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    ai = AIAnalysisService(db)
    return ai.get_daily_trends(start_date, end_date)

@router.get("/room-breakdown")
def dashboard_room_breakdown(db: Session = Depends(get_db)):
    rooms = db.query(Room).all()
    result = []
    for room in rooms:
        readings = db.query(ElectricityReading).filter(ElectricityReading.room_id == room.id).all()
        total = sum(r.energy_kwh for r in readings)
        result.append({
            "room_id": room.id,
            "room_name": room.name,
            "building": room.building,
            "room_type": room.room_type.value,
            "total_consumption_kwh": round(total, 2),
            "reading_count": len(readings),
        })
    result.sort(key=lambda x: x["total_consumption_kwh"], reverse=True)
    return result

@router.get("/off-hours")
def dashboard_off_hours(db: Session = Depends(get_db)):
    ai = AIAnalysisService(db)
    return ai.get_off_hours_analysis()
