"""
Parser de endereços brasileiros — substitui a extração feita pelo Gemini.

Trabalha em texto livre (colado, OCR de foto/etiqueta, PDF ou planilha) e devolve
campos estruturados: logradouro, número, complemento, bairro, cidade, UF, CEP e
nome do destinatário. 100% Python, offline, sem custo por chamada.

Não é "IA mágica", mas é determinístico, auditável e cobre o formato de etiqueta
de e-commerce brasileiro (Correios/transportadoras), que é onde o entregador vive.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, asdict
from typing import Optional

CEP_RE = re.compile(r"(\d{5})[-.\s]?(\d{3})")
UF_RE = re.compile(
    r"\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b"
)
NUM_RE = re.compile(r"(?:n[º°o.]?\s*|,\s*|\bnumero\s*|\bnro\s*)(\d{1,6})\b", re.IGNORECASE)
LOGRADOURO_RE = re.compile(
    r"\b(rua|r\.|av\.?|avenida|travessa|tv\.?|alameda|al\.?|rodovia|rod\.?|estrada|"
    r"praca|praça|largo|viela|passagem|quadra|q\.?|conjunto|servidao|servidão)\b",
    re.IGNORECASE,
)
BAIRRO_HINT_RE = re.compile(r"\b(bairro|bro\.?|b\.)\s*[:\-]?\s*([^\n,;]+)", re.IGNORECASE)
COMPL_RE = re.compile(
    r"\b(apto?\.?|apartamento|bloco|bl\.?|casa|fundos|frente|sala|loja|lote|"
    r"andar|cond\.?|condominio|condomínio|ponto de referencia|referencia|referência)\b"
    r"[:\-\s]*([^\n,;]*)",
    re.IGNORECASE,
)
NAME_HINT_RE = re.compile(
    r"\b(destinat[aá]rio|nome|cliente|para)\s*[:\-]\s*([^\n]+)", re.IGNORECASE
)
PHONE_RE = re.compile(r"(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}")


@dataclass
class ParsedAddress:
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

    def dict(self) -> dict:
        return asdict(self)


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip(" ,;-\t")


def parse_one(text: str) -> ParsedAddress:
    """Faz o parse de UM endereço (um bloco de texto)."""
    raw = text.strip()
    flat = _clean(raw)
    out = ParsedAddress(full_address=flat)
    score = 0

    # CEP
    m = CEP_RE.search(flat)
    if m:
        out.cep = f"{m.group(1)}-{m.group(2)}"
        score += 2

    # UF
    m = UF_RE.search(flat)
    if m:
        out.state = m.group(1).upper()
        score += 1

    # Telefone
    m = PHONE_RE.search(flat)
    if m and len(re.sub(r"\D", "", m.group(0))) >= 10:
        out.telefone = m.group(0).strip()

    # Nome do destinatário (linha com "Nome:" / "Destinatário:")
    m = NAME_HINT_RE.search(raw)
    if m:
        out.recipient_name = _clean(m.group(2))
        score += 1

    # Bairro
    m = BAIRRO_HINT_RE.search(raw)
    if m:
        out.bairro = _clean(m.group(2))
        score += 1

    # Complemento
    m = COMPL_RE.search(raw)
    if m:
        out.complemento = _clean(f"{m.group(1)} {m.group(2)}")

    # Logradouro + número
    lm = LOGRADOURO_RE.search(flat)
    if lm:
        tail = flat[lm.start():]
        # corta no CEP/UF/cidade se aparecerem depois
        cut = len(tail)
        for pat in (CEP_RE, UF_RE):
            mm = pat.search(tail)
            if mm:
                cut = min(cut, mm.start())
        street_chunk = _clean(tail[:cut])
        nm = NUM_RE.search(street_chunk) or re.search(r"\b(\d{1,6})\b", street_chunk)
        if nm:
            out.number = nm.group(1)
            out.street = _clean(street_chunk[:nm.start()])
            score += 2
        else:
            out.street = street_chunk
            score += 1

    # Cidade: heurística — palavra(s) imediatamente antes da UF
    if out.state:
        before_uf = flat[: UF_RE.search(flat).start()]
        city_guess = re.split(r"[,\-–]", before_uf)[-1]
        city_guess = _clean(city_guess)
        # remove CEP residual
        city_guess = CEP_RE.sub("", city_guess).strip(" ,-")
        if 2 <= len(city_guess) <= 40 and not LOGRADOURO_RE.search(city_guess):
            out.city = city_guess
            score += 1

    out.confidence = round(min(score / 8.0, 1.0), 2)
    return out


def split_blocks(text: str) -> list[str]:
    """Separa um texto grande em vários endereços.

    Cada linha em branco OU cada CEP encontrado tende a delimitar um endereço.
    """
    text = text.replace("\r\n", "\n")
    # primeiro tenta por linhas em branco
    blocks = [b for b in re.split(r"\n\s*\n", text) if b.strip()]
    if len(blocks) > 1:
        return blocks
    # senão, uma linha por endereço (planilha/lista colada)
    lines = [l for l in text.split("\n") if l.strip()]
    return lines if lines else [text]


def parse_many(text: str) -> list[ParsedAddress]:
    return [parse_one(b) for b in split_blocks(text)]
