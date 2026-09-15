from fastapi import APIRouter, Depends, Query
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Recommendation, RecommendationStatus
from ..schemas import RecommendationResponse, AIRecommendation
from ..services.ai_service import AIAnalysisService

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/analyze")
def analyze(db: Session = Depends(get_db), start_date: Optional[date] = Query(None), end_date: Optional[date] = Query(None)):
    ai = AIAnalysisService(db)
    results = ai.analyze_all(start_date, end_date)
    return {"recommendations": results, "count": len(results)}

@router.get("/recommendations")
def get_recommendations(
    db: Session = Depends(get_db),
    status: Optional[RecommendationStatus] = Query(None),
    room_id: Optional[int] = Query(None),
):
    query = db.query(Recommendation)
    if status:
        query = query.filter(Recommendation.status == status)
    if room_id:
        query = query.filter(Recommendation.room_id == room_id)
    recs = query.order_by(Recommendation.created_at.desc()).all()
    ai = AIAnalysisService(db)
    return [ai._rec_to_dict(r) for r in recs]

@router.patch("/recommendations/{rec_id}", response_model=RecommendationResponse)
def update_recommendation(
    rec_id: int,
    status: RecommendationStatus,
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = status
    db.commit()
    db.refresh(rec)
    ai = AIAnalysisService(db)
    return ai._rec_to_dict(rec)