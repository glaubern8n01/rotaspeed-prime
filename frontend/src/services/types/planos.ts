
// Types for plans and credits management
export interface EntregadorPlano {
  plano_nome: 'Start' | 'Motorista' | 'Profissional' | 'Premium Inteligente' | null;
  plano_ativo: boolean;
  entregas_dia_max: number;
  entregas_hoje: number;
  ultima_atualizacao: string; // ISO date string
  saldo_creditos: number;
}

export interface PlanosCheckout {
  nome: string;
  preco: string;
  entregas: number;
  creditos: number;
  url: string;
}

export const PLANOS_CHECKOUT: PlanosCheckout[] = [
  {
    nome: 'Start',
    preco: 'R$ 29/mês',
    entregas: 85,
    creditos: 0,
    url: 'https://app.cakto.com.br/checkout-builder/393381'
  },
  {
    nome: 'Motorista',
    preco: 'R$ 49/mês',
    entregas: 170,
    creditos: 0,
    url: 'https://pay.cakto.com.br/37d32n3_393391'
  },
  {
    nome: 'Profissional',
    preco: 'R$ 79/mês',
    entregas: 255,
    creditos: 0,
    url: 'https://pay.cakto.com.br/3ckniys_393394'
  },
  {
    nome: 'Premium Inteligente',
    preco: 'R$ 197/mês',
    entregas: 999999, // Essentially unlimited
    creditos: 700,
    url: 'https://pay.cakto.com.br/3ayqmsj_393401'
  }
];

export const CREDITOS_CHECKOUT = [
  {
    quantidade: 100,
    preco: 'R$ 25',
    url: 'https://pay.cakto.com.br/nb3bu7j_393417'
  },
  {
    quantidade: 300,
    preco: 'R$ 69',
    url: 'https://pay.cakto.com.br/jw95qdf_393425'
  },
  {
    quantidade: 600,
    preco: 'R$ 199',
    url: 'https://pay.cakto.com.br/sjcddtr_393428'
  }
];

// Check if a day has passed since last update
export const shouldResetDailyCounter = (lastUpdate: string): boolean => {
  if (!lastUpdate) return true;
  
  const lastDate = new Date(lastUpdate);
  const today = new Date();
  
  // Reset if days are different
  return lastDate.getDate() !== today.getDate() ||
         lastDate.getMonth() !== today.getMonth() ||
         lastDate.getFullYear() !== today.getFullYear();
};
