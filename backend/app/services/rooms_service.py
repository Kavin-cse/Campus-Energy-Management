"""Room management service."""
from sqlalchemy.orm import Session
from ..models import Room, RoomType

class RoomService:
    def __init__(self, db: Session):
        self.db = db

    def list_rooms(self, building=None, room_type=None):
        query = self.db.query(Room)
        if building:
            query = query.filter(Room.building == building)
        if room_type:
            query = query.filter(Room.room_type == room_type)
        return query.order_by(Room.building, Room.name).all()

    def get_room(self, room_id):
        return self.db.query(Room).filter(Room.id == room_id).first()

    def create_room(self, data):
        room = Room(
            name=data.name,
            building=data.building,
            room_type=data.room_type,
            capacity=data.capacity,
            operating_start=data.operating_start,
            operating_end=data.operating_end,
        )
        self.db.add(room)
        self.db.commit()
        self.db.refresh(room)
        return room

    def update_room(self, room_id, data):
        room = self.get_room(room_id)
        if not room:
            return None
        for key, value in data.items():
            if hasattr(room, key):
                setattr(room, key, value)
        self.db.commit()
        self.db.refresh(room)
        return room

    def delete_room(self, room_id):
        room = self.get_room(room_id)
        if not room:
            return False
        self.db.delete(room)
        self.db.commit()
        return True
