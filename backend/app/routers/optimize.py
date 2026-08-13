from fastapi import APIRouter

from ..models import OptimizeIn, OptimizeOut
from ..services.optimizer import Stop, optimize

router = APIRouter(prefix="/optimize", tags=["optimize"])


@router.post("", response_model=OptimizeOut)
def do_optimize(body: OptimizeIn):
    stops = [
        Stop(
            id=s.id, lat=s.lat, lon=s.lon, demand=s.demand,
            service_time_s=s.service_time_s, tw_start_s=s.tw_start_s, tw_end_s=s.tw_end_s,
        )
        for s in body.stops
    ]
    res = optimize(
        stops,
        depot_index=body.depot_index,
        round_trip=body.round_trip,
        vehicle_capacity=body.vehicle_capacity,
        time_limit_s=body.time_limit_s,
    )
    return OptimizeOut(
        order=res.order,
        total_distance_m=round(res.total_distance_m, 1),
        total_distance_km=round(res.total_distance_m / 1000.0, 2),
        legs_m=[round(x, 1) for x in res.legs_m],
        solver=res.solver,
        round_trip=res.round_trip,
    )
