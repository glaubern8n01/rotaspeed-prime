# Comparação dos 3 repositórios de origem

Os três repos são o **RotaSpeed** em estágios/abordagens diferentes. O Prime pega o
melhor de cada.

## Visão geral

| | `rotaspeed-unificado` | `rota-speed-flow` | `rota-speed-genesis` |
|---|---|---|---|
| Stack | React 19 + Vite (puro) | Vite + React + shadcn/ui | Vite + React + shadcn/ui |
| LOC (TS/TSX) | ~3.7k | **~18.8k** | ~8.1k |
| Componentes | (monolito em poucos arquivos) | **73** | 59 |
| Páginas | fases numa SPA | **13** (Entregas, Rota, Estatísticas, Histórico…) | 2 (Index, 404) |
| IA | **Gemini** (via proxy Supabase) | chama serviços de extração | otimização local |
| Supabase Functions | `gemini-proxy`, `reset-daily-counts`, `sync-user-profile` | — | — |
| WhatsApp | básico (2 refs) | **completo** (`whatsappMessaging`, `comunicacaoService`, `n8nService`) | ausente |
| Voz/áudio | `speechService` | 6 arquivos | ausente |
| Otimização | via IA | 13 arquivos + `RouteOptimizer` | 10 arquivos + tracking |
| Distância/Strava | ausente | **10 refs** | 8 refs |
| Mapa Google/Waze | 2 refs | 5 refs | ausente |

## O papel de cada um na fusão

- **`rota-speed-flow` → base do frontend.** É o mais completo: design system (shadcn),
  todas as páginas, camada de serviços (`extraction`, `messaging`, `stats`, `storage`),
  WhatsApp e integração n8n. É o "corpo e rosto" do produto.
- **`rotaspeed-unificado` → lógica de negócio + Supabase.** Tem o fluxo de fases bem
  definido (`AppPhase`), o modelo de dados (`entregas`, `usuarios_rotaspeed`), planos/limites
  e as Edge Functions. É o "sistema nervoso". **A parte Gemini foi reescrita em Python.**
- **`rota-speed-genesis` → banco de componentes/variações de UI.** Fonte de componentes
  extras e alternativas de design para cherry-pick.

## O que muda no Prime (o diferencial)

1. **Sem Gemini.** Toda extração/otimização/geocodificação vira **backend Python**
   (`/backend`), determinístico, offline-friendly e **sem custo por chamada**.
   - Otimização: **Google OR-Tools** (VRP real) com fallback 2-opt puro-Python.
   - OCR: EasyOCR/Tesseract local. Voz: faster-whisper local.
   - Geocodificação: Nominatim/OSM (grátis) — trocável por Google/Mapbox.
2. **Um código só**, organizado em monorepo (`backend/`, `frontend/`, `mobile/`, `docs/`).
3. **Pronto para as lojas** via Capacitor (o mesmo frontend web vira app iOS/Android),
   consumindo o backend **na nuvem** — nunca o PC do desenvolvedor.
