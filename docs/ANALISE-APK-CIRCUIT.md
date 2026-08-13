# Análise do APK Circuit (referência de features)

> APK analisado: **Circuit Route Planner** `com.underwood.route_optimiser`
> v3.60.4 (build 74). Analisado apenas como **referência de funcionalidades** de um
> app líder de mercado — para inspirar o RotaSpeed Prime. Não redistribuímos código.

## Ficha técnica
| Item | Valor |
|---|---|
| App | Circuit Route Planner (getcircuit.com) |
| Package | `com.underwood.route_optimiser` |
| Versão | 3.60.4 (74) |
| Arquivos no APK | 7.226 |
| Código | 7 arquivos `.dex` (~54 MB de bytecode, ofuscado com R8) |
| Nativas | 13 `.so` × 4 arquiteturas (arm64-v8a, armeabi-v7a, x86, x86_64) |
| UI | 4.205 recursos + `resources.arsc` |
| Extras | ML Kit OCR (Google), Apache POI, gRPC, Log4j, Android Auto |

## Permissões sensíveis
Localização (fina/grossa + serviço em 1º plano), **Câmera**, **Microfone**,
`SYSTEM_ALERT_WINDOW`, armazenamento, notificações, Bluetooth, boot.
→ Confirma um app de rotas com captura por câmera/voz e navegação em background.

## Superfície de features (extraída das classes de API `com/circuit/api/requests/`)

| Classe de API | O que revela |
|---|---|
| `OptimizeRequest` + `OptimizationRequestFlags` | Otimização com **solver configurável**, direção, ordem e posicionamento do depósito |
| `GeocodeRequest` / `ExtendedGeocodeRequest` | Geocodificação com **nível de confiança** (`GeocodeConfidenceLevel`, `GeocodingIssue`) |
| `AssignStopWithBarcodeRequest` | **Leitura de código de barras** para casar pacote↔parada |
| `MediaImportRequest` (+ `Source`, `UserLocation`) | **Importar paradas a partir de mídia** (foto/print de lista) |
| `ImportStopsTransferRequest` / `TransferStopsRequest` | **Transferir paradas** entre motoristas/rotas |
| `LocationsRequest` (+ `DeliveryInfo`, `Recipient`) | Cadastro de destinatário e infos de entrega |
| `SearchAddressRequest` / `ExtendedSearchRequest` | Busca de endereço com autocomplete |
| `ShortenLinkRequest` | **Link de rastreio encurtado** para o cliente |
| `LastSeenRequest` | Última posição vista (rastreio ao vivo) |

## Entidades de domínio relevantes (`com/circuit/core/entity/`)
- **Prova de entrega:** `ProofOfDelivery`, `ProofOfAttempt`, `EvidenceRequirementLevel`,
  `EvidenceCollectionFailure`, `PhotoDetail` → foto + assinatura + notas, com nível de exigência.
- **Depósito e pausas:** `DepotId`, `BreakDefault`, `BreakState` → ponto de partida e **pausas do motorista** (almoço) dentro da otimização.
- **Restrições de rota:** `AvoidableRouteFeature` → evitar **pedágios/rodovias**.
- **Pacote/recipiente:** `PackageDetails`, `PackageState`, `PackageLabelFormat`, `Recipient`, `RetailerInfo`, `PlaceInVehicle`, `RoadSide` → gestão de pacote, etiqueta e posição no veículo.
- **Navegação/mapa:** `NavigationApp`, `MapType`, `DistanceUnitSystem`.
- **Planos:** `PlanFeature`, `AppFeature`, `FeatureStatus`, tier `TIER_PREMIUM`.
- **Otimização:** `OptimizationRoutingSolver`, `OptimizeDirection`, `OptimizeType`, `OptimizationPlacement`, `OptimizationOrder`.

## O que o RotaSpeed Prime **já cobre** vs. **o que dá para complementar**

| Feature do Circuit | RotaSpeed Prime |
|---|---|
| Otimização real de rota | ✅ OR-Tools/2-opt (`/optimize`) |
| Geocodificação com confiança | ✅ Nominatim + nível (`/geocode`) |
| Importar por foto/OCR | ✅ `/parse/image` (EasyOCR/Tesseract) |
| Endereço por texto/voz | ✅ `/parse/text`, `/parse/audio` |
| Navegação Google/Waze/Apple | ✅ `/notify/navigation` |
| Avisar cliente | ✅ WhatsApp deep-link (`/notify/whatsapp`) |
| Depósito de partida | ✅ `depot_index` no `/optimize` |
| **Pausas do motorista** | 🔜 roadmap (OR-Tools suporta) |
| **Evitar pedágio/rodovia** | 🔜 roadmap (matriz de custo por OSRM) |
| **Código de barras** | 🔜 roadmap (scanner no app + casar pacote) |
| **Prova de entrega (foto+assinatura)** | 🔜 roadmap (upload p/ Supabase Storage) |
| **Link de rastreio p/ cliente** | 🔜 roadmap (`/track` + página pública) |
| **Transferir paradas entre motoristas** | 🔜 roadmap (multi-usuário) |

Veja o [ROADMAP](ROADMAP.md) para a ordem de implementação.
