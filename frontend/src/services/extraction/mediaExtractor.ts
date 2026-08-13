import { Entrega } from '../types/entrega';
import * as api from '../api/rotaspeedApi';
import { analisarTextoEndereco } from './addressExtractor';

// Interface for address extraction response
export interface AddressExtraction {
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  cliente?: string;
  telefone?: string;
}

// Converte o retorno do backend Python (ParsedAddress) para o formato do app.
const fromParsed = (p: api.ParsedAddress): AddressExtraction => ({
  endereco: p.street || 'Endereço não identificado',
  numero: p.number || 'S/N',
  bairro: p.bairro || 'Bairro não identificado',
  cep: p.cep || '',
  cliente: p.recipient_name || undefined,
  telefone: p.telefone || undefined,
});

// Fallback local (offline) usando o parser client-side já existente.
const localFallback = (text: string): AddressExtraction[] => {
  const e = analisarTextoEndereco(text);
  return [{ endereco: e.endereco, numero: e.numero, bairro: e.bairro, cep: e.cep,
            cliente: e.cliente, telefone: e.telefone }];
};

/**
 * Foto/etiqueta -> OCR no backend Python (EasyOCR/Tesseract) -> endereços.
 * Antes isto retornava dados MOCK ("Avenida Paulista"). Agora lê a foto de verdade.
 */
export const extractAddressFromImage = async (file: File): Promise<AddressExtraction[]> => {
  try {
    const parsed = await api.parseImage(file);
    if (parsed.length) return parsed.map(fromParsed);
  } catch (err) {
    console.warn('OCR backend indisponível, sem extração de imagem:', err);
  }
  // Sem OCR local no navegador — devolve vazio para o app pedir entrada manual.
  return [];
};

/**
 * Áudio (voz) -> STT no backend Python (Whisper) -> endereços.
 * Aceita tanto um Blob de áudio quanto (compatibilidade) um texto já transcrito.
 */
export const extractAddressFromVoice = async (
  audio: Blob | string
): Promise<AddressExtraction[]> => {
  if (typeof audio === 'string') {
    // já veio transcrito (Web Speech API do dispositivo) -> parse no backend
    return extractAddressFromText(audio);
  }
  try {
    const parsed = await api.parseAudio(audio);
    if (parsed.length) return parsed.map(fromParsed);
  } catch (err) {
    console.warn('STT backend indisponível:', err);
  }
  return [];
};

/**
 * Texto colado/digitado -> parser do backend Python (com fallback local offline).
 */
export const extractAddressFromText = async (text: string): Promise<AddressExtraction[]> => {
  try {
    const parsed = await api.parseText(text, true);
    if (parsed.length) return parsed.map(fromParsed);
  } catch (err) {
    console.warn('Parser backend indisponível, usando fallback local:', err);
  }
  return localFallback(text);
};

// Lê o conteúdo textual de um arquivo (CSV/planilha exportada como texto / PDF-texto).
const readAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });

/**
 * Planilha/CSV -> lê as linhas e manda cada uma para o parser Python.
 * (Para .xlsx binário, exporte como CSV; o backend cuida do resto.)
 */
export const extractAddressFromSpreadsheet = async (file: File): Promise<AddressExtraction[]> => {
  try {
    const text = await readAsText(file);
    if (text.trim()) {
      const parsed = await api.parseText(text, true);
      if (parsed.length) return parsed.map(fromParsed);
    }
  } catch (err) {
    console.warn('Falha ao ler planilha:', err);
  }
  return [];
};

/**
 * PDF -> tenta enviar o texto extraível para o parser Python.
 * PDFs digitalizados (imagem) devem ir por extractAddressFromImage (OCR).
 */
export const extractAddressFromPDF = async (file: File): Promise<AddressExtraction[]> => {
  try {
    const text = await readAsText(file);
    // Heurística: se veio texto legível, parseia; senão, orienta usar OCR.
    if (text && /[A-Za-zÀ-ú]{4,}/.test(text)) {
      const parsed = await api.parseText(text, true);
      if (parsed.length) return parsed.map(fromParsed);
    }
    console.warn('PDF sem texto legível — use a opção de foto (OCR) para PDFs digitalizados.');
  } catch (err) {
    console.warn('Falha ao ler PDF:', err);
  }
  return [];
};
