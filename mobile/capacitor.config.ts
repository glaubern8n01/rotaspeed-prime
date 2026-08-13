import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuração do Capacitor para empacotar o frontend web (pasta frontend/dist)
 * como app nativo iOS/Android.
 *
 * IMPORTANTE: `server.url` deve ficar VAZIO em produção — o app usa os assets
 * empacotados e fala com o backend Python na NUVEM via VITE_API_BASE_URL.
 * Nunca aponte para o IP do seu PC no build que vai para as lojas.
 */
const config: CapacitorConfig = {
  appId: "com.rotaspeed.app",
  appName: "RotaSpeed",
  webDir: "../frontend/dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    Geolocation: {},
    Camera: {},
  },
};

export default config;
