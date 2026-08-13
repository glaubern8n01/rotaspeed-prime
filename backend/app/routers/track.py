from fastapi import APIRouter
from pydantic import BaseModel

from ..services.tracking import TrackPoint, summarize

router = APIRouter(prefix="/track", tags=["track"])


class PointIn(BaseModel):
    lat: float
    lon: float
    t: float  # epoch (segundos)


class TrackIn(BaseModel):
    points: list[PointIn]
    delivered_count: int = 0


class TrackOut(BaseModel):
    distance_km: float
    distance_m: float
    duration_s: int
    moving_s: int
    avg_speed_kmh: float
    avg_pace_min_km: float
    points: int
    delivered_count: int
    resumo: str


@router.post("/summary", response_model=TrackOut)
def track_summary(body: TrackIn):
    s = summarize([TrackPoint(p.lat, p.lon, p.t) for p in body.points])
    resumo = (
        f"Hoje você rodou {s.distance_km:.1f} km em "
        f"{s.duration_s // 3600}h{(s.duration_s % 3600) // 60:02d} "
        f"e entregou {body.delivered_count} pacotes. 🚀"
    )
    return TrackOut(
        distance_km=s.distance_km, distance_m=s.distance_m, duration_s=s.duration_s,
        moving_s=s.moving_s, avg_speed_kmh=s.avg_speed_kmh,
        avg_pace_min_km=s.avg_pace_min_km, points=s.points,
        delivered_count=body.delivered_count, resumo=resumo,
    )
