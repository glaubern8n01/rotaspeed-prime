from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models import ParseOut, ParseTextIn, ParsedAddressOut
from ..services import address_parser
from ..services.ocr import OCRUnavailable, extract_text
from ..services.stt import STTUnavailable, transcribe

router = APIRouter(prefix="/parse", tags=["parse"])


def _to_out(items) -> list[ParsedAddressOut]:
    return [ParsedAddressOut(**a.dict()) for a in items]


@router.post("/text", response_model=ParseOut)
def parse_text(body: ParseTextIn):
    items = address_parser.parse_many(body.text) if body.multi else [
        address_parser.parse_one(body.text)
    ]
    return ParseOut(addresses=_to_out(items), source="text")


@router.post("/image", response_model=ParseOut)
async def parse_image(file: UploadFile = File(...)):
    data = await file.read()
    try:
        text = extract_text(data)
    except OCRUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    items = address_parser.parse_many(text)
    return ParseOut(addresses=_to_out(items), source="image")


@router.post("/audio", response_model=ParseOut)
async def parse_audio(file: UploadFile = File(...)):
    data = await file.read()
    try:
        text = transcribe(data)
    except STTUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    items = address_parser.parse_many(text)
    return ParseOut(addresses=_to_out(items), source="audio")
