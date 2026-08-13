"""Schemas Pydantic da API pública."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ----- parse ------------------------------------------------------------- #
class ParseTextIn(BaseModel):
    text: str = Field(..., description="Texto livre com um ou vários endereços.")
    multi: bool = Field(True, description="Se True, separa em vários endereços.")


class ParsedAddressOut(BaseModel):
    full_address: str
    street: Optional[str] = None
    number: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    cep: Optional[str] = None
    recipient_name: Optional[str] = None
    telefone: Optional[str] = None
    confidence: float = 0.0


class ParseOut(BaseModel):
    addresses: list[ParsedAddressOut]
    source: str = "text"


# ----- geocode ----------------------------------------------------------- #
class GeocodeIn(BaseModel):
    queries: list[str] = Field(..., description="Endereços em texto para geocodificar.")


class GeocodeItemOut(BaseModel):
    query: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    display_name: Optional[str] = None
    confidence: str = "none"
    provider: str = "nominatim"


class GeocodeOut(BaseModel):
    results: list[GeocodeItemOut]


# ----- optimize ---------------------------------------------------------- #
class StopIn(BaseModel):
    id: str
    lat: float
    lon: float
    demand: int = 0
    service_time_s: int = 0
    tw_start_s: Optional[int] = None
    tw_end_s: Optional[int] = None


class OptimizeIn(BaseModel):
    stops: list[StopIn]
    depot_index: int = 0
    round_trip: bool = False
    vehicle_capacity: Optional[int] = None
    time_limit_s: int = 5


class OptimizeOut(BaseModel):
    order: list[str]
    total_distance_m: float
    total_distance_km: float
    legs_m: list[float]
    solver: str
    round_trip: bool
