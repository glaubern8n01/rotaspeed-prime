
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useToast } from '@/components/ui/use-toast';
import { buscarRotasConfirmadas, RotaConfirmada } from '@/services/entregaService';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RotasConfirmadas = () => {
  const { toast } = useToast();
  const [rotas, setRotas] = useState<RotaConfirmada[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Verificar usuário autenticado via Supabase e carregar rotas
    const carregarDados = async () => {
      try {
        const supabase = (window as any).supabase;
        if (!supabase) {
          toast({
            title: "Erro de conexão",
            description: "A conexão com o Supabase não está disponível.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Obter usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Buscar rotas confirmadas do usuário
          const rotasUsuario = await buscarRotasConfirmadas(user.id);
          setRotas(rotasUsuario);
        } else {
          toast({
            title: "Não autenticado",
            description: "Você precisa estar logado para visualizar suas rotas.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Erro ao carregar rotas confirmadas:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao buscar suas rotas confirmadas.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [toast]);

  // Filtrar rotas com base na busca
  const rotasFiltradas = rotas.filter(rota => 
    rota.endereco.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rota.bairro.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rota.cep.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatar data para exibição
  const formatarData = (dataString?: string) => {
    if (!dataString) return "-";
    try {
      return format(new Date(dataString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dataString;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Rotas Confirmadas</h1>
          <p className="text-gray-600">
            Visualize todas as rotas otimizadas geradas pelo sistema.
          </p>
        </div>

        {userId ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Buscar por endereço, bairro ou CEP"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-2">Carregando rotas...</p>
              </div>
            ) : rotasFiltradas.length > 0 ? (
              <Table>
                <TableCaption>Lista de rotas confirmadas</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rotasFiltradas.map((rota) => (
                    <TableRow key={rota.id}>
                      <TableCell>
                        {rota.endereco}, {rota.numero}
                      </TableCell>
                      <TableCell>{rota.bairro}</TableCell>
                      <TableCell>{formatarData(rota.data_envio)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(rota.rota, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver Rota
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4 text-center">
                <h3 className="text-yellow-800 font-medium mb-2">Nenhuma rota encontrada</h3>
                <p className="text-sm text-yellow-700">
                  Ainda não há rotas confirmadas ou nenhuma corresponde à sua busca.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 text-center">
            <h3 className="text-blue-800 font-medium mb-2">Autenticação necessária</h3>
            <p className="text-sm text-blue-700">
              Faça login para visualizar suas rotas confirmadas.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RotasConfirmadas;
