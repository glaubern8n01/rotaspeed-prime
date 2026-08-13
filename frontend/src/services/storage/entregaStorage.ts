// Implementamos funções para manipular entregas no localStorage

import { v4 as uuidv4 } from 'uuid';
import { Entrega, ENTREGAS_STORAGE_KEY } from '../types/entrega';

// Carregar todas as entregas do localStorage
export const loadEntregas = (): Entrega[] => {
  try {
    const entregas = localStorage.getItem(ENTREGAS_STORAGE_KEY);
    return entregas ? JSON.parse(entregas) : [];
  } catch (error) {
    console.error('Erro ao carregar entregas do localStorage:', error);
    return [];
  }
};

// Salvar todas as entregas no localStorage
export const saveEntregas = (entregas: Entrega[]): boolean => {
  try {
    localStorage.setItem(ENTREGAS_STORAGE_KEY, JSON.stringify(entregas));
    return true;
  } catch (error) {
    console.error('Erro ao salvar entregas no localStorage:', error);
    return false;
  }
};

// Adicionar nova entrega
export const addEntrega = (data: Partial<Entrega>): Entrega => {
  const entregas = loadEntregas();
  
  const novaEntrega: Entrega = {
    id: uuidv4(),
    endereco: data.endereco || '',
    numero: data.numero || '',
    bairro: data.bairro || '',
    cep: data.cep || '',
    status: 'pendente',
    criado_em: new Date().toISOString(),
    cliente: data.cliente || '',
    telefone: data.telefone || '',
    lat: data.lat,
    lng: data.lng
  };
  
  entregas.push(novaEntrega);
  saveEntregas(entregas);
  
  return novaEntrega;
};

// Adicionar múltiplas entregas de uma vez
export const addMultipleEntregas = (entregas: Partial<Entrega>[]): Entrega[] => {
  const existingEntregas = loadEntregas();
  const novasEntregas: Entrega[] = [];
  
  // Criar novas entregas com ID e campos padrão
  entregas.forEach(data => {
    const novaEntrega: Entrega = {
      id: uuidv4(),
      endereco: data.endereco || '',
      numero: data.numero || '',
      bairro: data.bairro || '',
      cep: data.cep || '',
      status: 'pendente',
      criado_em: new Date().toISOString(),
      cliente: data.cliente || '',
      telefone: data.telefone || '',
      lat: data.lat,
      lng: data.lng
    };
    
    novasEntregas.push(novaEntrega);
  });
  
  // Salvar todas as entregas
  saveEntregas([...existingEntregas, ...novasEntregas]);
  
  return novasEntregas;
};

// Atualizar status de uma entrega
export const updateEntregaStatus = (id: string, status: 'pendente' | 'entregue' | 'cancelado'): boolean => {
  const entregas = loadEntregas();
  const index = entregas.findIndex(e => e.id === id);
  
  if (index !== -1) {
    entregas[index] = {
      ...entregas[index],
      status,
      ...(status === 'entregue' ? { entregue_em: new Date().toISOString() } : {})
    };
    
    return saveEntregas(entregas);
  }
  
  return false;
};

// Obter entrega por ID
export const getEntregaById = (id: string): Entrega | null => {
  const entregas = loadEntregas();
  const entrega = entregas.find(e => e.id === id);
  return entrega || null;
};

// Editar uma entrega existente
export const editEntrega = (id: string, data: Partial<Entrega>): boolean => {
  const entregas = loadEntregas();
  const index = entregas.findIndex(e => e.id === id);
  
  if (index !== -1) {
    entregas[index] = {
      ...entregas[index],
      ...data
    };
    
    return saveEntregas(entregas);
  }
  
  return false;
};

// Excluir uma entrega
export const deleteEntrega = (id: string): boolean => {
  const entregas = loadEntregas();
  const entregasFiltradas = entregas.filter(e => e.id !== id);
  
  if (entregasFiltradas.length < entregas.length) {
    return saveEntregas(entregasFiltradas);
  }
  
  return false;
};
