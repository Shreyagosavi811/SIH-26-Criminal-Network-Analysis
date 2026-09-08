"""
SIH26189 Spatial Speed Validator
Uses the Haversine formula to calculate travel distances between consecutive location spots
and enforces max speed limits (e.g. 120 km/h for vehicles).
"""

import math
from datetime import datetime
from typing import Dict, Any, List, Tuple


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class SpatialValidator:
    def __init__(self, max_speed_kmh: float = 120.0):
        self.max_speed_kmh = max_speed_kmh

    def validate_travel_speed(
        self,
        spot1: Tuple[float, float, str],  # lat, lon, iso_timestamp
        spot2: Tuple[float, float, str]
    ) -> Tuple[bool, str]:
        lat1, lon1, ts1_str = spot1
        lat2, lon2, ts2_str = spot2

        dt1 = datetime.fromisoformat(ts1_str.replace("Z", ""))
        dt2 = datetime.fromisoformat(ts2_str.replace("Z", ""))

        delta_hours = abs((dt2 - dt1).total_seconds()) / 3600.0
        if delta_hours == 0:
            if lat1 == lat2 and lon1 == lon2:
                return True, "Co-located at same spot"
            else:
                return False, f"Impossible teleportation: different spots ({lat1},{lon1}) and ({lat2},{lon2}) at exact same timestamp {ts1_str}"

        dist_km = haversine_distance_km(lat1, lon1, lat2, lon2)
        speed_kmh = dist_km / delta_hours

        if speed_kmh > self.max_speed_kmh:
            return False, f"Speed limit violation: Travel distance {dist_km:.2f} km in {delta_hours*60:.1f} mins required {speed_kmh:.1f} km/h (Max: {self.max_speed_kmh} km/h)"

        return True, f"Valid travel: {speed_kmh:.1f} km/h"
