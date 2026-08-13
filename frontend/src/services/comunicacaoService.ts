
import { diminuirCreditos, temCreditosDisponiveis } from './planoService';

/**
 * Send a WhatsApp message to a client
 * @param telefone Client phone number
 * @param mensagem Message to send
 * @returns Promise with success status
 */
export const enviarMensagemWhatsApp = async (
  telefone: string,
  mensagem: string = '🚚 Sua entrega está a caminho.'
): Promise<boolean> => {
  try {
    // Format the phone number to remove any non-numeric characters
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Check if the phone number is valid (at least 10 digits)
    if (numeroLimpo.length < 10) {
      console.error('Número de telefone inválido:', telefone);
      return false;
    }
    
    // Create WhatsApp link with the message
    const whatsappLink = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
    
    // Open the link in a new tab
    window.open(whatsappLink, '_blank');
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return false;
  }
};

/**
 * Make an automated call to a client using Twilio
 * @param telefone Client phone number
 * @param mensagem Message to say
 * @returns Promise with success status
 */
export const fazerLigacaoTwilio = async (
  telefone: string,
  mensagem: string = 'Olá! Aqui é do RotaSpeed. A sua entrega já saiu para o endereço informado. Obrigado por usar nossa plataforma.'
): Promise<boolean> => {
  try {
    // Check if user has available credits
    const temCreditos = await temCreditosDisponiveis();
    
    if (!temCreditos) {
      console.warn('Sem créditos disponíveis para fazer ligação');
      return false;
    }
    
    // Format the phone number to remove any non-numeric characters
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Check if the phone number is valid (at least 10 digits)
    if (numeroLimpo.length < 10) {
      console.error('Número de telefone inválido:', telefone);
      return false;
    }
    
    // In a real implementation, this would call a Supabase Edge Function to make the Twilio API call
    // For now, let's just deduct the credit and simulate success
    const creditoDebitado = await diminuirCreditos(1);
    
    if (!creditoDebitado) {
      console.error('Falha ao debitar crédito');
      return false;
    }
    
    console.log(`Simulação: Ligação feita para ${numeroLimpo} com a mensagem: ${mensagem}`);
    
    return true;
  } catch (error) {
    console.error('Erro ao fazer ligação Twilio:', error);
    return false;
  }
};

/**
 * Send delivery notification through all available channels
 * @param telefone Client phone number
 * @returns Promise with success status for each channel
 */
export const notificarEntrega = async (telefone: string): Promise<{whatsapp: boolean, ligacao: boolean}> => {
  // Send WhatsApp message
  const whatsappEnviado = await enviarMensagemWhatsApp(telefone);
  
  // Make Twilio call if credits are available
  const ligacaoFeita = await fazerLigacaoTwilio(telefone);
  
  return {
    whatsapp: whatsappEnviado,
    ligacao: ligacaoFeita
  };
};
