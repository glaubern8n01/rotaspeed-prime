
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Layout from '@/components/Layout';
import { loadEntregas, Entrega } from '@/services/entregaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChartIcon, BarChart3, CalendarRange, TrendingUp } from 'lucide-react';

type StatusCount = {
  name: string;
  value: number;
  color: string;
};

type BairroCount = {
  bairro: string;
  quantidade: number;
};

type DailyCount = {
  data: string;
  entregas: number;
  entregues: number;
  pendentes: number;
};

const Estatisticas: React.FC = () => {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [statusData, setStatusData] = useState<StatusCount[]>([]);
  const [bairroData, setBairroData] = useState<BairroCount[]>([]);
  const [dailyData, setDailyData] = useState<DailyCount[]>([]);
  
  useEffect(() => {
    // Carregar entregas e processar dados para os gráficos
    const carregarEntregas = () => {
      const todasEntregas = loadEntregas();
      setEntregas(todasEntregas);
      
      // Processar dados de status
      processarDadosStatus(todasEntregas);
      
      // Processar dados por bairro
      processarDadosBairro(todasEntregas);
      
      // Processar dados diários
      processarDadosDiarios(todasEntregas);
    };
    
    carregarEntregas();
  }, []);
  
  const processarDadosStatus = (entregas: Entrega[]) => {
    const pendentes = entregas.filter(e => e.status === 'pendente').length;
    const entregues = entregas.filter(e => e.status === 'entregue').length;
    const canceladas = entregas.filter(e => e.status === 'cancelado').length;
    
    setStatusData([
      { name: 'Pendentes', value: pendentes, color: '#FFBB28' },
      { name: 'Entregues', value: entregues, color: '#00C49F' },
      { name: 'Canceladas', value: canceladas, color: '#FF8042' }
    ]);
  };
  
  const processarDadosBairro = (entregas: Entrega[]) => {
    const bairros = entregas.reduce((acc, entrega) => {
      const bairro = entrega.bairro;
      if (!acc[bairro]) {
        acc[bairro] = 0;
      }
      acc[bairro] += 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Converter para formato de array e ordenar
    const bairrosArray = Object.entries(bairros)
      .map(([bairro, quantidade]) => ({ bairro, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10); // Limitar aos 10 bairros mais frequentes
    
    setBairroData(bairrosArray);
  };
  
  const processarDadosDiarios = (entregas: Entrega[]) => {
    // Agrupar por data (considerando apenas a data, não a hora)
    const porData: Record<string, { total: number, entregues: number, pendentes: number }> = {};
    
    entregas.forEach(entrega => {
      const data = new Date(entrega.criado_em || '').toLocaleDateString('pt-BR');
      if (!porData[data]) {
        porData[data] = { total: 0, entregues: 0, pendentes: 0 };
      }
      
      porData[data].total += 1;
      
      if (entrega.status === 'entregue') {
        porData[data].entregues += 1;
      } else if (entrega.status === 'pendente') {
        porData[data].pendentes += 1;
      }
    });
    
    // Converter para array e ordenar por data
    const dados = Object.entries(porData)
      .map(([data, valores]) => ({
        data,
        entregas: valores.total,
        entregues: valores.entregues,
        pendentes: valores.pendentes
      }))
      .sort((a, b) => {
        const dataA = a.data.split('/').reverse().join('-');
        const dataB = b.data.split('/').reverse().join('-');
        return dataA.localeCompare(dataB);
      })
      .slice(-7); // Últimos 7 dias
    
    setDailyData(dados);
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 shadow-sm rounded">
          <p className="text-sm font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  const renderCustomizedLabel = ({ name, percent }: any) => {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Estatísticas de Entregas</h1>
          <p className="text-gray-600">
            Visualize dados sobre suas entregas e métricas de desempenho
          </p>
        </div>
        
        <Tabs defaultValue="status">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="bairros" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Bairros
            </TabsTrigger>
            <TabsTrigger value="diario" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Por Dia
            </TabsTrigger>
            <TabsTrigger value="desempenho" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Desempenho
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Entregas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        label={renderCustomizedLabel}
                        fontSize={11}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bairros">
            <Card>
              <CardHeader>
                <CardTitle>Entregas por Bairro (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bairroData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="bairro" 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="#8884d8" name="Entregas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="diario">
            <Card>
              <CardHeader>
                <CardTitle>Entregas por Dia (Últimos 7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="entregues" stackId="a" fill="#00C49F" name="Entregues" />
                      <Bar dataKey="pendentes" stackId="a" fill="#FFBB28" name="Pendentes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="desempenho">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho de Entregas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                    <p className="text-sm text-blue-600">Taxa de Entregas</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {statusData.length > 0 && statusData[0].value + statusData[1].value > 0
                        ? `${Math.round((statusData[1].value / (statusData[0].value + statusData[1].value)) * 100)}%`
                        : '0%'}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      entregas concluídas / entregas totais
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                    <p className="text-sm text-green-600">Tempo Médio de Entrega</p>
                    <p className="text-3xl font-bold text-green-700">
                      {entregas.filter(e => e.status === 'entregue' && e.entregue_em && e.criado_em).length > 0
                        ? (() => {
                            const entreguesComData = entregas.filter(
                              e => e.status === 'entregue' && e.entregue_em && e.criado_em
                            );
                            
                            const tempoTotal = entreguesComData.reduce((acc, entrega) => {
                              const dataCriacao = new Date(entrega.criado_em || '');
                              const dataEntrega = new Date(entrega.entregue_em || '');
                              const diffHoras = (dataEntrega.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60);
                              return acc + diffHoras;
                            }, 0);
                            
                            return `${(tempoTotal / entreguesComData.length).toFixed(1)}h`;
                          })()
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      tempo médio desde a criação
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
                    <p className="text-sm text-purple-600">Entregas por Dia</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {dailyData.length > 0
                        ? Math.round(
                            dailyData.reduce((acc, dia) => acc + dia.entregas, 0) / dailyData.length
                          )
                        : '0'}
                    </p>
                    <p className="text-xs text-purple-500 mt-1">
                      média diária de entregas
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                    <p className="text-sm text-amber-600">Eficiência</p>
                    <p className="text-3xl font-bold text-amber-700">
                      {entregas.filter(e => e.status === 'entregue').length > 0
                        ? (() => {
                            const entregues = entregas.filter(e => e.status === 'entregue').length;
                            const canceladas = entregas.filter(e => e.status === 'cancelado').length;
                            return `${Math.round((entregues / (entregues + canceladas)) * 100)}%`;
                          })()
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-amber-500 mt-1">
                      entregas concluídas / (concluídas + canceladas)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Estatisticas;
