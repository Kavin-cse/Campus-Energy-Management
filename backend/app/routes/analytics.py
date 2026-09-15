from fastapi import APIRouter, Depends, Query
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.ai_service import AIAnalysisService

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/")
def analytics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    ai = AIAnalysisService(db)
    return {
        "trends": ai.get_daily_trends(start_date, end_date),
        "room_comparison": ai.get_campus_comparison(start_date, end_date),
        "peak_hours": ai.get_peak_hours(start_date, end_date),
        "off_hours": ai.get_off_hours_analysis(start_date, end_date),
        "occupancy": ai.get_occupancy_comparison(start_date, end_date),
    }