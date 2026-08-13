# Roadmap — RotaSpeed Prime

Ordem sugerida para chegar ao nível do Circuit, mantendo o diferencial (Python, sem Gemini).

## ✅ Fase 0 — Núcleo Python (feito neste repo)
- Parser de endereços BR, OCR, STT (voz), geocodificação, otimização VRP, WhatsApp, tracking Strava.
- API FastAPI testada (`pytest`) e conteinerizada.

## 🔜 Fase 1 — Integrar frontend ao backend
- Trocar as chamadas ao `gemini-proxy` pelo cliente `frontend/src/services/api/rotaspeedApi.ts`.
- Fluxo completo: foto/texto/voz → parse → geocode → optimize → mapa/WhatsApp.

## 🔜 Fase 2 — Matriz de rota real (ruas, não linha reta)
- Trocar a distância Haversine por **OSRM** (open-source) ou Google Distance Matrix.
- Habilita **evitar pedágio/rodovia** (`AvoidableRouteFeature` do Circuit).

## 🔜 Fase 3 — Prova de entrega
- Foto + assinatura na tela + notas → upload para **Supabase Storage**.
- Níveis de exigência (só foto / foto+assinatura), como `EvidenceRequirementLevel`.

## 🔜 Fase 4 — Código de barras
- Scanner no app (Capacitor Barcode/MLKit) para casar pacote↔parada (`AssignStopWithBarcode`).

## 🔜 Fase 5 — Pausas e capacidade
- Pausa de almoço e capacidade do veículo no OR-Tools (já há `demand`/`vehicle_capacity`).

## 🔜 Fase 6 — Rastreio para o cliente
- Página pública de acompanhamento + link encurtado (`ShortenLinkRequest`) via `/track`.

## 🔜 Fase 7 — Multi-motorista / times
- Transferir paradas entre motoristas (`TransferStopsRequest`) e VRP multi-veículo.

## 🔜 Fase 8 — Publicação
- Seguir [PUBLICACAO-LOJAS.md](PUBLICACAO-LOJAS.md): backend na nuvem, Capacitor, lojas.
