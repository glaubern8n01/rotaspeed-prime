/**
 * Cliente do backend Python (RotaSpeed Prime API).
 *
 * Substitui as chamadas ao gemini-proxy. Aponta para a URL de PRODUÇÃO na nuvem
 * via VITE_API_BASE_URL (nunca localhost no app publicado nas lojas).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

function headers(json = true): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (API_KEY) h["x-api-key"] = API_KEY;
  return h;
}

export interface ParsedAddress {
  full_address: string;
  street?: string;
  number?: string;
  complemento?: string;
  bairro?: string;
  city?: string;
  state?: string;
  cep?: string;
  recipient_name?: string;
  telefone?: string;
  confidence: number;
}

export interface GeocodeItem {
  query: string;
  lat?: number;
  lon?: number;
  display_name?: string;
  confidence: "high" | "medium" | "low" | "none";
}

export interface StopIn {
  id: string;
  lat: number;
  lon: number;
  demand?: number;
}

export interface OptimizeResult {
  order: string[];
  total_distance_km: number;
  total_distance_m: number;
  legs_m: number[];
  solver: string;
  round_trip: boolean;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} falhou: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Endereços a partir de texto colado/digitado. */
export async function parseText(text: string, multi = true): Promise<ParsedAddress[]> {
  const r = await post<{ addresses: ParsedAddress[] }>("/parse/text", { text, multi });
  return r.addresses;
}

/** Endereços a partir de foto de etiqueta (OCR). */
export async function parseImage(file: File): Promise<ParsedAddress[]> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE_URL}/parse/image`, {
    method: "POST",
    headers: headers(false),
    body: fd,
  });
  if (!res.ok) throw new Error(`OCR falhou: ${res.status}`);
  return (await res.json()).addresses;
}

/** Endereços a partir de áudio (voz → texto). */
export async function parseAudio(file: Blob): Promise<ParsedAddress[]> {
  const fd = new FormData();
  fd.append("file", file, "audio.webm");
  const res = await fetch(`${BASE_URL}/parse/audio`, {
    method: "POST",
    headers: headers(false),
    body: fd,
  });
  if (!res.ok) throw new Error(`STT falhou: ${res.status}`);
  return (await res.json()).addresses;
}

/** Geocodifica uma lista de endereços. */
export async function geocode(queries: string[]): Promise<GeocodeItem[]> {
  const r = await post<{ results: GeocodeItem[] }>("/geocode", { queries });
  return r.results;
}

/** Otimiza a ordem das paradas (VRP real, sem IA). */
export async function optimize(
  stops: StopIn[],
  opts: { depot_index?: number; round_trip?: boolean; vehicle_capacity?: number } = {}
): Promise<OptimizeResult> {
  return post<OptimizeResult>("/optimize", { stops, ...opts });
}

/** Monta o link do WhatsApp com mensagem pronta para o telefone do cliente. */
export async function whatsappLink(params: {
  phone: string;
  template?: "a_caminho" | "cheguei" | "sem_sucesso" | string;
  nome?: string;
  entregador?: string;
  endereco?: string;
}): Promise<{ ok: boolean; link: string | null; message: string }> {
  return post("/notify/whatsapp", params);
}

/** Links de navegação (Google/Waze/Apple/geo) para abrir o mapa. */
export async function navigationLinks(lat: number, lon: number, label = "") {
  return post<Record<string, string>>("/notify/navigation", { lat, lon, label });
}

/** Resumo "modo Strava" da jornada (km, ritmo, tempo). */
export async function trackSummary(
  points: { lat: number; lon: number; t: number }[],
  delivered_count = 0
) {
  return post("/track/summary", { points, delivered_count });
}
