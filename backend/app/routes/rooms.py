from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room, RoomType
from ..schemas import RoomCreate, RoomUpdate, RoomResponse
from ..services.rooms_service import RoomService

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("/", response_model=list[RoomResponse])
def list_rooms(db: Session = Depends(get_db), building: str = Query(None), room_type: RoomType = Query(None)):
    svc = RoomService(db)
    return svc.list_rooms(building=building, room_type=room_type)

@router.post("/", response_model=RoomResponse, status_code=201)
def create_room(data: RoomCreate, db: Session = Depends(get_db)):
    svc = RoomService(db)
    return svc.create_room(data)

@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    svc = RoomService(db)
    room = svc.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, data: RoomUpdate, db: Session = Depends(get_db)):
    svc = RoomService(db)
    room = svc.update_room(room_id, data.model_dump(exclude_unset=True))
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.delete("/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    svc = RoomService(db)
    if not svc.delete_room(room_id):
        raise HTTPException(status_code=404, detail="Room not found")
    return None