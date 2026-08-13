
import React from 'react';
import { ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Delivery {
  id: string;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
}

interface NextDeliveryProps {
  delivery: Delivery | null;
  onMarkComplete: (id: string) => void;
  isLoading?: boolean;
}

const NextDelivery: React.FC<NextDeliveryProps> = ({ delivery, onMarkComplete, isLoading = false }) => {
  if (!delivery) {
    return (
      <div className="rotaspeed-card">
        <h3 className="font-medium mb-4">Próxima Entrega</h3>
        <div className="h-32 flex items-center justify-center text-gray-500">
          Nenhuma entrega pendente
        </div>
      </div>
    );
  }

  const fullAddress = `${delivery.endereco}, ${delivery.numero}, ${delivery.bairro}, ${delivery.cep}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="rotaspeed-card">
      <h3 className="font-medium mb-4">Próxima Entrega</h3>
      
      <div className="mb-4">
        <p className="font-medium">{delivery.endereco}, {delivery.numero}</p>
        <p className="text-sm text-gray-600">{delivery.bairro} - CEP: {delivery.cep}</p>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => window.open(googleMapsUrl, '_blank')}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Navegar
        </Button>
        
        <Button 
          className="flex-1 bg-rotaspeed-secondary hover:bg-green-600"
          onClick={() => onMarkComplete(delivery.id)}
          disabled={isLoading}
        >
          {isLoading ? 'Processando...' : 'Confirmar Entrega'}
        </Button>
      </div>
      
      <div className="mt-3 text-center">
        <a 
          href={googleMapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center justify-center"
        >
          Ver no Google Maps
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </div>
    </div>
  );
};

export default NextDelivery;
