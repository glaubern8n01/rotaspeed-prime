# Arquitetura — RotaSpeed Prime

```
┌──────────────────────────────────────────────────────────────┐
│  APP (lojas)  — Capacitor embala o frontend web em iOS/Android │
│  frontend/ (React + shadcn/ui, base = rota-speed-flow)         │
│    • entrada: foto / texto / voz                               │
│    • mostra rota, mapa, WhatsApp, estatísticas (modo Strava)   │
└───────────────┬───────────────────────────┬──────────────────┘
                │ HTTPS                       │ HTTPS
                ▼                             ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ BACKEND PYTHON (NUVEM)        │   │ SUPABASE                      │
│ backend/ (FastAPI)            │   │  • Auth (email/Google)        │
│  /parse/text|image|audio      │   │  • Postgres (entregas,        │
│  /geocode   (Nominatim/OSM)   │   │    usuarios_rotaspeed)        │
│  /optimize  (OR-Tools/2-opt)  │   │  • Storage (fotos, prova)     │
│  /notify/whatsapp|navigation  │   │  • Edge Functions (planos,    │
│  /track/summary  (Strava)     │   │    reset diário)              │
└──────────────────────────────┘   └──────────────────────────────┘
        ▲ substitui 100% o Gemini
```

## Por que Python no lugar do Gemini
| Antes (Gemini) | Agora (Python) |
|---|---|
| Custo por chamada / cota | **Grátis** (roda no seu servidor) |
| Otimização "adivinhada" pela LLM | **VRP real** com OR-Tools (ótimo/near-ótimo, auditável) |
| Depende de rede + chave de API | OCR/STT/otimização **funcionam offline** no servidor |
| Resultado não-determinístico | **Determinístico** e testável (`pytest`) |

## Fluxo de uma jornada de entregas
1. Entregador adiciona pacotes por **foto** (`/parse/image`), **texto** (`/parse/text`) ou **voz** (`/parse/audio`).
2. Endereços viram coordenadas em `/geocode` (com nível de confiança; pede revisão se baixo).
3. `/optimize` devolve a **ordem ótima** a partir do depósito (garagem/CD).
4. App abre a navegação (`/notify/navigation`) e avisa o cliente no **WhatsApp** (`/notify/whatsapp`).
5. Durante o dia, o app envia breadcrumbs de GPS; `/track/summary` gera o resumo **tipo Strava**.
6. Status e histórico persistem no **Supabase**.

## Regras de ambiente
- **Nunca** aponte o app publicado para `localhost`/IP do PC. Use a URL de nuvem em
  `VITE_API_BASE_URL` (web) e no `capacitor.config` (mobile).
- CORS do backend deve listar o domínio do app e `capacitor://localhost` / `https://localhost`.
- Chave opcional `ROTASPEED_API_KEY` protege a API pública.
