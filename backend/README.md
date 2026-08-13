# backend/ — RotaSpeed Prime API (Python, sem Gemini)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/glaubern8n01/rotaspeed-prime)

FastAPI que substitui toda a IA do Gemini por processamento local/determinístico.

## Rodar local (desenvolvimento)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# Docs interativas: http://localhost:8000/docs
```

## Endpoints
| Método | Rota | O que faz |
|---|---|---|
| GET | `/health` | status + engine de otimização ativa |
| POST | `/parse/text` | extrai endereços de texto |
| POST | `/parse/image` | OCR de foto/etiqueta → endereços |
| POST | `/parse/audio` | voz → texto → endereços |
| POST | `/geocode` | endereço → coordenadas (Nominatim) |
| POST | `/optimize` | ordem ótima das paradas (OR-Tools/2-opt) |
| POST | `/notify/whatsapp` | link `wa.me` com mensagem pronta |
| POST | `/notify/navigation` | links Google/Waze/Apple/geo |
| POST | `/track/summary` | resumo "modo Strava" (km, ritmo, tempo) |

## Exemplos
```bash
# Otimizar rota
curl -s localhost:8000/optimize -H 'content-type: application/json' -d '{
  "stops":[
    {"id":"depot","lat":-23.55,"lon":-46.63},
    {"id":"a","lat":-23.56,"lon":-46.64},
    {"id":"b","lat":-23.58,"lon":-46.62}],
  "depot_index":0}'

# Extrair endereço de texto
curl -s localhost:8000/parse/text -H 'content-type: application/json' \
  -d '{"text":"Rua das Flores, 123, Centro, São Paulo SP, 01001-000"}'
```

## Dependências opcionais
- **OR-Tools** (`ortools`): otimização VRP de alta qualidade. Sem ela, usa fallback 2-opt.
- **OCR**: `easyocr` **ou** `pytesseract` + binário `tesseract-ocr`.
- **Voz**: `faster-whisper`.

O serviço funciona mesmo sem as opcionais (recursos degradam com 503 explicativo).

## Testes
```bash
pip install pytest
pytest -q
```

## Deploy na nuvem
Use o `Dockerfile`. Veja [`../docs/PUBLICACAO-LOJAS.md`](../docs/PUBLICACAO-LOJAS.md).
