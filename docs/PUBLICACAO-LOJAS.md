# Publicação nas lojas (Google Play + App Store)

> **Regra de ouro:** o app publicado NÃO fala com o seu PC. O backend Python roda na
> **nuvem** e o app aponta para a URL de produção. Seu computador é só para desenvolver.

## 1. Suba o backend Python na nuvem
Escolha uma plataforma (todas rodam o `backend/Dockerfile`):

| Plataforma | Como |
|---|---|
| **Render** | New → Web Service → conecta o repo → root `backend/` → detecta Dockerfile |
| **Railway** | New Project → Deploy from repo → serviço no diretório `backend/` |
| **Fly.io** | `fly launch` dentro de `backend/` |
| **Google Cloud Run** | `gcloud run deploy --source backend/` |

Defina as variáveis de ambiente no painel da nuvem:
```
CORS_ORIGINS=https://SEU_DOMINIO,capacitor://localhost,https://localhost
ROTASPEED_API_KEY=<uma chave forte>        # opcional, recomendado
GEOCODER_UA=RotaSpeed/1.0 (contato@seudominio.com)
```
Anote a URL pública, ex.: `https://rotaspeed-api.onrender.com`.

## 2. Aponte o app para a nuvem
No `frontend/.env.production`:
```
VITE_API_BASE_URL=https://rotaspeed-api.onrender.com
```
Nunca comite chave secreta no frontend — só a URL pública e a anon key do Supabase.

## 3. Empacote com Capacitor
```bash
cd frontend
npm install
npm run build
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "RotaSpeed" "com.rotaspeed.app" --web-dir=dist
npx cap add android
npx cap add ios
npx cap sync
```

### Android (Google Play)
```bash
npx cap open android      # abre no Android Studio
```
- Gere um **keystore** e configure o `signingConfig` (release).
- `Build → Generate Signed Bundle → Android App Bundle (.aab)`.
- Play Console → criar app → enviar o `.aab` → preencher ficha, política de privacidade,
  classificação de conteúdo e teste fechado antes de produção.
- Taxa única de conta de desenvolvedor: **US$ 25**.

### iOS (App Store)
```bash
npx cap open ios          # abre no Xcode (precisa de macOS)
```
- Conta **Apple Developer** (**US$ 99/ano**).
- Configure Bundle ID, Signing & Capabilities, arquive (`Product → Archive`) e envie
  pelo **App Store Connect** → TestFlight → revisão.

## 4. Permissões / privacidade (obrigatório nas lojas)
Declare e justifique no manifesto/Info.plist e na ficha da loja:
- **Localização** (rota e rastreio): "otimizar e acompanhar entregas".
- **Câmera** (foto de etiqueta / prova de entrega).
- **Microfone** (adicionar endereço por voz).
- Link para a **Política de Privacidade** (exigido por ambas as lojas).

## 5. Checklist final
- [ ] Backend na nuvem respondendo em `/health`.
- [ ] `VITE_API_BASE_URL` = URL de nuvem (sem localhost).
- [ ] Ícones e splash gerados (`@capacitor/assets`).
- [ ] Política de privacidade publicada.
- [ ] Conta Google Play (US$ 25) e Apple Developer (US$ 99/ano).
- [ ] Build assinado (.aab / .ipa) enviado.
