<div align="center">

# 🛵 RotaSpeed Prime

**O RotaSpeed definitivo — otimizador de rotas de entrega, movido a Python (sem Gemini).**

Funde o melhor de `rotaspeed-unificado`, `rota-speed-flow` e `rota-speed-genesis`
num só código, troca a IA paga do Gemini por um **backend Python real** e já nasce
pronto para virar app nas lojas.

</div>

---

## ✨ O que é
App para **entregadores** organizarem o dia: adicionam pacotes por **foto, texto ou voz**,
o sistema **lê o endereço**, **otimiza a rota**, **abre o mapa** (Google/Waze/Apple),
**avisa o cliente no WhatsApp** e ainda mostra, no **modo Strava**, quantos km você rodou.

## 🎯 O diferencial (por que Prime)
| | Antes (Gemini) | Agora (Python) |
|---|---|---|
| Otimização | "adivinhada" por LLM | **VRP real** (Google OR-Tools) + fallback 2-opt |
| Ler endereço | visão do Gemini | **OCR local** (EasyOCR/Tesseract) |
| Voz | Gemini | **Whisper local** |
| Geocodificação | — | **Nominatim/OSM** (grátis) |
| Custo | por chamada / cota | **zero** por chamada |
| Rede | obrigatória + chave | **offline-friendly**, determinístico, testável |

Tudo isso que seu app já fazia (WhatsApp, voz, otimização, tracking, mapa) foi **preservado**
e reescrito para rodar num backend na **nuvem** — que o app das lojas consome.

## 🧩 Estrutura do monorepo
```
rotaspeed-prime/
├─ backend/     API Python (FastAPI) — o diferencial. Testado e conteinerizado.
├─ frontend/    App web (React + shadcn/ui), base = rota-speed-flow
├─ mobile/      Capacitor: empacota o frontend p/ iOS/Android (lojas)
├─ docs/        Análise do APK Circuit, comparação dos repos, arquitetura, roadmap
└─ .github/     CI (pytest)
```

## 🚀 Começar em 2 minutos (backend)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# abra http://localhost:8000/docs
```

## 📚 Documentação
- [Análise do APK Circuit](docs/ANALISE-APK-CIRCUIT.md) — referência de features de mercado
- [Comparação dos 3 repositórios](docs/COMPARACAO-REPOS.md) — o que veio de cada um
- [Arquitetura](docs/ARQUITETURA.md) — como as peças conversam
- [Publicação nas lojas](docs/PUBLICACAO-LOJAS.md) — backend na nuvem + Capacitor + Play/App Store
- [Roadmap](docs/ROADMAP.md) — próximos passos até o nível do Circuit

## 🗺️ Status
- ✅ Backend Python (parse/geocode/optimize/whatsapp/track) — funcional e testado
- ✅ Frontend base (flow) + cliente da API Python (`frontend/src/services/api/rotaspeedApi.ts`)
- 🔜 Ligar 100% o frontend ao backend, matriz por ruas (OSRM), prova de entrega, código de barras

## ⚖️ Licença
MIT — veja [LICENSE](LICENSE).

> A análise do APK do Circuit é usada **apenas como referência de funcionalidades**.
> Nenhum código proprietário de terceiros é redistribuído aqui.
