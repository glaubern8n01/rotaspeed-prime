
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface DeliveryProgressProps {
  total: number;
  completed: number;
}

const DeliveryProgress: React.FC<DeliveryProgressProps> = ({ total, completed }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="rotaspeed-card">
      <div className="flex justify-between mb-2">
        <h3 className="font-medium text-gray-700">Progresso do Dia</h3>
        <span className="text-rotaspeed-accent font-semibold">{percentage}%</span>
      </div>
      
      <Progress value={percentage} className="h-2 bg-gray-200" />
      
      <div className="flex justify-between mt-2 text-sm text-gray-500">
        <span>{completed} concluídas</span>
        <span>{total - completed} restantes</span>
      </div>
    </div>
  );
};

export default DeliveryProgress;
