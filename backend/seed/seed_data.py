from datetime import date, time, timedelta
from sqlalchemy.orm import Session
from ..database import SessionLocal, init_db
from ..models import Room, RoomType, ElectricityReading, Settings, Recommendation, RecommendationStatus
import random

ROOMS = [
    ("Classroom 101", "Engineering Block A", RoomType.CLASSROOM, 60, time(8, 0), time(17, 0)),
    ("Classroom 102", "Engineering Block A", RoomType.CLASSROOM, 60, time(8, 0), time(17, 0)),
    ("Computer Lab 1", "Engineering Block A", RoomType.COMPUTER_LAB, 40, time(9, 0), time(18, 0)),
    ("Computer Lab 2", "Engineering Block B", RoomType.COMPUTER_LAB, 40, time(9, 0), time(18, 0)),
    ("Physics Lab", "Science Block", RoomType.PHYSICS_LAB, 30, time(9, 0), time(17, 0)),
    ("Electronics Lab", "Engineering Block B", RoomType.ELECTRONICS_LAB, 30, time(9, 0), time(17, 0)),
    ("Chemistry Lab", "Science Block", RoomType.CHEMISTRY_LAB, 30, time(9, 0), time(17, 0)),
    ("Seminar Hall", "Central Block", RoomType.OTHER, 120, time(9, 0), time(19, 0)),
]

def seed_data():
    init_db()
    db = SessionLocal()
    try:
        db.query(Recommendation).delete()
        db.query(ElectricityReading).delete()
        db.query(Room).delete()
        db.query(Settings).delete()
        db.commit()

        settings = Settings(
            campus_name="WattWise Campus",
            tariff_per_kwh=8.5,
            default_operating_start=time(8, 0),
            default_operating_end=time(18, 0),
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

        room_map = {}
        for name, building, room_type, capacity, op_start, op_end in ROOMS:
            room = Room(
                name=name,
                building=building,
                room_type=room_type,
                capacity=capacity,
                operating_start=op_start,
                operating_end=op_end,
            )
            db.add(room)
            db.commit()
            db.refresh(room)
            room_map[name] = room

        random.seed(42)
        today = date.today()
        start_date = today - timedelta(days=30)

        for day_offset in range(30):
            current_date = start_date + timedelta(days=day_offset)
            is_weekend = current_date.weekday() >= 5

            for name, building, room_type, capacity, op_start, op_end in ROOMS:
                room = room_map[name]

                if room_type == RoomType.COMPUTER_LAB:
                    base = 18.0
                elif room_type in (RoomType.PHYSICS_LAB, RoomType.CHEMISTRY_LAB):
                    base = 14.0
                elif room_type == RoomType.ELECTRONICS_LAB:
                    base = 15.0
                elif room_type == RoomType.OTHER:
                    base = 22.0
                else:
                    base = 10.0

                if is_weekend:
                    base *= 0.4

                energy = base * random.uniform(0.85, 1.15)
                occupancy = int(capacity * random.uniform(0.4, 0.8)) if not is_weekend else 0
                is_occupied = occupancy > 0

                db.add(ElectricityReading(
                    room_id=room.id,
                    date=current_date,
                    start_time=time(9, 0),
                    end_time=time(13, 0),
                    energy_kwh=round(energy, 2),
                    occupancy_count=occupancy,
                    is_occupied=is_occupied,
                    notes="Regular daytime usage",
                ))

                db.add(ElectricityReading(
                    room_id=room.id,
                    date=current_date,
                    start_time=time(13, 0),
                    end_time=time(17, 0),
                    energy_kwh=round(energy * random.uniform(0.9, 1.1), 2),
                    occupancy_count=int(occupancy * random.uniform(0.8, 1.0)) if is_occupied else 0,
                    is_occupied=is_occupied,
                    notes="Afternoon session",
                ))

                if room_type in [RoomType.COMPUTER_LAB, RoomType.ELECTRONICS_LAB] and not is_weekend:
                    if random.random() < 0.65:
                        db.add(ElectricityReading(
                            room_id=room.id,
                            date=current_date,
                            start_time=time(18, 0),
                            end_time=time(21, 0),
                            energy_kwh=round(base * random.uniform(0.35, 0.55), 2),
                            occupancy_count=random.randint(2, 8),
                            is_occupied=True,
                            notes="Evening lab session",
                        ))

                if room_type in [RoomType.COMPUTER_LAB, RoomType.PHYSICS_LAB, RoomType.ELECTRONICS_LAB, RoomType.CHEMISTRY_LAB]:
                    if random.random() < 0.5:
                        db.add(ElectricityReading(
                            room_id=room.id,
                            date=current_date,
                            start_time=time(17, 30),
                            end_time=time(19, 0),
                            energy_kwh=round(base * random.uniform(0.25, 0.45), 2),
                            occupancy_count=0,
                            is_occupied=False,
                            notes="Equipment left running after hours",
                        ))

                if day_offset in [5, 12, 20] and room_type == RoomType.COMPUTER_LAB:
                    db.add(ElectricityReading(
                        room_id=room.id,
                        date=current_date,
                        start_time=time(14, 0),
                        end_time=time(16, 0),
                        energy_kwh=round(base * random.uniform(2.5, 3.5), 2),
                        occupancy_count=int(capacity * 0.9),
                        is_occupied=True,
                        notes="High performance computing workload",
                    ))

                if is_weekend and random.random() < 0.3:
                    db.add(ElectricityReading(
                        room_id=room.id,
                        date=current_date,
                        start_time=time(10, 0),
                        end_time=time(13, 0),
                        energy_kwh=round(base * 0.3, 2),
                        occupancy_count=0,
                        is_occupied=False,
                        notes="Weekend maintenance equipment",
                    ))

        db.commit()
        print(f"Seeded {len(room_map)} rooms and 30 days of electricity readings.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
