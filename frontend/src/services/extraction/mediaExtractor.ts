
import { Entrega } from '../types/entrega';

// Interface for address extraction response
export interface AddressExtraction {
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  cliente?: string;
  telefone?: string;
}

// Extract address from image file
export const extractAddressFromImage = async (file: File): Promise<AddressExtraction[]> => {
  // In a real implementation, you would use OCR service like OCR.space or Google Vision API
  console.log('Extracting address from image:', file.name);
  
  // For now returning mock data
  return [{
    endereco: 'Avenida Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cep: '01310-100',
    cliente: 'Cliente Exemplo'
  }];
};

// Extract address from voice/audio recording
export const extractAddressFromVoice = async (audioText: string): Promise<AddressExtraction[]> => {
  // In real implementation, you would use NLP to extract structured address data
  console.log('Extracting address from voice text:', audioText);
  
  // Simple regex extraction (very basic, would need to be more robust in production)
  const enderecoMatch = audioText.match(/(?:rua|avenida|av|alameda|travessa|estrada)\s+([^\d,]+)/i);
  const numeroMatch = audioText.match(/(?:número|numero|nº|n°|n)\s*(\d+)/i);
  const bairroMatch = audioText.match(/(?:bairro|vila|jardim)\s+([^,]+)/i);
  const cepMatch = audioText.match(/(?:cep|código postal)\s*(\d{5}-?\d{3})/i);
  const clienteMatch = audioText.match(/(?:cliente|destinatário|destinatario|para)\s+([^,]+)/i);
  
  return [{
    endereco: enderecoMatch ? enderecoMatch[1].trim() : 'Endereco não identificado',
    numero: numeroMatch ? numeroMatch[1].trim() : 'S/N',
    bairro: bairroMatch ? bairroMatch[1].trim() : 'Bairro não identificado',
    cep: cepMatch ? cepMatch[1].trim() : '',
    cliente: clienteMatch ? clienteMatch[1].trim() : undefined
  }];
};

// Extract address from pasted or typed text
export const extractAddressFromText = async (text: string): Promise<AddressExtraction[]> => {
  console.log('Extracting address from text input');
  
  // Check if we have multiple lines (multiple addresses)
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length > 1) {
    // Process multiple addresses
    return lines.map(line => {
      // Very basic extraction - would need NLP in production
      const parts = line.split(',').map(part => part.trim());
      
      return {
        endereco: parts[0] || 'Endereço não identificado',
        numero: (parts[1] || 'S/N').replace(/[^\d]/g, '') || 'S/N',
        bairro: parts[2] || 'Bairro não identificado',
        cep: (parts[3] || '').match(/\d{5}-?\d{3}/) ? parts[3] : '',
        cliente: parts[4] || undefined
      };
    });
  } else {
    // Process single address
    const parts = text.split(',').map(part => part.trim());
    
    return [{
      endereco: parts[0] || 'Endereço não identificado',
      numero: (parts[1] || 'S/N').replace(/[^\d]/g, '') || 'S/N',
      bairro: parts[2] || 'Bairro não identificado',
      cep: (parts[3] || '').match(/\d{5}-?\d{3}/) ? parts[3] : '',
      cliente: parts[4] || undefined
    }];
  }
};

// Extract address from PDF document
export const extractAddressFromPDF = async (file: File): Promise<AddressExtraction[]> => {
  // In a real implementation, you would use PDF parsing library or API
  console.log('Extracting address from PDF:', file.name);
  
  // Returning mock data - in real app would extract from PDF content
  return [
    {
      endereco: 'Rua Augusta',
      numero: '1500',
      bairro: 'Consolação',
      cep: '01304-001',
      cliente: 'Cliente PDF 1'
    },
    {
      endereco: 'Avenida Rebouças',
      numero: '3970',
      bairro: 'Pinheiros',
      cep: '05402-600',
      cliente: 'Cliente PDF 2'
    }
  ];
};

// Extract addresses from spreadsheet (Excel/CSV)
export const extractAddressFromSpreadsheet = async (file: File): Promise<AddressExtraction[]> => {
  // In a real implementation, you would use spreadsheet parsing library
  console.log('Extracting addresses from spreadsheet:', file.name);
  
  // Returning mock data - in real app would extract from spreadsheet content
  return [
    {
      endereco: 'Avenida Brigadeiro Faria Lima',
      numero: '3477',
      bairro: 'Itaim Bibi',
      cep: '04538-133',
      cliente: 'Cliente Planilha 1',
      telefone: '11987654321'
    },
    {
      endereco: 'Rua Oscar Freire',
      numero: '585',
      bairro: 'Jardim Paulista',
      cep: '01426-001',
      cliente: 'Cliente Planilha 2',
      telefone: '11912345678'
    },
    {
      endereco: 'Avenida Paulista',
      numero: '2300',
      bairro: 'Bela Vista',
      cep: '01310-300',
      cliente: 'Cliente Planilha 3'
    }
  ];
};
