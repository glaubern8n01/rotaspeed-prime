// Implementamos funções para enviar mensagens via WhatsApp

// Neste arquivo, podemos ter funções como:
// - Enviar mensagem de confirmação de entrega
// - Enviar mensagem de status da entrega
// - Compartilhar localização da entrega

import { Entrega } from '../types/entrega';

// Função para enviar mensagem quando a entrega é iniciada
export const sendDeliveryStartedMessage = (entrega: Entrega) => {
  if (!entrega.telefone) return false;
  
  const mensagem = `Sua entrega está a caminho! 🚀 Em breve estará em sua porta.`;
  const url = `https://wa.me/${entrega.telefone}?text=${encodeURIComponent(mensagem)}`;
  
  window.open(url, '_blank');
  return true;
};

// Função para enviar mensagem quando a entrega é concluída
export const sendDeliveryCompletedMessage = (entrega: Entrega) => {
  if (!entrega.telefone) return false;
  
  const mensagem = `Sua entrega foi concluída! ✅ Agradecemos a preferência.`;
  const url = `https://wa.me/${entrega.telefone}?text=${encodeURIComponent(mensagem)}`;
  
  window.open(url, '_blank');
  return true;
};

// Função para enviar a localização atual via WhatsApp
export const shareLocationViaWhatsApp = (entrega: Entrega) => {
  if (!entrega.endereco) return false;
  
  const endereco = `${entrega.endereco}, ${entrega.numero}, ${entrega.bairro}, ${entrega.cep}`;
  const mensagem = `📍 Nova entrega: ${endereco}`;
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  
  window.open(url, '_blank');
  return true;
};

// Função para compartilhar a rota completa via WhatsApp
export const shareFullRouteViaWhatsApp = (entregas: Entrega[]) => {
  if (!entregas || entregas.length === 0) return false;
  
  let mensagem = "🚚 *Minha rota de entregas:*\n\n";
  
  entregas.forEach((entrega, index) => {
    const endereco = `${entrega.endereco}, ${entrega.numero}, ${entrega.bairro}, ${entrega.cep}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    
    mensagem += `*${index + 1}.* ${entrega.cliente ? `${entrega.cliente} - ` : ''}${endereco}\n`;
    mensagem += `📍 ${googleMapsUrl}\n\n`;
  });
  
  mensagem += "Gerado pelo RotaSpeed";
  
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
  return true;
};
