
import React from 'react';
import Layout from '../components/Layout';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ComoUsar = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <Card className="mb-6 border-rotaspeed-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-rotaspeed-primary mr-2" />
              <CardTitle className="text-2xl font-bold text-rotaspeed-primary">
                Como Usar o App RotaSpeed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ol className="list-decimal list-inside space-y-4 pl-2">
              <li className="text-base">
                <span className="font-medium">Acesse o painel com seu login de entregador.</span>
              </li>
              
              <li className="text-base">
                <span className="font-medium">Clique em "Nova Entrega" para enviar uma foto, áudio, texto ou planilha com os pacotes do dia.</span>
              </li>
              
              <li className="text-base">
                <span className="font-medium">O sistema processará automaticamente os endereços, otimizará a rota e exibirá o link de entrega.</span>
              </li>
              
              <li className="text-base">
                <span className="font-medium">Após cada confirmação, a próxima rota será liberada.</span>
              </li>
              
              <li className="text-base">
                <span className="font-medium">Acompanhe suas entregas e histórico acessando "Histórico de Rotas Otimizadas".</span>
              </li>
              
              <li className="text-base">
                <span className="font-medium">Caso atinja o limite de pacotes diários, o aplicativo informará e orientará sobre o plano.</span>
              </li>
              
              <li className="text-base">
                <span className="font-medium">Ao iniciar uma rota, uma mensagem será enviada automaticamente ao cliente, informando que a entrega está a caminho.</span>
              </li>
              
              <li className="text-base">
                <span className="font-medium">Você pode compartilhar o link da rota otimizada via WhatsApp diretamente pelo aplicativo.</span>
              </li>
              
              <li className="text-base">
                <span className="font-medium">Após o envio das rotas, o sistema oferece a opção de otimizar automaticamente ou permitir que você organize manualmente a ordem das entregas.</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ComoUsar;
