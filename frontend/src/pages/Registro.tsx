
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/components/Auth/RegisterForm';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PLANOS_CHECKOUT } from '@/services/types/planos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Users, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Registro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planData, setPlanData] = useState<any | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  
  // If user is already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  const handlePlanSelection = (planName: string) => {
    // Find the selected plan data
    const selected = PLANOS_CHECKOUT.find(plan => plan.nome === planName);
    if (!selected) return;
    
    setSelectedPlanId(planName);
    
    // Map the plan to our internal plan data structure
    setPlanData({
      nome: selected.nome,
      entregas_dia_max: selected.entregas,
      saldo_creditos: selected.creditos
    });
    
    // Open selected plan in a new tab
    window.open(selected.url, '_blank');
    
    // Show a toast and then show the registration form
    toast({
      title: "Plano selecionado",
      description: "Após finalizar o pagamento, complete seu cadastro abaixo"
    });
    
    // Show registration form
    setShowRegistrationForm(true);
  };
  
  const handleRegister = async (userData: {
    nome: string;
    email: string;
    senha: string;
    tipo?: 'motoboy' | 'motorista';
    selfieUrl?: string | null;
    placaVeiculo?: string;
  }) => {
    try {
      // Verificar se o Supabase está disponível
      const supabase = (window as any).supabase;
      if (!supabase) {
        toast({ 
          title: "Erro de conexão", 
          description: "Não foi possível conectar ao servidor",
          variant: "destructive"
        });
        return;
      }
      
      // Registrar com Supabase
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.senha,
        options: {
          data: {
            nome: userData.nome,
            tipo: userData.tipo || 'motorista',
            placa_veiculo: userData.placaVeiculo || '',
            plano_nome: planData?.nome || 'Start',
            plano_ativo: true
          }
        }
      });
      
      if (error) throw error;
      
      if (data.session?.user) {
        // Create profile in usuarios_rotaspeed table
        const profileData = {
          id: data.session.user.id,
          nome: userData.nome,
          plano_nome: planData?.nome || 'Start',
          plano_ativo: true,
          entregas_dia_max: planData?.entregas_dia_max || 85,
          entregas_hoje: 0,
          ultima_atualizacao: new Date().toISOString(),
          saldo_creditos: planData?.saldo_creditos || 0,
          created_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase
          .from('usuarios_rotaspeed')
          .insert([profileData]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          toast({ 
            title: "Cadastro parcial", 
            description: "Sua conta foi criada, mas houve um erro ao configurar seu plano. Por favor, contate o suporte.",
            variant: "destructive" 
          });
        }
      }
      
      // Registro bem-sucedido
      toast({
        title: "Registro concluído",
        description: "Sua conta foi criada com sucesso"
      });
      
      // Redirecionar automaticamente após curto tempo
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no registro",
        description: error?.message || "Erro ao criar conta",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {!showRegistrationForm ? (
        <>
          <div className="max-w-4xl w-full text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-3">
              Escolha o plano ideal para suas entregas
            </h1>
            <p className="text-xl text-gray-600">
              O RotaSpeed oferece diferentes planos para atender às suas necessidades de entregas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full">
            {PLANOS_CHECKOUT.map((plano) => (
              <Card 
                key={plano.nome} 
                className={`flex flex-col ${selectedPlanId === plano.nome ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}
              >
                <CardHeader>
                  <CardTitle>{plano.nome}</CardTitle>
                  <CardDescription>{plano.preco}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check size={18} className="text-green-600 mr-2 mt-0.5" />
                      <span>Até {plano.entregas} entregas/dia</span>
                    </li>
                    {plano.nome === 'Start' && (
                      <>
                        <li className="flex items-start">
                          <Check size={18} className="text-green-600 mr-2 mt-0.5" />
                          <span>Dashboard completo</span>
                        </li>
                        <li className="flex items-start">
                          <Check size={18} className="text-green-600 mr-2 mt-0.5" />
                          <span>Geração de rotas otimizadas</span>
                        </li>
                      </>
                    )}
                    {plano.nome === 'Motorista' && (
                      <>
                        <li className="flex items-start">
                          <Check size={18} className="text-green-600 mr-2 mt-0.5" />
                          <span>Suporte a foto, áudio, texto, PDF</span>
                        </li>
                        <li className="flex items-start">
                          <Check size={18} className="text-green-600 mr-2 mt-0.5" />
                          <span>Roteamento inteligente</span>
                        </li>
                      </>
                    )}
                    {plano.nome === 'Profissional' && (
                      <>
                        <li className="flex items-start">
                          <Check size={18} className="text-green-600 mr-2 mt-0.5" />
                          <span>Tudo dos planos anteriores</span>
                        </li>
                        <li className="flex items-start">
                          <Check size={18} className="text-green-600 mr-2 mt-0.5" />
                          <span>Opções de exportação habilitadas</span>
                        </li>
                      </>
                    )}
                    {plano.nome === 'Premium Inteligente' && (
                      <>
                        <li className="flex items-start">
                          <Phone size={18} className="text-blue-600 mr-2 mt-0.5" />
                          <span>{plano.creditos} créditos de voz por mês</span>
                        </li>
                        <li className="flex items-start">
                          <Check size={18} className="text-green-600 mr-2 mt-0.5" />
                          <span>WhatsApp + ligação para cliente</span>
                        </li>
                        <li className="flex items-start">
                          <Users size={18} className="text-purple-600 mr-2 mt-0.5" />
                          <span>Prioridade para atualizações</span>
                        </li>
                      </>
                    )}
                  </ul>
                  
                  {plano.creditos > 0 && (
                    <Badge className="mt-3 bg-blue-100 text-blue-700 hover:bg-blue-200">
                      {plano.creditos} créditos de voz
                    </Badge>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-rotaspeed-primary hover:bg-blue-700"
                    onClick={() => handlePlanSelection(plano.nome)}
                  >
                    Selecionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="mt-10 text-center max-w-lg">
            <h3 className="text-lg font-semibold mb-2">Como funciona?</h3>
            <ol className="text-left list-decimal pl-5 space-y-2">
              <li>Escolha um plano acima que se adeque às suas necessidades</li>
              <li>Conclua o pagamento na página que será aberta</li>
              <li>Complete seu cadastro na tela que aparecerá após a seleção do plano</li>
              <li>Acesse imediatamente todas as funcionalidades do RotaSpeed</li>
            </ol>
          </div>
        </>
      ) : (
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Complete seu cadastro
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Plano selecionado: {planData?.nome}
            </p>
          </div>
          
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <RegisterForm onRegister={handleRegister} planoSelecionado={planData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Registro;
