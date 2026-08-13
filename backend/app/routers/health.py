from fastapi import APIRouter

from ..config import settings
from ..services.optimizer import HAS_ORTOOLS

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.version,
        "engine": "ortools" if HAS_ORTOOLS else "2opt-fallback",
    }
