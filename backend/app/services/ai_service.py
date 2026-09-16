"""AI Analysis Service for Campus Energy Advisor."""
from datetime import date, time, datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np
from collections import defaultdict

from ..models import Room, ElectricityReading, Recommendation, Settings, RecommendationStatus
from ..schemas import AIRecommendation

class AIAnalysisService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = self._get_settings()

    def _get_settings(self) -> Settings:
        settings = self.db.query(Settings).first()
        if not settings:
            settings = Settings()
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings

    def analyze_all(self, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        self.db.query(Recommendation).filter(Recommendation.status == RecommendationStatus.PENDING).delete()
        self.db.commit()
        recommendations = []
        rooms = self._get_rooms_with_readings(start_date, end_date)
        for room in rooms:
            readings = self._get_room_readings(room.id, start_date, end_date)
            if not readings:
                continue
            room_recs = []
            room_recs.extend(self._detect_off_hours_consumption(room, readings))
            room_recs.extend(self._detect_idle_consumption(room, readings))
            room_recs.extend(self._detect_unusual_spikes(room, readings))
            room_recs.extend(self._detect_repeated_waste(room, readings))
            room_recs.extend(self._detect_high_consumption_rooms(room, readings))
            recommendations.extend(room_recs)
        saved_recs = []
        for rec_data in recommendations:
            rec = Recommendation(**rec_data)
            self.db.add(rec)
            saved_recs.append(rec)
        self.db.commit()
        for rec in saved_recs:
            self.db.refresh(rec)
        return [self._rec_to_dict(rec) for rec in saved_recs]

    def _get_rooms_with_readings(self, start_date, end_date):
        query = self.db.query(Room).join(ElectricityReading)
        if start_date:
            query = query.filter(ElectricityReading.date >= start_date)
        if end_date:
            query = query.filter(ElectricityReading.date <= end_date)
        return query.distinct().all()

    def _get_room_readings(self, room_id, start_date, end_date):
        query = self.db.query(ElectricityReading).filter(ElectricityReading.room_id == room_id)
        if start_date:
            query = query.filter(ElectricityReading.date >= start_date)
        if end_date:
            query = query.filter(ElectricityReading.date <= end_date)
        return query.order_by(ElectricityReading.date, ElectricityReading.start_time).all()

    def _is_off_hours(self, room, reading):
        rs = reading.start_time.hour + reading.start_time.minute / 60
        re_ = reading.end_time.hour + reading.end_time.minute / 60
        os_ = room.operating_start.hour + room.operating_start.minute / 60
        oe = room.operating_end.hour + room.operating_end.minute / 60
        return rs < os_ or re_ > oe

    def _get_off_hours_overlap(self, room, reading):
        rs = reading.start_time.hour + reading.start_time.minute / 60
        re_ = reading.end_time.hour + reading.end_time.minute / 60
        os_ = room.operating_start.hour + room.operating_start.minute / 60
        oe = room.operating_end.hour + room.operating_end.minute / 60
        td = re_ - rs
        
        # If it's an instantaneous reading from IoT
        if td <= 0:
            if rs < os_ or re_ > oe:
                return reading.energy_kwh
            return 0.0
            
        oh = 0.0
        if rs < os_:
            oh += min(os_, re_) - rs
        if re_ > oe:
            oh += re_ - max(oe, rs)
        if td > 0:
            return reading.energy_kwh * (oh / td)
        return 0.0

    def _detect_off_hours_consumption(self, room, readings):
        recs = []
        ohr = []
        total_oh = 0.0
        for r in readings:
            if self._is_off_hours(room, r):
                kwh = self._get_off_hours_overlap(room, r)
                if kwh >= self.settings.ai_off_hours_threshold:
                    ohr.append((r, kwh))
                    total_oh += kwh
        if ohr:
            dates = defaultdict(float)
            for r, kwh in ohr:
                dates[r.date] += kwh
            evidence = f"{room.name} consumed {total_oh:.1f} kWh during off-hours across {len(dates)} days."
            for d, kwh in sorted(dates.items()):
                evidence += f" On {d.strftime('%b %d')}: {kwh:.1f} kWh."
            priority = "high" if total_oh > 10 else "medium" if total_oh > 5 else "low"
            recs.append({
                "room_id": room.id,
                "title": f"Off-Hours Consumption in {room.name}",
                "description": f"Detected {total_oh:.1f} kWh of electricity used outside configured operating hours ({room.operating_start.strftime('%H:%M')}-{room.operating_end.strftime('%H:%M')}).",
                "pattern_type": "off_hours",
                "priority": priority,
                "estimated_waste_kwh": round(total_oh, 2),
                "estimated_savings_inr": round(total_oh * self.settings.tariff_per_kwh, 2),
                "status": RecommendationStatus.PENDING,
            })
        return recs

    def _detect_idle_consumption(self, room, readings):
        recs = []
        idle = []
        total_idle = 0.0
        for r in readings:
            if not r.is_occupied or r.occupancy_count == 0:
                if r.energy_kwh >= self.settings.ai_idle_threshold:
                    idle.append(r)
                    total_idle += r.energy_kwh
        if idle:
            dates = defaultdict(float)
            for r in idle:
                dates[r.date] += r.energy_kwh
            evidence = f"{room.name} consumed {total_idle:.1f} kWh while unoccupied across {len(dates)} days."
            for d, kwh in sorted(dates.items()):
                evidence += f" On {d.strftime('%b %d')}: {kwh:.1f} kWh."
            priority = "high" if total_idle > 15 else "medium" if total_idle > 5 else "low"
            recs.append({
                "room_id": room.id,
                "title": f"Idle Consumption in {room.name}",
                "description": f"Detected {total_idle:.1f} kWh of electricity used when room was marked unoccupied or had zero occupancy.",
                "pattern_type": "idle",
                "priority": priority,
                "estimated_waste_kwh": round(total_idle, 2),
                "estimated_savings_inr": round(total_idle * self.settings.tariff_per_kwh, 2),
                "status": RecommendationStatus.PENDING,
            })
        return recs

    def _detect_unusual_spikes(self, room, readings):
        recs = []
        if len(readings) < 5:
            return recs
        energies = [r.energy_kwh for r in readings]
        mean_e = np.mean(energies)
        std_e = np.std(energies)
        if std_e == 0:
            return recs
        threshold = mean_e + (self.settings.ai_spike_multiplier * std_e)
        spikes = [r for r in readings if r.energy_kwh > threshold]
        if spikes:
            excess = sum(r.energy_kwh - mean_e for r in spikes)
            evidence = f"{room.name} had {len(spikes)} unusual spike(s) above baseline ({mean_e:.1f} kWh +/- {std_e:.1f})."
            for r in spikes[:3]:
                evidence += f" On {r.date.strftime('%b %d')} at {r.start_time.strftime('%H:%M')}: {r.energy_kwh:.1f} kWh."
            if len(spikes) > 3:
                evidence += f" And {len(spikes) - 3} more."
            priority = "high" if len(spikes) > 5 else "medium" if len(spikes) > 2 else "low"
            recs.append({
                "room_id": room.id,
                "title": f"Unusual Consumption Spikes in {room.name}",
                "description": f"Detected {len(spikes)} reading(s) significantly above the room's baseline average of {mean_e:.1f} kWh.",
                "pattern_type": "spike",
                "priority": priority,
                "estimated_waste_kwh": round(excess, 2),
                "estimated_savings_inr": round(excess * self.settings.tariff_per_kwh, 2),
                "status": RecommendationStatus.PENDING,
            })
        return recs

    def _detect_repeated_waste(self, room, readings):
        recs = []
        daily_oh = defaultdict(float)
        daily_idle = defaultdict(float)
        for r in readings:
            if self._is_off_hours(room, r):
                daily_oh[r.date] += self._get_off_hours_overlap(room, r)
            if not r.is_occupied or r.occupancy_count == 0:
                daily_idle[r.date] += r.energy_kwh
        oh_days = sum(1 for v in daily_oh.values() if v >= self.settings.ai_off_hours_threshold)
        idle_days = sum(1 for v in daily_idle.values() if v >= self.settings.ai_idle_threshold)
        total_waste_days = len(set(list(daily_oh.keys()) + list(daily_idle.keys())))
        if total_waste_days >= 3:
            total_waste = sum(daily_oh.values()) + sum(daily_idle.values())
            evidence = f"{room.name} shows recurring waste on {total_waste_days} days."
            if oh_days > 0:
                evidence += f" Off-hours waste on {oh_days} days."
            if idle_days > 0:
                evidence += f" Idle consumption on {idle_days} days."
            priority = "high" if total_waste_days >= 7 else "medium"
            recs.append({
                "room_id": room.id,
                "title": f"Recurring Energy Waste in {room.name}",
                "description": f"Persistent energy waste pattern detected across {total_waste_days} days, indicating systemic issue.",
                "pattern_type": "repeated_waste",
                "priority": priority,
                "estimated_waste_kwh": round(total_waste, 2),
                "estimated_savings_inr": round(total_waste * self.settings.tariff_per_kwh, 2),
                "status": RecommendationStatus.PENDING,
            })
        return recs

    def _detect_high_consumption_rooms(self, room, readings):
        return []

    def _rec_to_dict(self, rec):
        room = self.db.query(Room).filter(Room.id == rec.room_id).first()
        return {
            "id": rec.id,
            "room_id": rec.room_id,
            "room_name": room.name if room else "Unknown",
            "building": room.building if room else "Unknown",
            "title": rec.title,
            "description": rec.description,
            "pattern_type": rec.pattern_type,
            "priority": rec.priority,
            "estimated_waste_kwh": rec.estimated_waste_kwh,
            "estimated_savings_inr": rec.estimated_savings_inr,
            "status": rec.status,
            "evidence": rec.description,
            "created_at": rec.created_at,
        }

    def calculate_waste_score(self, room, readings):
        if not readings:
            return 0
        total_kwh = sum(r.energy_kwh for r in readings)
        if total_kwh == 0:
            return 0
        waste_kwh = 0.0
        for r in readings:
            if self._is_off_hours(room, r):
                waste_kwh += self._get_off_hours_overlap(room, r)
            if not r.is_occupied or r.occupancy_count == 0:
                waste_kwh += r.energy_kwh
        waste_ratio = waste_kwh / (total_kwh * 2)
        score = min(100, int(waste_ratio * 100 + (waste_kwh / max(total_kwh, 1)) * 50))
        return min(100, max(0, score))

    def get_campus_comparison(self, start_date=None, end_date=None):
        rooms = self.db.query(Room).all()
        comparison = []
        for room in rooms:
            readings = self._get_room_readings(room.id, start_date, end_date)
            if not readings:
                continue
            total_kwh = sum(r.energy_kwh for r in readings)
            waste_score = self.calculate_waste_score(room, readings)
            waste_kwh = 0.0
            for r in readings:
                if self._is_off_hours(room, r):
                    waste_kwh += self._get_off_hours_overlap(room, r)
                if not r.is_occupied or r.occupancy_count == 0:
                    waste_kwh += r.energy_kwh
            comparison.append({
                "room_id": room.id,
                "room_name": room.name,
                "building": room.building,
                "room_type": room.room_type.value,
                "total_consumption_kwh": round(total_kwh, 2),
                "waste_kwh": round(waste_kwh, 2),
                "waste_score": waste_score,
                "reading_count": len(readings),
            })
        comparison.sort(key=lambda x: x["waste_score"], reverse=True)
        return comparison

    def get_daily_trends(self, start_date=None, end_date=None):
        query = self.db.query(ElectricityReading.date, func.sum(ElectricityReading.energy_kwh).label('total_kwh')).group_by(ElectricityReading.date)
        if start_date:
            query = query.filter(ElectricityReading.date >= start_date)
        if end_date:
            query = query.filter(ElectricityReading.date <= end_date)
        results = query.order_by(ElectricityReading.date).all()
        trends = []
        for row in results:
            day_readings = self.db.query(ElectricityReading).filter(ElectricityReading.date == row.date).all()
            waste_kwh = 0.0
            for r in day_readings:
                room = self.db.query(Room).filter(Room.id == r.room_id).first()
                if room:
                    if self._is_off_hours(room, r):
                        waste_kwh += self._get_off_hours_overlap(room, r)
                    if not r.is_occupied or r.occupancy_count == 0:
                        waste_kwh += r.energy_kwh
            trends.append({
                "date": row.date,
                "total_kwh": round(row.total_kwh, 2),
                "waste_kwh": round(waste_kwh, 2),
                "cost_inr": round(row.total_kwh * self.settings.tariff_per_kwh, 2),
            })
        return trends

    def get_off_hours_analysis(self, start_date=None, end_date=None):
        rooms = self.db.query(Room).all()
        results = []
        for room in rooms:
            readings = self._get_room_readings(room.id, start_date, end_date)
            if not readings:
                continue
            total_kwh = sum(r.energy_kwh for r in readings)
            off_kwh = 0.0
            for r in readings:
                if self._is_off_hours(room, r):
                    off_kwh += self._get_off_hours_overlap(room, r)
            if total_kwh > 0:
                results.append({
                    "room_id": room.id,
                    "room_name": room.name,
                    "building": room.building,
                    "off_hours_kwh": round(off_kwh, 2),
                    "total_kwh": round(total_kwh, 2),
                    "waste_percentage": round((off_kwh / total_kwh) * 100, 1),
                })
        results.sort(key=lambda x: x["off_hours_kwh"], reverse=True)
        return results

    def get_peak_hours(self, start_date=None, end_date=None):
        query = self.db.query(ElectricityReading)
        if start_date:
            query = query.filter(ElectricityReading.date >= start_date)
        if end_date:
            query = query.filter(ElectricityReading.date <= end_date)
        readings = query.all()
        hourly = defaultdict(lambda: {"kwh": 0.0, "count": 0})
        for r in readings:
            sh = r.start_time.hour
            eh = r.end_time.hour
            dur = eh - sh
            if dur <= 0:
                dur = 1
            per_hour = r.energy_kwh / dur
            for h in range(sh, eh):
                hourly[h]["kwh"] += per_hour
                hourly[h]["count"] += 1
        results = []
        for h in range(24):
            d = hourly[h]
            results.append({"hour": h, "total_kwh": round(d["kwh"], 2), "reading_count": d["count"]})
        return results

    def get_occupancy_comparison(self, start_date=None, end_date=None):
        query = self.db.query(ElectricityReading)
        if start_date:
            query = query.filter(ElectricityReading.date >= start_date)
        if end_date:
            query = query.filter(ElectricityReading.date <= end_date)
        readings = query.all()
        occ_kwh = sum(r.energy_kwh for r in readings if r.is_occupied and r.occupancy_count > 0)
        unocc_kwh = sum(r.energy_kwh for r in readings if not r.is_occupied or r.occupancy_count == 0)
        total_kwh = occ_kwh + unocc_kwh
        return {
            "occupied_kwh": round(occ_kwh, 2),
            "unoccupied_kwh": round(unocc_kwh, 2),
            "occupied_percentage": round((occ_kwh / total_kwh * 100) if total_kwh > 0 else 0, 1),
        }
