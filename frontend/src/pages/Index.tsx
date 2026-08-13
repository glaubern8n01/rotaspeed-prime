
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/Dashboard/StatCard';
import DeliveryProgress from '@/components/Dashboard/DeliveryProgress';
import NextDelivery from '@/components/Dashboard/NextDelivery';
import PlanoStatus from '@/components/Plano/PlanoStatus';
import { Package, Check, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  loadEntregas, 
  updateEntregaStatus, 
  Entrega, 
  getProximaEntregaPendente,
  sendDeliveryCompletedMessage
} from '@/services/entregaService';
import { notificarEntrega } from '@/services/comunicacaoService';
import { podeFazerMaisEntregas, incrementarEntregasHoje } from '@/services/planoService';

const Index = () => {
  const { toast } = useToast();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [nextDelivery, setNextDelivery] = useState<Entrega | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  
  // Carregar entregas do LocalStorage
  useEffect(() => {
    const carregarDados = () => {
      const entregasCarregadas = loadEntregas();
      setEntregas(entregasCarregadas);
      
      // Encontrar a próxima entrega pendente
      const proximaEntrega = getProximaEntregaPendente();
      setNextDelivery(proximaEntrega);
    };
    
    carregarDados();
    
    // Atualizar dados a cada 30 segundos
    const intervalId = setInterval(carregarDados, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Stats calculation
  const totalDeliveries = entregas.length;
  const completedDeliveries = entregas.filter(d => d.status === 'entregue').length;
  const pendingDeliveries = entregas.filter(d => d.status === 'pendente').length;
  
  // Função para marcar entrega como concluída
  const handleMarkComplete = async (id: string) => {
    if (!id) return;
    
    setLoadingNext(true);
    
    // Atualizar o status da entrega no armazenamento
    const success = updateEntregaStatus(id, 'entregue');
    
    if (success) {
      // Obter a entrega que foi completada
      const entregaConcluida = entregas.find(entrega => entrega.id === id);
      
      // Tentar enviar mensagem de conclusão se tiver os dados do cliente
      if (entregaConcluida && entregaConcluida.cliente && entregaConcluida.telefone) {
        // Usar o sendDeliveryCompletedMessage legado (compatibilidade)
        sendDeliveryCompletedMessage(entregaConcluida);
        
        // Novo sistema de notificações com Twilio/WhatsApp
        try {
          const notificacoes = await notificarEntrega(entregaConcluida.telefone);
          
          if (notificacoes.ligacao) {
            toast({
              title: "Cliente notificado",
              description: "Mensagem enviada por WhatsApp e ligação automática realizada"
            });
          } else if (notificacoes.whatsapp) {
            toast({
              title: "Cliente notificado",
              description: "Mensagem enviada por WhatsApp"
            });
          }
        } catch (error) {
          console.error('Erro ao notificar cliente:', error);
        }
      }
      
      // Atualizar estado local
      const updatedEntregas = entregas.map(entrega => 
        entrega.id === id 
          ? { ...entrega, status: 'entregue' as const, entregue_em: new Date().toISOString() } 
          : entrega
      );
      
      setEntregas(updatedEntregas);
      
      // Encontrar a próxima entrega pendente
      const proximaEntrega = updatedEntregas.find(d => d.status === 'pendente' && d.id !== id);
      setNextDelivery(proximaEntrega || null);
      
      toast({
        title: "Entrega confirmada",
        description: "A entrega foi marcada como concluída"
      });
    } else {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível confirmar a entrega",
        variant: "destructive"
      });
    }
    
    setLoadingNext(false);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Painel de Entregas</h1>
          <p className="text-gray-600">Bem-vindo ao RotaSpeed! Gerencie suas entregas com facilidade.</p>
        </div>
        
        {/* Plan Status Component */}
        <PlanoStatus />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Entregas Totais" 
            value={totalDeliveries} 
            icon={<Package className="h-5 w-5 text-white" />} 
            color="bg-rotaspeed-primary"
          />
          <StatCard 
            title="Entregas Concluídas" 
            value={completedDeliveries} 
            icon={<Check className="h-5 w-5 text-white" />} 
            color="bg-rotaspeed-secondary"
          />
          <StatCard 
            title="Entregas Pendentes" 
            value={pendingDeliveries} 
            icon={<Clock className="h-5 w-5 text-white" />} 
            color="bg-rotaspeed-accent"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeliveryProgress 
            total={totalDeliveries} 
            completed={completedDeliveries} 
          />
          <NextDelivery 
            delivery={nextDelivery} 
            onMarkComplete={handleMarkComplete}
            isLoading={loadingNext}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
