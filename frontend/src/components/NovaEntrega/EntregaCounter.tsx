
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface EntregaCounterProps {
  contadorDiario: number;
  planoLimite: number;
}

const EntregaCounter: React.FC<EntregaCounterProps> = ({ contadorDiario, planoLimite }) => {
  const navigate = useNavigate();
  
  const navegarParaRota = () => {
    navigate('/rota');
  };

  return (
    <div className="flex justify-between items-center">
      <div className="text-sm font-medium">
        <span className={contadorDiario >= planoLimite ? "text-red-500" : "text-green-500"}>
          {contadorDiario} de {planoLimite}
        </span> entregas hoje
      </div>
      <Button onClick={navegarParaRota} className="bg-rotaspeed-secondary hover:bg-green-600">
        Ver Rota Otimizada
      </Button>
    </div>
  );
};

export default EntregaCounter;
