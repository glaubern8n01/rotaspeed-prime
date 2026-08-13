
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { extractAddressFromVoice } from '@/services/entregaService';
import { AddressExtraction } from '@/services/extraction/mediaExtractor';

interface AudioEntryProps {
  onProcess: (file: File) => Promise<void>;
}

// Define the type for extracted address
interface ExtractedAddress {
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
}

const AudioEntry: React.FC<AudioEntryProps> = ({ onProcess }) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [extractedAddress, setExtractedAddress] = useState<ExtractedAddress | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para controlar limite de áudios
  const [limiteAudios, setLimiteAudios] = useState<number>(15);
  const [audiosUsados, setAudiosUsados] = useState<number>(0);
  const [limiteExcedido, setLimiteExcedido] = useState<boolean>(false);
  
  // Verificar configurações e limites ao carregar
  useEffect(() => {
    try {
      const configSalva = localStorage.getItem('rotaspeed_config');
      if (configSalva) {
        const config = JSON.parse(configSalva);
        const usados = config.audiosUsados || 0;
        setAudiosUsados(usados);
        
        // Definir limite com base no plano
        const plano = config.plano || 'essencial';
        let limite = 15; // padrão
        
        switch(plano) {
          case 'motorista': limite = 30; break;
          case 'avancado': limite = 40; break;  
          case 'premium': limite = 60; break;
          default: limite = 15; // Plano essencial
        }
        
        setLimiteAudios(limite);
        setLimiteExcedido(usados >= limite);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, []);
  
  const startRecording = async () => {
    // Verificar limite de áudios
    if (limiteExcedido) {
      toast({
        title: "Limite de áudios atingido",
        description: `Você já utilizou ${audiosUsados} de ${limiteAudios} áudios disponíveis no seu plano. Cada áudio extra custa R$ 0,40.`,
        variant: "destructive"
      });
      return;
    }
    
    audioChunksRef.current = [];
    setExtractionError(null);
    setTranscribedText(null);
    setExtractedAddress(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], "audio-recording.wav", { type: 'audio/wav' });
        setAudioFile(file);
        
        // Stop tracks from the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      toast({
        title: "Gravação iniciada",
        description: "Grave o endereço de entrega claramente"
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Erro de acesso ao microfone",
        description: "Verifique as permissões do navegador",
        variant: "destructive"
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Gravação finalizada",
        description: "Áudio capturado com sucesso"
      });
    }
  };
  
  const handleFileUpload = () => {
    // Verificar limite de áudios
    if (limiteExcedido) {
      toast({
        title: "Limite de áudios atingido",
        description: `Você já utilizou ${audiosUsados} de ${limiteAudios} áudios disponíveis no seu plano. Cada áudio extra custa R$ 0,40.`,
        variant: "destructive"
      });
      return;
    }
    
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setExtractionError(null);
      setTranscribedText(null);
      setExtractedAddress(null);
      
      // Check file type
      if (!file.type.includes('audio/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo de áudio",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setAudioFile(file);
    }
  };
  
  // Incrementar contagem de áudios no sistema
  const incrementarContagemAudios = () => {
    try {
      const configSalva = localStorage.getItem('rotaspeed_config');
      if (configSalva) {
        const config = JSON.parse(configSalva);
        const novoTotal = (config.audiosUsados || 0) + 1;
        
        // Atualizar estado local também
        setAudiosUsados(novoTotal);
        setLimiteExcedido(novoTotal >= limiteAudios);
        
        // Salvar no localStorage
        localStorage.setItem('rotaspeed_config', JSON.stringify({
          ...config,
          audiosUsados: novoTotal
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar contagem de áudios:', error);
    }
  };
  
  const handleProcess = async () => {
    if (!audioFile) return;
    
    setIsLoading(true);
    try {
      // Incrementar uso de áudio
      incrementarContagemAudios();
      
      // Simular a transcrição de áudio
      // Em uma implementação real, aqui você enviaria o áudio para um serviço como OpenAI Whisper API
      const simulatedTranscription = `Rua das Flores número 123, Bairro Jardim Primavera, CEP 12345-678`;
      setTranscribedText(simulatedTranscription);
      
      // Extrair o endereço do texto transcrito
      const extractedData = await extractAddressFromVoice(simulatedTranscription);
      
      // Check if we got valid results and if the array has items
      if (!extractedData || extractedData.length === 0 || !extractedData[0].endereco) {
        setExtractionError("Não foi possível reconhecer o endereço neste áudio. Por favor, tente gravar novamente com maior clareza ou use outro método de entrada.");
        setIsLoading(false);
        return;
      }
      
      // Get the first item from the array - this is where we fix the error
      const firstAddress = extractedData[0];
      
      // Mostrar os dados extraídos do primeiro item do array
      setExtractedAddress({
        endereco: firstAddress.endereco || '',
        numero: firstAddress.numero || '',
        bairro: firstAddress.bairro || '',
        cep: firstAddress.cep || ''
      });
      
      // Processando o áudio com os dados extraídos
      await onProcess(audioFile);
      
      toast({
        title: "Áudio processado",
        description: "O áudio foi processado com sucesso e o endereço foi extraído"
      });
      
      // Reset after successful processing
      setAudioFile(null);
      setExtractionError(null);
      setTranscribedText(null);
      setExtractedAddress(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o áudio",
        variant: "destructive"
      });
      setExtractionError("Erro ao extrair dados do áudio. Tente ditar o endereço diretamente usando o método de ditado por voz ou inserir o texto manualmente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className="hidden"
      />
      
      {/* Mostrar informação sobre uso de áudios */}
      <div className="bg-blue-50 p-3 rounded-md flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm text-blue-600 mb-2 sm:mb-0">
          <span>Uso de áudio:</span>
          <Badge className="ml-2" variant={limiteExcedido ? "destructive" : "outline"}>
            {audiosUsados} de {limiteAudios} áudios
          </Badge>
        </div>
        
        {limiteExcedido && (
          <span className="text-xs text-red-500">
            Limite atingido. Áudios extras: R$ 0,40/cada
          </span>
        )}
        
        {!limiteExcedido && audiosUsados > limiteAudios * 0.8 && (
          <span className="text-xs text-amber-500">
            Quase no limite. Considere usar ditado por voz.
          </span>
        )}
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {!isRecording ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Grave um áudio ditando o endereço ou faça upload
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                type="button"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={startRecording}
                disabled={limiteExcedido}
              >
                <Mic className="h-4 w-4 mr-2" />
                Gravar Áudio
              </Button>
              <Button
                type="button"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={handleFileUpload}
                disabled={limiteExcedido}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            
            {limiteExcedido && (
              <p className="text-sm text-red-500 mt-2">
                Limite de áudios atingido. Use a opção "Ditado" para entrar com endereços por voz sem consumir seu limite.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                <Mic className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <p className="text-sm text-red-500 font-medium">
              Gravando áudio...
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={stopRecording}
              className="border-red-300 text-red-500 hover:bg-red-50"
            >
              <Square className="h-4 w-4 mr-2" />
              Parar Gravação
            </Button>
          </div>
        )}
      </div>
      
      {transcribedText && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-blue-800 font-medium mb-2">Texto transcrito:</h3>
          <p className="text-sm text-blue-700">{transcribedText}</p>
        </div>
      )}
      
      {extractedAddress && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-green-800 font-medium mb-2">Endereço extraído:</h3>
          <ul className="text-sm text-green-700">
            <li><strong>Rua:</strong> {extractedAddress.endereco}</li>
            <li><strong>Número:</strong> {extractedAddress.numero}</li>
            <li><strong>Bairro:</strong> {extractedAddress.bairro}</li>
            <li><strong>CEP:</strong> {extractedAddress.cep}</li>
          </ul>
        </div>
      )}
      
      {extractionError && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Problema no reconhecimento de áudio</AlertTitle>
          <AlertDescription>
            {extractionError}
          </AlertDescription>
        </Alert>
      )}
      
      {audioFile && !isRecording && (
        <div className="space-y-3">
          <div className="p-3 bg-gray-100 rounded-md flex justify-between items-center">
            <span className="text-sm truncate">{audioFile.name}</span>
            <span className="text-xs text-gray-500">
              {(audioFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
          
          <Button
            type="button"
            className="w-full bg-rotaspeed-primary hover:bg-blue-700 text-white"
            onClick={handleProcess}
            disabled={isLoading || limiteExcedido}
          >
            {isLoading ? "Processando..." : "Processar Áudio"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioEntry;
