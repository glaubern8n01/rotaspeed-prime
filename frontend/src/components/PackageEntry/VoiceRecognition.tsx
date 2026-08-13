
import React, { useState, useEffect, useRef } from 'react';
import { Mic, StopCircle, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

interface VoiceRecognitionProps {
  onResult: (text: string) => void;
}

const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({ onResult }) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [stopRequested, setStopRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editableText, setEditableText] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  
  // Estado para controlar limite de áudios
  const [limiteAudios, setLimiteAudios] = useState<number>(15);
  const [audiosUsados, setAudiosUsados] = useState<number>(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Verificar configurações e limites ao carregar
  useEffect(() => {
    try {
      const configSalva = localStorage.getItem('rotaspeed_config');
      if (configSalva) {
        const config = JSON.parse(configSalva);
        setAudiosUsados(config.audiosUsados || 0);
        
        // Definir limite com base no plano
        const plano = config.plano || 'essencial';
        switch(plano) {
          case 'motorista': setLimiteAudios(30); break;
          case 'avancado': setLimiteAudios(40); break;  
          case 'premium': setLimiteAudios(60); break;
          default: setLimiteAudios(15); // Plano essencial
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, []);

  useEffect(() => {
    // Feature detection
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // Usar o tipo não-padrão para compatibilidade com browsers
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || 
                                  (window as any).webkitSpeechRecognition;
      
      const recognitionInstance = new SpeechRecognitionAPI();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinalTranscript = finalTranscript;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinalTranscript += event.results[i][0].transcript + ' ';
            setFinalTranscript(currentFinalTranscript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const displayText = currentFinalTranscript + interimTranscript;
        setTranscript(displayText);
        
        // Atualizamos o texto editável em tempo real também
        setEditableText(displayText);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz', event.error);
        setError(`Erro no reconhecimento: ${event.error}`);
        toast({
          title: "Erro no reconhecimento de voz",
          description: `Erro: ${event.error}`,
          variant: "destructive"
        });
        setIsListening(false);
        
        // Mesmo com erro, se temos texto, mostramos o editor
        if (finalTranscript || transcript) {
          setEditableText(finalTranscript || transcript);
          setShowEditor(true);
        }
      };

      recognitionInstance.onend = () => {
        console.log("Reconhecimento de voz finalizado");
        
        // Se solicitamos parar, não reiniciar automaticamente
        if (!stopRequested && isListening) {
          console.log("Reiniciando reconhecimento de voz...");
          try {
            recognitionInstance.start();
          } catch (error) {
            console.error("Erro ao reiniciar o reconhecimento:", error);
            setIsListening(false);
            
            // Se temos texto e o reconhecimento terminou, mostrar editor
            if (finalTranscript || transcript) {
              setEditableText(finalTranscript || transcript);
              setShowEditor(true);
            }
          }
        } else {
          setIsListening(false);
          
          // Se temos um texto e paramos intencionalmente, mostrar editor
          if (finalTranscript || transcript) {
            setEditableText(finalTranscript || transcript);
            setShowEditor(true);
          }
        }
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.error("Erro ao limpar reconhecimento de voz:", error);
        }
      }
    };
  }, [toast, isListening, finalTranscript, stopRequested]);

  const startListening = () => {
    // Nota: ditado por voz não consome o limite de áudios do backend
    setError(null);
    setShowEditor(false);
    
    if (!recognition) {
      setError("Seu navegador não suporta reconhecimento de voz");
      toast({
        title: "Recurso não suportado",
        description: "Seu navegador não suporta reconhecimento de voz",
        variant: "destructive"
      });
      return;
    }

    try {
      setFinalTranscript('');
      setTranscript('');
      setEditableText('');
      setStopRequested(false);
      recognition.start();
      setIsListening(true);
      
      toast({
        title: "Reconhecimento de voz ativado",
        description: "Dite o endereço claramente"
      });
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento de voz:', error);
      setError("Não foi possível iniciar o reconhecimento de voz");
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o reconhecimento de voz",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      setStopRequested(true);
      
      try {
        recognition.stop();
        
        toast({
          title: "Reconhecimento finalizado",
          description: "Texto capturado com sucesso"
        });
      } catch (error) {
        console.error("Erro ao parar reconhecimento:", error);
        setIsListening(false);
        
        // Se falhou ao parar, ainda mostramos o editor se temos texto
        if (finalTranscript || transcript) {
          setEditableText(finalTranscript || transcript);
          setShowEditor(true);
        }
      }
    }
  };

  const handleSubmitEdited = () => {
    if (editableText.trim()) {
      onResult(editableText);
      setShowEditor(false);
      setFinalTranscript('');
      setTranscript('');
      setEditableText('');
    }
  };

  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Navegador não compatível</AlertTitle>
        <AlertDescription>
          Seu navegador não suporta reconhecimento de voz. Por favor, tente outro método de entrada 
          ou atualize seu navegador.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informação sobre limite de áudios */}
      <div className="bg-blue-50 p-3 rounded-md text-sm">
        <p className="text-blue-700">
          <strong>Nota:</strong> Ditado por voz direto <strong>não consome</strong> seu limite de áudios mensais.
        </p>
        <p className="text-blue-600 text-xs mt-1">
          Você usou {audiosUsados} de {limiteAudios} áudios processados neste mês.
          {audiosUsados >= limiteAudios && " Áudios extras custam R$ 0,40 cada."}
        </p>
      </div>
      
      {/* Sempre mostramos o editor de texto */}
      <div className="space-y-4">
        <div className={`p-3 ${showEditor || (transcript && !isListening) ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'} rounded-md`}>
          <p className="text-sm font-medium mb-2">
            {isListening ? 'Ouvindo... (dite o endereço de entrega)' : 'Texto reconhecido (edite se necessário):'}
          </p>
          <Textarea 
            ref={textareaRef}
            value={isListening ? transcript || "" : editableText} 
            onChange={(e) => setEditableText(e.target.value)}
            className="min-h-[100px] w-full p-2"
            placeholder={isListening ? "Ditando..." : "Edite o endereço reconhecido se necessário"}
            readOnly={isListening}
          />
        </div>
        
        <div className="flex space-x-2">
          {!isListening ? (
            <Button
              type="button"
              variant="outline"
              onClick={startListening}
              className="flex-1 border-blue-300 hover:bg-blue-50"
            >
              <Mic className="h-4 w-4 mr-2 text-blue-500" />
              Iniciar Ditado
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={stopListening}
              className="flex-1 border-red-300 text-red-500 hover:bg-red-50"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Parar Ditado
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleSubmitEdited}
            disabled={!editableText.trim() && !transcript.trim()}
            className="flex-1 bg-rotaspeed-primary hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Usar Texto
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Problema no reconhecimento</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VoiceRecognition;
