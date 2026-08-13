"""
RotaSpeed Prime — API Python.

Substitui a dependência do Google Gemini por processamento local/determinístico:
  • /parse/text  · /parse/image · /parse/audio  → endereços a partir de texto, foto ou voz
  • /geocode                                     → endereço → coordenadas (OSM/Nominatim)
  • /optimize                                    → ordem ótima das paradas (OR-Tools/2-opt)
  • /notify/whatsapp · /notify/navigation        → deep-links WhatsApp e mapas
  • /track/summary                               → "modo Strava": km rodados, ritmo, tempo

Projetado para rodar na NUVEM (o app publicado nas lojas consome esta URL).
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import geocode, health, notify, optimize, parse, track

app = FastAPI(title=settings.app_name, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (health.router, parse.router, geocode.router, optimize.router,
          notify.router, track.router):
    app.include_router(r)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "version": settings.version,
        "docs": "/docs",
        "message": "RotaSpeed Prime API — Python, sem Gemini. ✈️",
    }
