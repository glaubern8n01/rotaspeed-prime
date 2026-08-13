
// Main entrega service that re-exports all functionality from specialized services

// Export types
export type { Entrega } from './types/entrega';
export { ENTREGAS_STORAGE_KEY } from './types/entrega';

// Export storage functions
export {
  loadEntregas,
  saveEntregas,
  addEntrega,
  updateEntregaStatus,
  getEntregaById,
  deleteEntrega,
  editEntrega,
  addMultipleEntregas
} from './storage/entregaStorage';

// Export stats functions
export {
  getEntregasCount,
  getEntregasCountByStatus,
  getEntregasByStatus,
  isLimitReached,
  getEntregasPorBairro,
  getEntregasPorDia,
  getProximaEntregaPendente,
  agruparEntregasPorEndereco
} from './stats/entregaStats';

// Export extraction functions
export {
  extractAddressFromImage,
  extractAddressFromVoice,
  extractAddressFromText,
  extractAddressFromPDF,
  extractAddressFromSpreadsheet,
} from './extraction/mediaExtractor';

// Re-export the AddressExtraction type with the proper 'export type' syntax
export type { AddressExtraction } from './extraction/mediaExtractor';

// Export messaging functions
export {
  sendDeliveryStartedMessage,
  sendDeliveryCompletedMessage,
  shareLocationViaWhatsApp,
  shareFullRouteViaWhatsApp
} from './messaging/whatsappMessaging';

// Export n8n integration functions
export {
  enviarParaN8n,
  salvarRotaConfirmada,
  buscarRotasConfirmadas
} from './n8nService';

// Export n8n types
export type { N8nResponse, RotaConfirmada } from './n8nService';
