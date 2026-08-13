
/// <reference types="@types/google.maps" />

// Declaração global para garantir que o TypeScript reconheça a API do Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}
