"""Electricity reading management service."""
from sqlalchemy.orm import Session
from ..models import ElectricityReading
import csv
import io

class ReadingsService:
    def __init__(self, db: Session):
        self.db = db

    def list_readings(self, room_id=None, start_date=None, end_date=None):
        query = self.db.query(ElectricityReading)
        if room_id:
            query = query.filter(ElectricityReading.room_id == room_id)
        if start_date:
            query = query.filter(ElectricityReading.date >= start_date)
        if end_date:
            query = query.filter(ElectricityReading.date <= end_date)
        return query.order_by(ElectricityReading.date.desc(), ElectricityReading.start_time).all()

    def get_reading(self, reading_id):
        return self.db.query(ElectricityReading).filter(ElectricityReading.id == reading_id).first()

    def create_reading(self, data):
        reading = ElectricityReading(
            room_id=data.room_id,
            date=data.date,
            start_time=data.start_time,
            end_time=data.end_time,
            energy_kwh=data.energy_kwh,
            occupancy_count=data.occupancy_count,
            is_occupied=data.is_occupied,
            notes=data.notes,
        )
        self.db.add(reading)
        self.db.commit()
        self.db.refresh(reading)
        return reading

    def delete_reading(self, reading_id):
        reading = self.get_reading(reading_id)
        if not reading:
            return False
        self.db.delete(reading)
        self.db.commit()
        return True

    def import_csv(self, csv_content: str):
        """Import readings from CSV content.
        Expected columns: room_id,date,start_time,end_time,energy_kwh,occupancy_count,is_occupied,notes
        """
        errors = []
        imported = 0
        reader = csv.DictReader(io.StringIO(csv_content))
        required_cols = ['room_id', 'date', 'start_time', 'end_time', 'energy_kwh', 'occupancy_count', 'is_occupied']
        for col in required_cols:
            if col not in reader.fieldnames:
                return {"success": False, "imported": 0, "errors": [f"Missing required column: {col}"], "message": "CSV format error"}
        for row_num, row in enumerate(reader, start=2):
            try:
                data = {
                    'room_id': int(row['room_id']),
                    'date': row['date'],
                    'start_time': row['start_time'],
                    'end_time': row['end_time'],
                    'energy_kwh': float(row['energy_kwh']),
                    'occupancy_count': int(row['occupancy_count']),
                    'is_occupied': row['is_occupied'].lower() in ('true', '1', 'yes'),
                    'notes': row.get('notes', ''),
                }
                # Validate room exists
                from ..models import Room
                if not self.db.query(Room).filter(Room.id == data['room_id']).first():
                    raise ValueError(f"Room {data['room_id']} not found")
                self.create_reading(data)
                imported += 1
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        return {"success": True, "imported": imported, "errors": errors, "message": "Import completed" if not errors else "Import completed with errors"}
