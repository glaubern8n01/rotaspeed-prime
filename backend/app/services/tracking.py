"""
Modo "Strava do entregador" — telemetria da jornada de entregas.

Recebe os pontos de GPS (breadcrumbs) coletados pelo app e devolve distância
percorrida, duração, ritmo médio, velocidade e um resumo por parada entregue.
Vira estatística/gamificação: "hoje você rodou 42,7 km e entregou 63 pacotes".

Puro Python, sem serviço externo.
"""
from __future__ import annotations

from dataclasses import dataclass

from .optimizer import haversine


@dataclass
class TrackPoint:
    lat: float
    lon: float
    t: float  # epoch em segundos


@dataclass
class TrackSummary:
    distance_m: float
    distance_km: float
    duration_s: int
    moving_s: int
    avg_speed_kmh: float
    avg_pace_min_km: float
    points: int


def summarize(points: list[TrackPoint], stop_speed_mps: float = 0.5) -> TrackSummary:
    if len(points) < 2:
        return TrackSummary(0, 0, 0, 0, 0, 0, len(points))
    pts = sorted(points, key=lambda p: p.t)
    dist = 0.0
    moving = 0
    for a, b in zip(pts, pts[1:]):
        d = haversine((a.lat, a.lon), (b.lat, b.lon))
        dt = max(0.0, b.t - a.t)
        dist += d
        if dt > 0 and (d / dt) >= stop_speed_mps:
            moving += int(dt)
    duration = int(pts[-1].t - pts[0].t)
    hours = duration / 3600 if duration else 0
    km = dist / 1000
    avg_speed = (km / hours) if hours else 0.0
    avg_pace = (duration / 60 / km) if km else 0.0
    return TrackSummary(
        distance_m=round(dist, 1),
        distance_km=round(km, 2),
        duration_s=duration,
        moving_s=moving,
        avg_speed_kmh=round(avg_speed, 1),
        avg_pace_min_km=round(avg_pace, 2),
        points=len(pts),
    )
