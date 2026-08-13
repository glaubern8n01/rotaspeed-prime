"""Configuração via variáveis de ambiente (12-factor)."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _csv(name: str, default: str) -> list[str]:
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


@dataclass
class Settings:
    app_name: str = "RotaSpeed Prime API"
    version: str = "1.0.0"
    # Em produção (app publicado nas lojas) o backend roda na NUVEM, não no PC.
    # Defina CORS_ORIGINS com o domínio do app / o esquema do Capacitor.
    cors_origins: list[str] = field(
        default_factory=lambda: _csv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,capacitor://localhost,https://localhost",
        )
    )
    # Chave simples opcional para proteger a API pública (defina no servidor de nuvem).
    api_key: str | None = os.getenv("ROTASPEED_API_KEY") or None


settings = Settings()
