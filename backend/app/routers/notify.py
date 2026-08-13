from fastapi import APIRouter
from pydantic import BaseModel

from ..services import whatsapp

router = APIRouter(prefix="/notify", tags=["notify"])


class WhatsAppIn(BaseModel):
    phone: str
    template: str = "a_caminho"  # a_caminho | cheguei | sem_sucesso | ou texto livre
    nome: str = ""
    entregador: str = ""
    endereco: str = ""


class WhatsAppOut(BaseModel):
    ok: bool
    link: str | None = None
    message: str


@router.post("/whatsapp", response_model=WhatsAppOut)
def whatsapp_deeplink(body: WhatsAppIn):
    msg = whatsapp.build_message(
        body.template, nome=body.nome, entregador=body.entregador, endereco=body.endereco
    )
    link = whatsapp.whatsapp_link(body.phone, msg)
    return WhatsAppOut(ok=link is not None, link=link, message=msg)


class NavIn(BaseModel):
    lat: float
    lon: float
    label: str = ""


@router.post("/navigation")
def navigation(body: NavIn):
    return whatsapp.navigation_links(body.lat, body.lon, body.label)
