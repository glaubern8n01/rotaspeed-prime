
import React, { useState, useRef } from 'react';
import { FileSpreadsheet, FileText, Upload, X, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface FileEntryProps {
  onProcessPDF: (file: File) => Promise<void>;
  onProcessSpreadsheet: (file: File) => Promise<void>;
}

const FileEntry: React.FC<FileEntryProps> = ({ onProcessPDF, onProcessSpreadsheet }) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showTextEditor, setShowTextEditor] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      const fileType = selectedFile.type;
      const isValidType = 
        fileType === 'application/pdf' || 
        fileType === 'application/vnd.ms-excel' ||
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'text/csv';
      
      if (!isValidType) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF ou planilha (Excel, CSV)",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Simulação de extração de texto para previsualização
  const simulateTextExtraction = async () => {
    if (!file) return;
    
    setIsLoading(true);
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let simulatedText = '';
    
    if (file.type.includes('pdf')) {
      simulatedText = `João da Silva
      Rua das Flores, 1234
      Jardim Primavera
      CEP 01234-567
      (11) 98765-4321
      
      Maria Oliveira
      Avenida Brasil, 789
      Centro
      CEP 12345-678
      (11) 91234-5678`;
    } else {
      simulatedText = `Nome;Endereço;Número;Bairro;CEP;Telefone
      Pedro Santos;Rua Augusta;1500;Consolação;01304-001;(11) 99876-5432
      Ana Pereira;Avenida Brigadeiro Faria Lima;3900;Itaim Bibi;04538-132;(11) 98765-1234
      Carlos Ferreira;Rua Oscar Freire;2500;Jardins;01426-001;(11) 97654-3210`;
    }
    
    setExtractedText(simulatedText);
    setShowTextEditor(true);
    setIsLoading(false);
  };
  
  const handleProcess = async () => {
    if (!file) return;
    
    setIsLoading(true);
    try {
      const fileType = file.type;
      
      if (fileType === 'application/pdf') {
        await onProcessPDF(file);
      } else {
        await onProcessSpreadsheet(file);
      }
      
      toast({
        title: "Arquivo processado",
        description: "O arquivo foi processado com sucesso"
      });
      
      // Reset after successful processing
      setFile(null);
      setExtractedText('');
      setShowTextEditor(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o arquivo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearFile = () => {
    setFile(null);
    setExtractedText('');
    setShowTextEditor(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleEditText = () => {
    if (file) {
      simulateTextExtraction();
    }
  };
  
  const handleUseEditedText = () => {
    // Implementar lógica para usar o texto editado
    toast({
      title: "Texto processado",
      description: "O texto editado será usado para criar entregas"
    });
    
    // Aqui enviaria o texto editado para processamento
    
    // Resetar estados
    setFile(null);
    setExtractedText('');
    setShowTextEditor(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const getFileIcon = () => {
    if (!file) return null;
    
    const fileType = file.type;
    
    if (fileType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    }
  };
  
  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.xlsx,.xls,.csv"
        className="hidden"
      />
      
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Carregue um PDF ou planilha com os endereços
            </p>
            <Button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getFileIcon()}
                <div className="ml-3">
                  <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          {showTextEditor ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 mb-2 font-medium">Texto extraído (edite se necessário):</p>
                <Textarea 
                  value={extractedText} 
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="min-h-[150px] w-full"
                  placeholder="O texto extraído do arquivo aparecerá aqui"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTextEditor(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleUseEditedText}
                  className="flex-1 bg-rotaspeed-primary hover:bg-blue-700"
                >
                  Usar Texto
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleEditText}
                className="flex-1"
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-2" />
                Extrair e Editar Texto
              </Button>
              <Button
                type="button"
                className="flex-1 bg-rotaspeed-primary hover:bg-blue-700 text-white"
                onClick={handleProcess}
                disabled={isLoading}
              >
                {isLoading ? "Processando..." : "Processar Diretamente"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileEntry;
