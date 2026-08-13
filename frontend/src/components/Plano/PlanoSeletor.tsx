
import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PLANOS_CHECKOUT } from '@/services/types/planos';
import { Check } from 'lucide-react';

interface PlanoSeletorProps {
  onClose: () => void;
  onPlanSelected: () => void;
}

const PlanoSeletor: React.FC<PlanoSeletorProps> = ({ onClose, onPlanSelected }) => {
  const handlePlanClick = (url: string) => {
    window.open(url, '_blank');
    onPlanSelected();
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl text-rotaspeed-primary">
            Escolha o plano ideal para você
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center mb-4">
            Selecione um dos planos abaixo para continuar utilizando o RotaSpeed
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANOS_CHECKOUT.map((plano, index) => (
            <div 
              key={index} 
              className="border rounded-lg p-4 hover:border-rotaspeed-primary transition-all flex flex-col"
            >
              <h3 className="font-bold text-lg text-rotaspeed-primary mb-1">{plano.nome}</h3>
              <p className="text-xl font-bold mb-4">{plano.preco}</p>
              
              <ul className="space-y-2 flex-grow mb-4">
                <li className="flex items-start">
                  <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                  <span>{plano.entregas === 999999 ? 'Entregas ilimitadas' : `${plano.entregas} entregas por dia`}</span>
                </li>
                
                {plano.creditos > 0 && (
                  <li className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                    <span>{plano.creditos} créditos de voz</span>
                  </li>
                )}
                
                <li className="flex items-start">
                  <Check size={18} className="text-green-500 mr-2 mt-0.5" />
                  <span>Suporte por WhatsApp</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => handlePlanClick(plano.url)}
                className="w-full bg-rotaspeed-secondary hover:bg-rotaspeed-secondary/90"
              >
                Escolher plano
              </Button>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Fechar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PlanoSeletor;
