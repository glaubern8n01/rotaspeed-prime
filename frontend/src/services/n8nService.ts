
import { AddressExtraction } from './extraction/mediaExtractor';

// Interface para a resposta do n8n
export interface N8nResponse {
  status: string;
  rota: string;
}

// Interface para os dados da rota confirmada
export interface RotaConfirmada {
  id?: string;
  id_entregador: string;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  rota: string;
  data_envio?: string;
}

const N8N_WEBHOOK_URL = "https://gn8n01.app.n8n.cloud/webhook/rotaspeed/entrada";

/**
 * Envia os dados para o n8n via webhook
 * @param userId ID do entregador autenticado
 * @param endereco Dados do endereço
 * @param file Arquivo opcional (imagem, áudio, PDF ou planilha)
 * @returns Promessa com a resposta do n8n
 */
export const enviarParaN8n = async (
  userId: string,
  endereco: AddressExtraction,
  file?: File
): Promise<N8nResponse> => {
  try {
    // Criar form data para envio multipart/form-data
    const formData = new FormData();
    
    // Adicionar o ID do entregador
    formData.append('id_entregador', userId);
    
    // Adicionar os dados do endereço
    formData.append('endereco', endereco.endereco);
    formData.append('numero', endereco.numero);
    formData.append('bairro', endereco.bairro);
    formData.append('cep', endereco.cep);
    
    // Se houver arquivo, adicionar ao form data
    if (file) {
      formData.append('upload', file);
    }
    
    // Enviar para o n8n via POST
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Falha na requisição: ${response.status}`);
    }
    
    // Retornar a resposta como JSON
    return await response.json();
  } catch (error) {
    console.error('Erro ao comunicar com n8n:', error);
    throw error;
  }
};

/**
 * Salva a rota confirmada no Supabase
 * @param rotaData Dados da rota confirmada
 * @returns Promessa com o resultado da operação
 */
export const salvarRotaConfirmada = async (rotaData: RotaConfirmada): Promise<any> => {
  try {
    // Verificar se o Supabase está disponível globalmente
    const supabase = (window as any).supabase;
    
    if (!supabase) {
      throw new Error('Supabase não está disponível. Verifique a integração com o Supabase.');
    }
    
    // Inserir na tabela rotas_confirmadas
    const { data, error } = await supabase
      .from('rotas_confirmadas')
      .insert([rotaData]);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao salvar rota confirmada:', error);
    throw error;
  }
};

/**
 * Busca todas as rotas confirmadas do usuário atual
 * @param userId ID do entregador
 * @returns Promessa com a lista de rotas confirmadas
 */
export const buscarRotasConfirmadas = async (userId: string): Promise<RotaConfirmada[]> => {
  try {
    const supabase = (window as any).supabase;
    
    if (!supabase) {
      throw new Error('Supabase não está disponível. Verifique a integração com o Supabase.');
    }
    
    const { data, error } = await supabase
      .from('rotas_confirmadas')
      .select('*')
      .eq('id_entregador', userId)
      .order('data_envio', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar rotas confirmadas:', error);
    return [];
  }
};
