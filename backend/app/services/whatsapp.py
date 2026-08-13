"""
Integração com WhatsApp (e navegação por mapas) via deep-links.

Não envia mensagem automaticamente (isso exigiria API oficial/Business e
consentimento) — gera o link `wa.me` com a mensagem pré-preenchida para o
telefone cadastrado do cliente. O entregador toca e o WhatsApp abre pronto.

Também monta os links de navegação (Google Maps / Waze / Apple Maps), como no
`NavigationApp` do Circuit.
"""
from __future__ import annotations

import re
import urllib.parse

DDI_BR = "55"


def normalize_phone_br(phone: str) -> str | None:
    """Normaliza um telefone brasileiro para o formato E.164 sem '+': 55DDDXXXXXXXX."""
    digits = re.sub(r"\D", "", phone or "")
    if not digits:
        return None
    if digits.startswith("00"):
        digits = digits[2:]
    if not digits.startswith(DDI_BR):
        # assume número nacional (10 ou 11 dígitos com DDD)
        if len(digits) in (10, 11):
            digits = DDI_BR + digits
    if len(digits) < 12:
        return None
    return digits


MSG_TEMPLATES = {
    "a_caminho": "Olá {nome}! Sou {entregador} e estou a caminho com a sua entrega. 📦",
    "cheguei": "Olá {nome}! Cheguei com a sua entrega no endereço {endereco}. 🛵",
    "sem_sucesso": "Olá {nome}, tentei entregar seu pacote mas não consegui contato. "
                   "Podemos combinar um novo horário?",
}


def build_message(template: str, *, nome: str = "", entregador: str = "",
                  endereco: str = "") -> str:
    base = MSG_TEMPLATES.get(template, template)
    return base.format(nome=nome or "cliente", entregador=entregador or "seu entregador",
                       endereco=endereco or "")


def whatsapp_link(phone: str, message: str = "") -> str | None:
    num = normalize_phone_br(phone)
    if not num:
        return None
    q = f"?text={urllib.parse.quote(message)}" if message else ""
    return f"https://wa.me/{num}{q}"


def navigation_links(lat: float, lon: float, label: str = "") -> dict[str, str]:
    ll = f"{lat},{lon}"
    label_q = urllib.parse.quote(label or ll)
    return {
        "google": f"https://www.google.com/maps/dir/?api=1&destination={ll}",
        "waze": f"https://waze.com/ul?ll={ll}&navigate=yes",
        "apple": f"https://maps.apple.com/?daddr={ll}&q={label_q}",
        "geo": f"geo:{ll}?q={ll}({label_q})",
    }
