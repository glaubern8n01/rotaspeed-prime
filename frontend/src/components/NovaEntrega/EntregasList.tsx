
import React from 'react';
import { Entrega } from '@/services/entregaService';

interface EntregasListProps {
  entregas: Entrega[];
}

const EntregasList: React.FC<EntregasListProps> = ({ entregas }) => {
  if (entregas.length === 0) {
    return null;
  }

  return (
    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
      <h3 className="text-green-800 font-medium mb-2">Entregas adicionadas: {entregas.length}</h3>
      <ul className="text-sm text-green-700 space-y-1 max-h-40 overflow-y-auto">
        {entregas.map((entrega, index) => (
          <li key={entrega.id || index}>• {entrega.endereco}, {entrega.numero} - {entrega.bairro} {entrega.cep}</li>
        ))}
      </ul>
    </div>
  );
};

export default EntregasList;
