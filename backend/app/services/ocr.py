"""
OCR — extrai texto de fotos/etiquetas de pacotes. Substitui a visão do Gemini.

Estratégia em camadas (usa o que estiver instalado, na ordem de qualidade):
  1. EasyOCR  (deep learning, ótimo p/ etiqueta; pip install easyocr)
  2. Tesseract via pytesseract (leve; requer binário tesseract-ocr instalado)
  3. Indisponível -> erro explicativo (o app pode cair p/ entrada por texto)

Tudo local. Nenhuma imagem sai para um serviço de terceiros.
"""
from __future__ import annotations

import io
import os

_EASYOCR_LANGS = os.getenv("OCR_LANGS", "pt,en").split(",")

_easyocr_reader = None


def _try_easyocr(image_bytes: bytes) -> str | None:
    global _easyocr_reader
    try:
        import easyocr  # type: ignore
        import numpy as np
        from PIL import Image

        if _easyocr_reader is None:
            _easyocr_reader = easyocr.Reader(_EASYOCR_LANGS, gpu=False)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        result = _easyocr_reader.readtext(np.array(img), detail=0, paragraph=True)
        return "\n".join(result)
    except Exception:
        return None


def _try_tesseract(image_bytes: bytes) -> str | None:
    try:
        import pytesseract  # type: ignore
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes))
        return pytesseract.image_to_string(img, lang="por+eng")
    except Exception:
        return None


class OCRUnavailable(RuntimeError):
    pass


def extract_text(image_bytes: bytes) -> str:
    for fn in (_try_easyocr, _try_tesseract):
        text = fn(image_bytes)
        if text and text.strip():
            return text
    raise OCRUnavailable(
        "Nenhum motor de OCR disponível. Instale 'easyocr' ou o binário "
        "'tesseract-ocr' (com pytesseract) no servidor."
    )
