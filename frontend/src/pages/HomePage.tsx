
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PLANOS_CHECKOUT } from '@/services/types/planos';
import { Check, ArrowRight, MapPin, BarChart, Route, Phone } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handlePlanSelection = (url: string) => {
    // First navigate to registration page
    navigate('/registro');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-rotaspeed-primary">RotaSpeed</span>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                className="mr-3"
                onClick={() => navigate('/login')}
              >
                Entrar
              </Button>
              <Button
                className="bg-rotaspeed-primary hover:bg-blue-700"
                onClick={() => navigate('/registro')}
              >
                Registrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-gray-50 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Roteirize entregas com</span>
              <span className="block text-rotaspeed-primary">Rapidez e Inteligência</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              O RotaSpeed é a solução ideal para entregadores, motoristas e empresas 
              que desejam otimizar suas entregas com rotas inteligentes.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Button 
                  className="w-full bg-rotaspeed-primary hover:bg-blue-700 py-3 px-8 text-lg"
                  onClick={() => navigate('/registro')}
                >
                  Começar Agora <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-rotaspeed-primary tracking-wide uppercase">Recursos</h2>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">Tudo o que você precisa para suas entregas</p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-rotaspeed-primary rounded-md shadow-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Rotas Otimizadas</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Algoritmos avançados para calcular a melhor rota entre múltiplos pontos de entrega, economizando tempo e combustível.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-rotaspeed-primary rounded-md shadow-lg">
                        <BarChart className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Análise de Desempenho</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Acompanhe estatísticas detalhadas sobre suas entregas, tempos médios e áreas mais atendidas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-rotaspeed-primary rounded-md shadow-lg">
                        <Route className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Múltiplas Fontes de Dados</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Adicione endereços por texto, voz, imagem ou importando arquivos, com reconhecimento automático.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-rotaspeed-primary rounded-md shadow-lg">
                        <Phone className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Notificação de Clientes</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Envie mensagens automáticas pelo WhatsApp e realize ligações automáticas quando a entrega estiver a caminho.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-rotaspeed-primary tracking-wide uppercase">Planos</h2>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">Escolha o plano ideal para suas necessidades</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-y-12 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANOS_CHECKOUT.map((plano) => (
              <div key={plano.nome} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-8">
                  <h3 className="text-xl font-bold text-gray-900">{plano.nome}</h3>
                  <p className="mt-4 text-2xl font-extrabold text-gray-900">{plano.preco}</p>
                  <p className="mt-1 text-sm text-gray-500">por mês</p>
                  
                  <div className="mt-6">
                    <ul className="space-y-4">
                      <li className="flex">
                        <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                        <span className="ml-3 text-gray-700">Até {plano.entregas} entregas/dia</span>
                      </li>

                      {plano.nome === 'Premium Inteligente' && (
                        <li className="flex">
                          <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                          <span className="ml-3 text-gray-700">{plano.creditos} créditos de voz</span>
                        </li>
                      )}
                      
                      {plano.nome === 'Start' && (
                        <>
                          <li className="flex">
                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="ml-3 text-gray-700">Dashboard completo</span>
                          </li>
                          <li className="flex">
                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="ml-3 text-gray-700">Rotas otimizadas</span>
                          </li>
                        </>
                      )}
                      
                      {plano.nome === 'Motorista' && (
                        <>
                          <li className="flex">
                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="ml-3 text-gray-700">Suporte para vários formatos</span>
                          </li>
                          <li className="flex">
                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="ml-3 text-gray-700">Roteamento inteligente</span>
                          </li>
                        </>
                      )}
                      
                      {plano.nome === 'Profissional' && (
                        <>
                          <li className="flex">
                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="ml-3 text-gray-700">Todas as funcionalidades</span>
                          </li>
                          <li className="flex">
                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                            <span className="ml-3 text-gray-700">Opções de exportação</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50">
                  <Button 
                    className="w-full bg-rotaspeed-primary hover:bg-blue-700"
                    onClick={() => handlePlanSelection(plano.url)}
                  >
                    Escolher {plano.nome}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-rotaspeed-primary">
        <div className="max-w-3xl mx-auto py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Pronto para otimizar suas entregas?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-100">
            Cadastre-se agora e comece a usar o RotaSpeed para tornar suas entregas mais rápidas e eficientes.
          </p>
          <div className="mt-8">
            <Button
              onClick={() => navigate('/registro')}
              className="bg-white text-rotaspeed-primary hover:bg-blue-50 py-3 px-6 text-base"
            >
              Cadastre-se agora
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            &copy; 2025 RotaSpeed. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
