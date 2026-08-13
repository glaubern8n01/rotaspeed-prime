# mobile/ — empacotamento para as lojas (Capacitor)

Este diretório guarda a config do Capacitor que transforma o `frontend/` (web) em
apps nativos **iOS** e **Android**, para publicar na **App Store** e **Google Play**.

O passo a passo completo está em [`../docs/PUBLICACAO-LOJAS.md`](../docs/PUBLICACAO-LOJAS.md).

Resumo:
```bash
cd frontend && npm install && npm run build     # gera frontend/dist
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "RotaSpeed" "com.rotaspeed.app" --web-dir=dist
npx cap add android && npx cap add ios
npx cap sync
npx cap open android   # Android Studio -> gerar .aab assinado
npx cap open ios       # Xcode (macOS) -> Archive -> App Store Connect
```

> Lembrete: o app publicado fala com o **backend na nuvem** (URL em `VITE_API_BASE_URL`),
> nunca com o seu PC.
