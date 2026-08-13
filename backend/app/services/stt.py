"""
Voz -> texto (STT) para adicionar endereços falados. Substitui o áudio do Gemini.

Usa faster-whisper (local, offline) se instalado. É opcional: se não houver,
o endpoint responde 503 e o app continua funcionando por texto/foto.
"""
from __future__ import annotations

import io
import os
import tempfile

_model = None
_MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")


class STTUnavailable(RuntimeError):
    pass


def transcribe(audio_bytes: bytes, language: str = "pt") -> str:
    global _model
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except Exception as e:
        raise STTUnavailable(
            "STT indisponível. Instale 'faster-whisper' no servidor "
            "(ou use a transcrição nativa do navegador/dispositivo no app)."
        ) from e

    if _model is None:
        _model = WhisperModel(_MODEL_SIZE, device="cpu", compute_type="int8")

    with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as tmp:
        tmp.write(audio_bytes)
        path = tmp.name
    try:
        segments, _ = _model.transcribe(path, language=language)
        return " ".join(seg.text.strip() for seg in segments).strip()
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
