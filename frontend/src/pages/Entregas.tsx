
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import DeliveryTable, { Delivery } from '@/components/DeliveryList/DeliveryTable';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Entregas = () => {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Carregar entregas salvas
  useEffect(() => {
    // Em uma implementação real, isso viria do Supabase
    const entregasSalvas = localStorage.getItem('rotaspeed_entregas');
    if (entregasSalvas) {
      try {
        const parsedEntregas = JSON.parse(entregasSalvas);
        // Converter o formato das entregas salvas para o formato esperado por DeliveryTable
        const convertedDeliveries = parsedEntregas.map((entrega: any) => ({
          id: entrega.id || `entrega_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          endereco: entrega.endereco || '',
          numero: entrega.numero || '',
          bairro: entrega.bairro || '',
          cep: entrega.cep || '',
          status: entrega.status || 'pendente',
          criado_em: entrega.criado_em || new Date().toISOString(),
          entregue_em: entrega.entregue_em || undefined
        }));
        setDeliveries(convertedDeliveries);
      } catch (error) {
        console.error('Erro ao carregar entregas do localStorage:', error);
      }
    }
  }, []);
  
  const handleStatusChange = (id: string, status: 'pendente' | 'entregue' | 'cancelado') => {
    const updatedDeliveries = deliveries.map(delivery => {
      if (delivery.id === id) {
        return { 
          ...delivery, 
          status,
          ...(status === 'entregue' ? { entregue_em: new Date().toISOString() } : {}) 
        };
      }
      return delivery;
    });
    
    setDeliveries(updatedDeliveries);
    
    // Salvar no localStorage (em uma implementação real, seria no Supabase)
    localStorage.setItem('rotaspeed_entregas', JSON.stringify(updatedDeliveries));
    
    toast({
      title: `Entrega ${status === 'entregue' ? 'concluída' : status === 'cancelado' ? 'cancelada' : 'atualizada'}`,
      description: `O status da entrega foi alterado para ${status}`
    });
  };
  
  const handleViewMap = (delivery: Delivery) => {
    const address = `${delivery.endereco}, ${delivery.numero}, ${delivery.bairro}, ${delivery.cep}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
  };
  
  // Filter deliveries based on search query and status
  const filteredDeliveries = deliveries.filter(delivery => {
    // Filter by search query
    const addressMatch = 
      delivery.endereco.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.bairro.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.cep.includes(searchQuery);
    
    // Filter by status
    const statusMatch = 
      statusFilter === 'all' || 
      delivery.status === statusFilter;
    
    return addressMatch && statusMatch;
  });
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Entregas</h1>
          <p className="text-gray-600">
            Gerencie todas as suas entregas em um só lugar.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Buscar por endereço, bairro ou CEP"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Filtrar</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {deliveries.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4 text-center">
            <h3 className="text-yellow-800 font-medium mb-2">Nenhuma entrega encontrada</h3>
            <p className="text-sm text-yellow-700">
              Adicione entregas na página "Nova Entrega" para visualizá-las aqui.
            </p>
          </div>
        ) : (
          <DeliveryTable
            deliveries={filteredDeliveries}
            onStatusChange={handleStatusChange}
            onViewMap={handleViewMap}
          />
        )}
      </div>
    </Layout>
  );
};

export default Entregas;
