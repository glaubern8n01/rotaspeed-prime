"""
Geocodificação de endereços -> coordenadas.

Provedor padrão: Nominatim (OpenStreetMap) — gratuito e sem chave de API.
Para produção com volume alto, troque `NOMINATIM_URL` por uma instância própria
ou configure um provedor pago (Google/Mapbox) via variável de ambiente.

Devolve um nível de confiança, inspirado no `GeocodeConfidenceLevel` do Circuit.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

import httpx

NOMINATIM_URL = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org/search")
USER_AGENT = os.getenv("GEOCODER_UA", "RotaSpeedPrime/1.0 (contato@exemplo.com)")
DEFAULT_COUNTRY = os.getenv("GEOCODER_COUNTRY", "br")


@dataclass
class GeocodeResult:
    query: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    display_name: Optional[str] = None
    confidence: str = "none"  # high | medium | low | none
    provider: str = "nominatim"


def _confidence_from_importance(importance: float | None, klass: str | None) -> str:
    if importance is None:
        return "low"
    if klass in {"building", "place", "highway"} and importance >= 0.4:
        return "high"
    if importance >= 0.5:
        return "high"
    if importance >= 0.3:
        return "medium"
    return "low"


async def geocode(query: str, client: Optional[httpx.AsyncClient] = None) -> GeocodeResult:
    params = {
        "q": query,
        "format": "jsonv2",
        "limit": 1,
        "countrycodes": DEFAULT_COUNTRY,
        "addressdetails": 0,
    }
    headers = {"User-Agent": USER_AGENT}
    owns = client is None
    client = client or httpx.AsyncClient(timeout=15)
    try:
        r = await client.get(NOMINATIM_URL, params=params, headers=headers)
        r.raise_for_status()
        data = r.json()
        if not data:
            return GeocodeResult(query=query, confidence="none")
        top = data[0]
        return GeocodeResult(
            query=query,
            lat=float(top["lat"]),
            lon=float(top["lon"]),
            display_name=top.get("display_name"),
            confidence=_confidence_from_importance(
                float(top["importance"]) if "importance" in top else None,
                top.get("class"),
            ),
        )
    except Exception:
        return GeocodeResult(query=query, confidence="none")
    finally:
        if owns:
            await client.aclose()
