import asyncio

import httpx
from fastapi import APIRouter

from ..models import GeocodeIn, GeocodeItemOut, GeocodeOut
from ..services import geocoder

router = APIRouter(prefix="/geocode", tags=["geocode"])


@router.post("", response_model=GeocodeOut)
async def do_geocode(body: GeocodeIn):
    async with httpx.AsyncClient(timeout=15) as client:
        # Nominatim público pede no máx ~1 req/s; serializamos para respeitar.
        results = []
        for q in body.queries:
            res = await geocoder.geocode(q, client)
            results.append(GeocodeItemOut(**res.__dict__))
            if len(body.queries) > 1:
                await asyncio.sleep(1.0)
    return GeocodeOut(results=results)
