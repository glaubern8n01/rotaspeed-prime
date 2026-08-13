
import { EntregadorPlano, shouldResetDailyCounter } from './types/planos';

// Key for storing basic plan settings in localStorage as a fallback 
// (real data should come from Supabase)
const PLANO_STORAGE_KEY = 'rotaspeed_plano';

/**
 * Get current plan data from Supabase
 * @returns Promise with plan data
 */
export const getPlanoFromSupabase = async (): Promise<EntregadorPlano | null> => {
  try {
    const supabase = (window as any).supabase;
    
    if (!supabase) {
      console.error('Supabase não está disponível');
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Usuário não autenticado');
      return null;
    }
    
    const { data: entregador, error } = await supabase
      .from('usuarios_rotaspeed')
      .select('plano_nome, plano_ativo, entregas_dia_max, entregas_hoje, ultima_atualizacao, saldo_creditos')
      .eq('id_entregador', user.id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar plano:', error);
      return null;
    }
    
    return entregador;
  } catch (error) {
    console.error('Erro ao acessar o Supabase:', error);
    return null;
  }
};

/**
 * Update plan data in Supabase
 * @param planoData Updated plan data
 * @returns Promise with success status
 */
export const updatePlanoInSupabase = async (planoData: Partial<EntregadorPlano>): Promise<boolean> => {
  try {
    const supabase = (window as any).supabase;
    
    if (!supabase) {
      console.error('Supabase não está disponível');
      return false;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Usuário não autenticado');
      return false;
    }
    
    const { error } = await supabase
      .from('usuarios_rotaspeed')
      .update(planoData)
      .eq('id_entregador', user.id);
    
    if (error) {
      console.error('Erro ao atualizar plano:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao acessar o Supabase:', error);
    return false;
  }
};

/**
 * Increment the daily delivery counter
 * @returns Promise with success status
 */
export const incrementarEntregasHoje = async (): Promise<boolean> => {
  try {
    // Get current plan data
    const planoAtual = await getPlanoFromSupabase();
    
    if (!planoAtual) {
      return false;
    }
    
    // Check if we need to reset the counter for a new day
    if (shouldResetDailyCounter(planoAtual.ultima_atualizacao)) {
      return updatePlanoInSupabase({
        entregas_hoje: 1,
        ultima_atualizacao: new Date().toISOString()
      });
    }
    
    // Increment the counter
    return updatePlanoInSupabase({
      entregas_hoje: planoAtual.entregas_hoje + 1,
      ultima_atualizacao: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao incrementar entregas:', error);
    return false;
  }
};

/**
 * Decrease credits after a call is made
 * @param quantidade Number of credits to deduct
 * @returns Promise with success status
 */
export const diminuirCreditos = async (quantidade: number = 1): Promise<boolean> => {
  try {
    const planoAtual = await getPlanoFromSupabase();
    
    if (!planoAtual || planoAtual.saldo_creditos < quantidade) {
      return false;
    }
    
    return updatePlanoInSupabase({
      saldo_creditos: planoAtual.saldo_creditos - quantidade
    });
  } catch (error) {
    console.error('Erro ao diminuir créditos:', error);
    return false;
  }
};

/**
 * Check if user can make more deliveries today
 * @returns Promise with boolean result
 */
export const podeFazerMaisEntregas = async (): Promise<boolean> => {
  try {
    const planoAtual = await getPlanoFromSupabase();
    
    if (!planoAtual) {
      return false;
    }
    
    // If plan is not active, user can't make deliveries
    if (!planoAtual.plano_ativo) {
      return false;
    }
    
    // Check if we need to reset counter for a new day
    if (shouldResetDailyCounter(planoAtual.ultima_atualizacao)) {
      await updatePlanoInSupabase({
        entregas_hoje: 0,
        ultima_atualizacao: new Date().toISOString()
      });
      return true;
    }
    
    // Check if user has reached the daily limit
    return planoAtual.entregas_hoje < planoAtual.entregas_dia_max;
  } catch (error) {
    console.error('Erro ao verificar limite de entregas:', error);
    return false;
  }
};

/**
 * Check if user has available credits
 * @returns Promise with boolean result
 */
export const temCreditosDisponiveis = async (): Promise<boolean> => {
  try {
    const planoAtual = await getPlanoFromSupabase();
    
    if (!planoAtual) {
      return false;
    }
    
    return planoAtual.saldo_creditos > 0;
  } catch (error) {
    console.error('Erro ao verificar créditos:', error);
    return false;
  }
};

/**
 * Reset daily delivery counter
 * @returns Promise with success status
 */
export const resetarContadorDiario = async (): Promise<boolean> => {
  try {
    return updatePlanoInSupabase({
      entregas_hoje: 0,
      ultima_atualizacao: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao resetar contador diário:', error);
    return false;
  }
};
