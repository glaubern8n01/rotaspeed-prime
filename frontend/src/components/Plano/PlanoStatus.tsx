
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Phone, Plus, Users } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { CREDITOS_CHECKOUT } from '@/services/types/planos';

const PlanoStatus = () => {
  const { user } = useAuth();
  const supabaseUser = user || {};

  const plano = supabaseUser.plano_nome || 'None';
  const ativo = supabaseUser.plano_ativo;
  const saldo = supabaseUser.saldo_creditos || 0;
  const entregas_hoje = supabaseUser.entregas_hoje || 0;
  const entregas_dia_max = supabaseUser.entregas_dia_max || 0;

  const handleCreditoPacote = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className={`mb-4 ${!ativo ? 'border-red-300 bg-red-50' : 'border-rotaspeed-primary/20'}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-gray-500">Plano atual:</p>
            <h2 className="text-lg font-semibold">{plano}</h2>
          </div>
          <Badge variant={ativo ? 'default' : 'destructive'} className="ml-auto">
            {ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        <div className="flex justify-between items-center mt-3">
          <span className="font-medium">Entregas hoje:</span>
          <span className={`font-semibold ${entregas_hoje >= entregas_dia_max ? 'text-red-500' : 'text-green-600'}`}>
            {entregas_hoje} de {entregas_dia_max}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <span className="font-medium flex items-center">
            <Phone size={16} className="mr-1" /> Créditos disponíveis:
          </span>
          <span className={`font-semibold ${saldo > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {saldo}
          </span>
        </div>
        
        {(!ativo || saldo <= 0) && (
          <Alert className="mt-4" variant="destructive">
            <AlertTitle>
              {!ativo ? "Plano inativo" : "Sem créditos de voz"}
            </AlertTitle>
            <AlertDescription>
              {!ativo 
                ? "Para continuar utilizando o app, por favor ative seu plano."
                : "Para utilizar as funcionalidades de voz, adicione créditos."
              }
            </AlertDescription>
          </Alert>
        )}

        {saldo <= 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium mb-2">Adicionar créditos de voz:</h3>
            <div className="grid grid-cols-3 gap-2">
              {CREDITOS_CHECKOUT.map((pacote) => (
                <Button
                  key={pacote.quantidade}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreditoPacote(pacote.url)}
                  className="flex-col h-auto py-2 border-green-200 hover:bg-green-50"
                >
                  <span className="text-green-700 font-semibold">{pacote.quantidade}</span>
                  <span className="text-xs text-gray-500">{pacote.preco}</span>
                </Button>
              ))}
            </div>
            
            <div className="text-xs text-gray-500 mt-1 text-center">
              Créditos são adicionados em até 1 dia útil após a confirmação do pagamento.
            </div>
          </div>
        )}
        
        <div className="flex justify-center mt-4">
          <Button
            onClick={() => window.open('https://wa.me/5527997730304?text=Olá,+quero+um+plano+especial+para+uso+corporativo+do+RotaSpeed', '_blank')}
            variant="outline"
            size="sm"
            className="text-gray-600 text-xs"
          >
            <Users size={14} className="mr-1" /> Precisa de mais de 5.000 créditos?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanoStatus;
