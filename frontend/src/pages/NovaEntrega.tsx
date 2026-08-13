
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useToast } from '@/components/ui/use-toast';
import { 
  loadEntregas, 
  addEntrega, 
  addMultipleEntregas,
  Entrega,
  extractAddressFromImage,
  extractAddressFromVoice,
  extractAddressFromText,
  extractAddressFromPDF,
  extractAddressFromSpreadsheet,
  enviarParaN8n,
  salvarRotaConfirmada,
  AddressExtraction
} from '@/services/entregaService';
import EntregasList from '@/components/NovaEntrega/EntregasList';
import EntregaCounter from '@/components/NovaEntrega/EntregaCounter';
import EntregaInputTabs from '@/components/NovaEntrega/EntregaInputTabs';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ExternalLink } from 'lucide-react';
import PlanoStatus from '@/components/Plano/PlanoStatus';
import { podeFazerMaisEntregas, incrementarEntregasHoje, getPlanoFromSupabase } from '@/services/planoService';

const NovaEntrega = () => {
  const { toast } = useToast();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [contadorDiario, setContadorDiario] = useState<number>(0);
  const [planoLimite, setPlanoLimite] = useState<number>(85);
  const [showRotaDialog, setShowRotaDialog] = useState(false);
  const [rotaLink, setRotaLink] = useState<string>('');
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [planoAtivo, setPlanoAtivo] = useState<boolean>(true);

  // Carregar as entregas e verificar plano
  useEffect(() => {
    const carregarDados = async () => {
      // Carregar entregas do local storage
      const entregasCarregadas = loadEntregas();
      setEntregas(entregasCarregadas);
      setContadorDiario(entregasCarregadas.length);
      
      // Carregar informações do plano
      try {
        const planoInfo = await getPlanoFromSupabase();
        if (planoInfo) {
          setPlanoLimite(planoInfo.entregas_dia_max);
          setPlanoAtivo(planoInfo.plano_ativo);
          setContadorDiario(planoInfo.entregas_hoje);
        }
      } catch (error) {
        console.error('Erro ao carregar informações do plano:', error);
      }
    };

    // Verificar usuário autenticado via Supabase
    const verificarUsuario = async () => {
      try {
        const supabase = (window as any).supabase;
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUserId(user.id);
          } else {
            console.warn('Usuário não autenticado.');
          }
        } else {
          console.warn('Supabase não está disponível.');
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
      }
    };

    verificarUsuario();
    carregarDados();
  }, []);
  
  // Verificar se pode fazer mais entregas
  const verificarDisponibilidade = async (): Promise<boolean> => {
    // Verificar se o plano está ativo
    if (!planoAtivo) {
      toast({
        title: "Plano inativo",
        description: "Seu plano está inativo. Renove para continuar utilizando o RotaSpeed.",
        variant: "destructive"
      });
      return false;
    }
    
    // Verificar limites do plano
    const podeEntregar = await podeFazerMaisEntregas();
    
    if (!podeEntregar) {
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite de ${planoLimite} entregas do seu plano diário`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Processar a resposta do n8n e salvar no Supabase
  const processarRespostaN8n = async (endereco: AddressExtraction, file?: File) => {
    if (!userId) {
      toast({
        title: "Usuário não autenticado",
        description: "Você precisa estar autenticado para utilizar esta funcionalidade.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Incrementar contador de entregas no dia
      await incrementarEntregasHoje();
      
      // Enviar dados para o n8n
      const resposta = await enviarParaN8n(userId, endereco, file);
      
      if (resposta && resposta.status === "ok" && resposta.rota) {
        // Exibir o link da rota
        setRotaLink(resposta.rota);
        setShowRotaDialog(true);
        
        // Salvar no Supabase
        await salvarRotaConfirmada({
          id_entregador: userId,
          endereco: endereco.endereco,
          numero: endereco.numero,
          bairro: endereco.bairro,
          cep: endereco.cep,
          rota: resposta.rota
        });
        
        // Atualizar contador local
        setContadorDiario(prev => prev + 1);
        
        toast({
          title: "Rota gerada com sucesso",
          description: "A rota otimizada foi gerada e salva."
        });
      } else {
        toast({
          title: "Erro na resposta",
          description: "O servidor retornou uma resposta inválida.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao processar resposta do n8n:', error);
      toast({
        title: "Erro ao gerar rota",
        description: "Não foi possível gerar a rota otimizada. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Função para adicionar uma nova entrega de texto
  const handleTextSubmit = async (data: { endereco: string; numero: string; bairro: string; cep: string; cliente?: string; telefone?: string }) => {
    console.log('Text Submit:', data);
    
    // Verificar disponibilidade
    const disponivel = await verificarDisponibilidade();
    if (!disponivel) return;
    
    try {
      // Tentar extrair múltiplos endereços se o texto for grande
      if (data.endereco && data.endereco.length > 50) {
        const extractedAddresses = await extractAddressFromText(data.endereco);
        
        if (extractedAddresses && extractedAddresses.length > 1) {
          // Temos múltiplos endereços, adicionar todos
          const maxToAdd = Math.min(extractedAddresses.length, planoLimite - contadorDiario);
          
          if (maxToAdd <= 0) {
            toast({
              title: "Limite atingido",
              description: `Você atingiu o limite de ${planoLimite} entregas do seu plano diário`,
              variant: "destructive"
            });
            return;
          }
          
          const addressesToAdd = extractedAddresses.slice(0, maxToAdd);
          const novasEntregas = addMultipleEntregas(addressesToAdd);
          
          // Atualizar estado local
          setEntregas([...entregas, ...novasEntregas]);
          
          // Processar primeiro endereço com n8n
          if (addressesToAdd.length > 0) {
            await processarRespostaN8n(addressesToAdd[0]);
          }
          
          // Exibir toast de sucesso
          toast({
            title: "Múltiplos endereços adicionados",
            description: `${novasEntregas.length} endereços foram adicionados com sucesso`
          });
          
          return;
        }
      }
      
      // Adicionar nova entrega única
      const novaEntrega = addEntrega(data);
      
      // Atualizar estado local
      const novasEntregas = [...entregas, novaEntrega];
      setEntregas(novasEntregas);
      
      // Processar com n8n
      await processarRespostaN8n(data);
      
      // Exibir toast de sucesso
      toast({
        title: "Entrega adicionada",
        description: `Endereço: ${data.endereco}, ${data.numero} adicionado com sucesso`
      });
    } catch (error) {
      console.error('Erro ao salvar entregas:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a entrega",
        variant: "destructive"
      });
    }
  };
  
  // Função para processar imagens
  const handleImageProcess = async (file: File) => {
    // Verificar disponibilidade
    const disponivel = await verificarDisponibilidade();
    if (!disponivel) return;

    // Guardar o arquivo processado para envio posterior ao n8n
    setProcessedFile(file);
    
    try {
      // Tentar extrair endereço da imagem usando OCR
      const extractedData = await extractAddressFromImage(file);
      
      if (!extractedData || extractedData.length === 0) {
        toast({
          title: "Extração falhou",
          description: "Não foi possível extrair o endereço desta imagem. Por favor, tente outra imagem ou use outro método.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar se temos múltiplos endereços
      if (extractedData.length > 1) {
        // Temos múltiplos endereços, adicionar todos
        const maxToAdd = Math.min(extractedData.length, planoLimite - contadorDiario);
        
        if (maxToAdd <= 0) {
          toast({
            title: "Limite atingido",
            description: `Você atingiu o limite de ${planoLimite} entregas do seu plano diário`,
            variant: "destructive"
          });
          return;
        }
        
        const addressesToAdd = extractedData.slice(0, maxToAdd);
        const novasEntregas = addMultipleEntregas(addressesToAdd);
        
        // Atualizar estado local
        setEntregas([...entregas, ...novasEntregas]);
        
        // Processar primeiro endereço com n8n
        if (addressesToAdd.length > 0) {
          await processarRespostaN8n(addressesToAdd[0], file);
        }
        
        // Exibir toast de sucesso
        toast({
          title: "Múltiplos endereços adicionados",
          description: `${novasEntregas.length} endereços foram adicionados com sucesso`
        });
      } else {
        // Adicionar um único endereço
        await handleTextSubmit(extractedData[0]);
        
        // Processar com n8n
        await processarRespostaN8n(extractedData[0], file);
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast({
        title: "Erro de processamento",
        description: "Ocorreu um erro ao processar a imagem. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessedFile(null);
    }
  };
  
  // Função para processar áudio
  const handleAudioProcess = async (file: File) => {
    // Verificar disponibilidade
    const disponivel = await verificarDisponibilidade();
    if (!disponivel) return;
    
    // Guardar o arquivo processado para envio posterior ao n8n
    setProcessedFile(file);
    
    try {
      // Em uma implementação real, enviaria o áudio para a API Whisper da OpenAI
      // e processaria a resposta
      
      // Simulando a transcrição
      const simulatedTranscription = "Rua das Flores número 1500, Bairro Jardim Primavera, CEP 01234-567, Cliente João da Silva";
      
      // Extrair endereço do texto transcrito
      const extractedData = await extractAddressFromVoice(simulatedTranscription);
      
      if (!extractedData || extractedData.length === 0) {
        toast({
          title: "Extração falhou",
          description: "Não foi possível extrair o endereço deste áudio. Por favor, tente gravar novamente ou use outro método.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar se temos múltiplos endereços
      if (extractedData.length > 1) {
        // Adicionar todos os endereços
        const maxToAdd = Math.min(extractedData.length, planoLimite - contadorDiario);
        
        if (maxToAdd <= 0) {
          toast({
            title: "Limite atingido",
            description: `Você atingiu o limite de ${planoLimite} entregas do seu plano diário`,
            variant: "destructive"
          });
          return;
        }
        
        const addressesToAdd = extractedData.slice(0, maxToAdd);
        const novasEntregas = addMultipleEntregas(addressesToAdd);
        
        // Atualizar estado local
        setEntregas([...entregas, ...novasEntregas]);
        
        // Processar primeiro endereço com n8n
        if (addressesToAdd.length > 0) {
          await processarRespostaN8n(addressesToAdd[0], file);
        }
        
        // Exibir toast de sucesso
        toast({
          title: "Múltiplos endereços adicionados",
          description: `${novasEntregas.length} endereços foram adicionados com sucesso`
        });
      } else {
        // Adicionar um único endereço
        await handleTextSubmit(extractedData[0]);
        
        // Processar com n8n
        await processarRespostaN8n(extractedData[0], file);
      }
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      toast({
        title: "Erro de processamento",
        description: "Ocorreu um erro ao processar o áudio. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessedFile(null);
    }
  };
  
  // Função para processar PDF
  const handlePDFProcess = async (file: File) => {
    // Verificar disponibilidade
    const disponivel = await verificarDisponibilidade();
    if (!disponivel) return;
    
    // Guardar o arquivo processado para envio posterior ao n8n
    setProcessedFile(file);
    
    try {
      const extractedData = await extractAddressFromPDF(file);
      
      if (!extractedData || extractedData.length === 0) {
        toast({
          title: "Extração falhou",
          description: "Não foi possível extrair endereços deste PDF. Por favor, tente outro arquivo ou método.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar quantidade de endereços disponíveis
      const maxToAdd = Math.min(extractedData.length, planoLimite - contadorDiario);
      
      if (maxToAdd <= 0) {
        toast({
          title: "Limite atingido",
          description: `Você atingiu o limite de ${planoLimite} entregas do seu plano diário`,
          variant: "destructive"
        });
        return;
      }
      
      const addressesToAdd = extractedData.slice(0, maxToAdd);
      const novasEntregas = addMultipleEntregas(addressesToAdd);
      
      // Atualizar estado local
      setEntregas([...entregas, ...novasEntregas]);
      
      // Processar primeiro endereço com n8n
      if (addressesToAdd.length > 0) {
        await processarRespostaN8n(addressesToAdd[0], file);
      }
      
      // Exibir toast de sucesso
      toast({
        title: "Endereços do PDF adicionados",
        description: `${novasEntregas.length} endereços foram adicionados com sucesso`
      });
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      toast({
        title: "Erro de processamento",
        description: "Ocorreu um erro ao processar o PDF. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessedFile(null);
    }
  };
  
  // Função para processar planilha
  const handleSpreadsheetProcess = async (file: File) => {
    // Verificar disponibilidade
    const disponivel = await verificarDisponibilidade();
    if (!disponivel) return;
    
    // Guardar o arquivo processado para envio posterior ao n8n
    setProcessedFile(file);
    
    try {
      const extractedData = await extractAddressFromSpreadsheet(file);
      
      if (!extractedData || extractedData.length === 0) {
        toast({
          title: "Extração falhou",
          description: "Não foi possível extrair endereços desta planilha. Por favor, tente outro arquivo ou método.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar quantidade de endereços disponíveis
      const maxToAdd = Math.min(extractedData.length, planoLimite - contadorDiario);
      
      if (maxToAdd <= 0) {
        toast({
          title: "Limite atingido",
          description: `Você atingiu o limite de ${planoLimite} entregas do seu plano diário`,
          variant: "destructive"
        });
        return;
      }
      
      const addressesToAdd = extractedData.slice(0, maxToAdd);
      const novasEntregas = addMultipleEntregas(addressesToAdd);
      
      // Atualizar estado local
      setEntregas([...entregas, ...novasEntregas]);
      
      // Processar primeiro endereço com n8n
      if (addressesToAdd.length > 0) {
        await processarRespostaN8n(addressesToAdd[0], file);
      }
      
      // Exibir toast de sucesso
      toast({
        title: "Endereços da planilha adicionados",
        description: `${novasEntregas.length} endereços foram adicionados com sucesso`
      });
    } catch (error) {
      console.error('Erro ao processar planilha:', error);
      toast({
        title: "Erro de processamento",
        description: "Ocorreu um erro ao processar a planilha. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessedFile(null);
    }
  };
  
  // Função para processar texto de reconhecimento de voz
  const handleVoiceRecognition = async (text: string) => {
    console.log('Speech recognized:', text);
    
    if (text.trim() === '') {
      toast({
        title: "Texto vazio",
        description: "Não foi possível reconhecer o texto. Por favor, tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar disponibilidade
    const disponivel = await verificarDisponibilidade();
    if (!disponivel) return;
    
    try {
      // Extrair endereço do ditado
      const extractedData = await extractAddressFromVoice(text);
      
      if (!extractedData || extractedData.length === 0) {
        toast({
          title: "Extração falhou",
          description: "Não foi possível extrair o endereço do ditado. Por favor, seja mais claro ou use outro método.",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar se temos múltiplos endereços
      if (extractedData.length > 1) {
        // Adicionar todos os endereços
        const maxToAdd = Math.min(extractedData.length, planoLimite - contadorDiario);
        
        if (maxToAdd <= 0) {
          toast({
            title: "Limite atingido",
            description: `Você atingiu o limite de ${planoLimite} entregas do seu plano diário`,
            variant: "destructive"
          });
          return;
        }
        
        const addressesToAdd = extractedData.slice(0, maxToAdd);
        const novasEntregas = addMultipleEntregas(addressesToAdd);
        
        // Atualizar estado local
        setEntregas([...entregas, ...novasEntregas]);
        
        // Processar primeiro endereço com n8n
        if (addressesToAdd.length > 0) {
          await processarRespostaN8n(addressesToAdd[0]);
        }
        
        // Exibir toast de sucesso
        toast({
          title: "Múltiplos endereços adicionados",
          description: `${novasEntregas.length} endereços foram adicionados com sucesso`
        });
      } else {
        // Adicionar um único endereço
        handleTextSubmit(extractedData[0]);
      }
    } catch (error) {
      console.error('Erro ao extrair endereço do ditado:', error);
      toast({
        title: "Erro de processamento",
        description: "Ocorreu um erro ao processar o texto ditado. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Nova Entrega</h1>
          <p className="text-gray-600">Adicione um novo endereço para entrega usando qualquer método abaixo.</p>
        </div>
        
        {/* Plan Status Component */}
        <PlanoStatus />
        
        <EntregaCounter 
          contadorDiario={contadorDiario} 
          planoLimite={planoLimite} 
        />
        
        <EntregasList entregas={entregas} />
        
        <EntregaInputTabs 
          onTextSubmit={handleTextSubmit}
          onImageProcess={handleImageProcess}
          onAudioProcess={handleAudioProcess}
          onPDFProcess={handlePDFProcess}
          onSpreadsheetProcess={handleSpreadsheetProcess}
          onVoiceRecognition={handleVoiceRecognition}
        />

        {/* Dialog para mostrar a rota gerada */}
        <AlertDialog open={showRotaDialog} onOpenChange={setShowRotaDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rota Otimizada Gerada</AlertDialogTitle>
              <AlertDialogDescription>
                Sua rota foi processada com sucesso pelo n8n. Clique no link abaixo para acessar:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <a 
                href={rotaLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                Abrir Rota no Google Maps
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction>Fechar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default NovaEntrega;
