
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
import { CREDITOS_CHECKOUT } from '@/services/types/planos';
import { CreditCard, Phone } from 'lucide-react';

interface CreditosSeletorProps {
  onClose: () => void;
  onCreditsPurchased: () => void;
}

const CreditosSeletor: React.FC<CreditosSeletorProps> = ({ onClose, onCreditsPurchased }) => {
  const handleCreditClick = (url: string) => {
    window.open(url, '_blank');
    onCreditsPurchased();
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl text-rotaspeed-primary">
            Créditos de Voz para Avisos Automáticos
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center mb-4">
            Compre créditos para ligar automaticamente para seus clientes a cada entrega
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDITOS_CHECKOUT.map((pacote, index) => (
            <div 
              key={index} 
              className="border rounded-lg p-4 hover:border-rotaspeed-primary transition-all flex flex-col"
            >
              <div className="mb-2 flex justify-center">
                <Phone size={32} className="text-rotaspeed-primary" />
              </div>
              <h3 className="font-bold text-center mb-1">{pacote.quantidade} créditos</h3>
              <p className="text-xl font-bold text-center mb-4">{pacote.preco}</p>
              
              <p className="text-sm text-gray-600 mb-4 text-center flex-grow">
                Cada crédito = 1 ligação automática para seu cliente
              </p>
              
              <Button 
                onClick={() => handleCreditClick(pacote.url)}
                className="w-full"
              >
                <CreditCard size={16} className="mr-2" /> Comprar via Pix
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

export default CreditosSeletor;
