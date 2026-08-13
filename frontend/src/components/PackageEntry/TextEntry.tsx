
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface TextEntryProps {
  onSubmit: (data: { endereco: string; numero: string; bairro: string; cep: string }) => void;
}

const TextEntry: React.FC<TextEntryProps> = ({ onSubmit }) => {
  const { toast } = useToast();
  const [enderecoCompleto, setEnderecoCompleto] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validar se há um endereço
    if (!enderecoCompleto.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o endereço completo",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      // Extração melhorada das informações
      // Tentar extrair diferentes partes do endereço usando regex
      const cepMatch = enderecoCompleto.match(/\d{5}[-\s]?\d{3}/);
      const cepEndereco = cepMatch ? cepMatch[0] : '';
      
      // Remover o CEP do endereço para processar o restante
      let enderecoSemCep = enderecoCompleto.replace(cepEndereco, '').trim();
      
      // Tentar extrair número
      const numeroMatch = enderecoSemCep.match(/\b\d+\b/);
      const numeroEndereco = numeroMatch ? numeroMatch[0] : '';
      
      // Tentar extrair bairro (assumindo que vem após uma vírgula)
      const parts = enderecoSemCep.split(',');
      let bairroEndereco = '';
      let enderecoBase = '';
      
      if (parts.length > 1) {
        // Se houver vírgulas, o primeiro é o endereço e o segundo pode ser o bairro
        enderecoBase = parts[0].trim();
        bairroEndereco = parts.slice(1).join(',').trim();
      } else {
        // Sem vírgulas, usar todo o conteúdo como endereço
        enderecoBase = enderecoSemCep;
      }
      
      // Dados para enviar
      const dadosEnvio = {
        endereco: enderecoBase,
        numero: numeroEndereco,
        bairro: bairroEndereco,
        cep: cepEndereco
      };
      
      console.log('Enviando dados:', dadosEnvio);
      
      // Chama a função onSubmit passada como prop
      onSubmit(dadosEnvio);
      
      // Limpar campo após sucesso
      setEnderecoCompleto('');
    } catch (error) {
      console.error('Erro ao processar endereço:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar a entrega",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="enderecoCompleto" className="text-base font-medium">Endereço completo</Label>
          <Input
            id="enderecoCompleto"
            name="enderecoCompleto"
            placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100"
            value={enderecoCompleto}
            onChange={(e) => setEnderecoCompleto(e.target.value)}
            className="bg-white border-2 focus:border-blue-500 text-base py-3"
          />
          <p className="text-sm text-gray-500">
            Digite o endereço completo incluindo número, bairro, cidade e CEP
          </p>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-rotaspeed-primary hover:bg-blue-700 py-6 text-lg font-medium"
          disabled={isLoading}
          style={{ visibility: 'visible', opacity: 1, display: 'block' }}
        >
          {isLoading ? "Adicionando..." : "Adicionar Entrega"}
        </Button>
      </form>
    </div>
  );
};

export default TextEntry;
