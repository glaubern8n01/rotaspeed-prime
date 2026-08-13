
import { v4 as uuidv4 } from 'uuid';
import { Entrega } from '../types/entrega';

// Função auxiliar para analisar texto e extrair componentes de endereço e cliente
export const analisarTextoEndereco = (texto: string): Entrega => {
  // Dividir o texto em linhas
  const linhas = texto.split('\n').map(linha => linha.trim()).filter(Boolean);
  
  // Inicializar variáveis
  let endereco = '';
  let numero = '';
  let bairro = '';
  let cep = '';
  let cliente = '';
  let telefone = '';
  
  // Padrão para CEP brasileiro (00000-000 ou 00000000)
  const cepRegex = /\d{5}-?\d{3}/;
  
  // Padrão para telefone brasileiro (com ou sem DDD)
  const telefoneRegex = /(?:\(?\d{2}\)?\s?)?9?\d{4,5}-?\d{4}/;
  
  // Padrão para identificar potenciais nomes de ruas
  const ruaRegex = /(R\.?|RUA|AV\.?|AVENIDA|AL\.?|ALAMEDA|PÇA\.?|PRAÇA|ESTRADA|EST\.?|TRAVESSA|TV\.?)/i;
  
  // Padrão para identificar potenciais nomes de clientes (palavras começando com maiúscula)
  const nomeRegex = /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)+$/;
  
  // Processar cada linha para extrair informações
  for (const linha of linhas) {
    // Verificar se a linha contém um CEP
    const cepMatch = linha.match(cepRegex);
    if (cepMatch && !cep) {
      cep = cepMatch[0];
      
      // O restante da linha pode conter o bairro
      const indiceCep = linha.indexOf(cep);
      const possibleBairro = 
        linha.substring(0, indiceCep).trim() || 
        linha.substring(indiceCep + cep.length).trim();
      
      if (possibleBairro && !bairro) {
        bairro = possibleBairro;
      }
      continue;
    }
    
    // Verificar se a linha contém um telefone
    const telefoneMatch = linha.match(telefoneRegex);
    if (telefoneMatch && !telefone) {
      telefone = telefoneMatch[0];
      
      // O restante da linha pode conter o nome do cliente
      const indiceTelefone = linha.indexOf(telefone);
      const possibleCliente = 
        linha.substring(0, indiceTelefone).trim() || 
        linha.substring(indiceTelefone + telefone.length).trim();
      
      if (possibleCliente && !cliente && nomeRegex.test(possibleCliente)) {
        cliente = possibleCliente;
      }
      continue;
    }
    
    // Identificar possíveis nomes de rua
    if (ruaRegex.test(linha) && !endereco) {
      // Encontrar onde termina o nome da rua e começa o número
      const numeroMatch = linha.match(/(\s|,|-)(\d+)/);
      if (numeroMatch) {
        endereco = linha.substring(0, numeroMatch.index).trim();
        numero = numeroMatch[2];
      } else {
        endereco = linha;
      }
      continue;
    }
    
    // Verificar se a linha parece ser um nome de cliente
    if (!cliente && nomeRegex.test(linha)) {
      cliente = linha;
      continue;
    }
    
    // Se encontrarmos apenas números em uma linha, provavelmente é o número
    if (/^\d+$/.test(linha) && !numero) {
      numero = linha;
      continue;
    }
    
    // Se ainda não temos um endereço, usar a primeira linha
    if (!endereco && linhas.length > 0) {
      endereco = linha;
      continue;
    }
    
    // Se não temos um bairro ainda, usar a próxima linha disponível
    if (!bairro && endereco && linha !== endereco) {
      bairro = linha;
      continue;
    }
  }
  
  // Procurar campos em frases completas
  if (!cliente) {
    // Procurar padrões como "Cliente: João Silva" ou "Nome: Maria Santos"
    const clienteMatch = texto.match(/(cliente|nome|destinatario|para)[\s:]+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)+)/i);
    if (clienteMatch) {
      cliente = clienteMatch[2];
    }
  }
  
  // Se temos uma placa como a da imagem (Minas Gerais Casa 87 São Paulo - Vl. Glória)
  if (endereco.includes('Casa') && !numero) {
    const casaMatch = endereco.match(/Casa\s+(\d+)/i);
    if (casaMatch) {
      numero = casaMatch[1];
      endereco = endereco.replace(/Casa\s+\d+/i, '').trim();
    }
  }
  
  // Extrair número do endereço se ainda não tiver sido encontrado
  if (!numero && endereco) {
    const numeroNoEnderecoMatch = endereco.match(/\s(\d+)\s*$/);
    if (numeroNoEnderecoMatch) {
      numero = numeroNoEnderecoMatch[1];
      endereco = endereco.replace(/\s\d+\s*$/, '').trim();
    }
  }
  
  // Se o endereço contém o bairro no formato "... - Bairro", separar
  if (endereco.includes('-') && !bairro) {
    const partes = endereco.split('-');
    if (partes.length >= 2) {
      endereco = partes[0].trim();
      bairro = partes[1].trim();
    }
  }
  
  // Garantir que todos os campos tenham valores
  if (!endereco) endereco = "Endereço não identificado";
  if (!numero) numero = "s/n";
  if (!bairro) bairro = "Bairro não identificado";
  if (!cep) cep = "00000-000";
  
  return { 
    id: uuidv4(), // Add required ID field
    endereco, 
    numero, 
    bairro, 
    cep,
    cliente,
    telefone
  };
};

// Helper function to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Função para processar múltiplas linhas de texto como entregas separadas
export const processMultipleAddresses = (text: string): Entrega[] => {
  // Dividir o texto em linhas ou blocos
  const blocks = text.split('\n\n').filter(block => block.trim());
  const results: Entrega[] = [];
  
  // Para cada bloco, tentar extrair um endereço completo
  for (const block of blocks) {
    // Se o bloco tem várias linhas, processá-lo como uma entrega
    if (block.includes('\n')) {
      const entrega = analisarTextoEndereco(block);
      results.push(entrega);
      continue;
    }
    
    // Se o bloco é apenas uma linha, verificar se é um endereço completo
    if (block.includes(',') || block.includes(' - ')) {
      const entrega = analisarTextoEndereco(block);
      results.push(entrega);
      continue;
    }
  }
  
  // Se nenhum bloco foi processado, tentar processar o texto inteiro como um endereço
  if (results.length === 0 && text.trim()) {
    const entrega = analisarTextoEndereco(text);
    results.push(entrega);
  }
  
  return results;
};
