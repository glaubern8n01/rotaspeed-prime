
// Shared types for entrega-related services

// Interface for entrega data structure
export interface Entrega {
  id: string; // ID é obrigatório
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  status?: 'pendente' | 'entregue' | 'cancelado';
  criado_em?: string;
  entregue_em?: string;
  grupoTamanho?: number; // Para indicar múltiplas entregas no mesmo endereço
  cliente?: string; // Nome do cliente
  telefone?: string; // Telefone do cliente
  lat?: number; // Latitude do endereço
  lng?: number; // Longitude do endereço
  index?: number; // Add index property to match Location type
}

// Key for localStorage
export const ENTREGAS_STORAGE_KEY = 'rotaspeed_entregas';
