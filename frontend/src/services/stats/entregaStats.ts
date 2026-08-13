import { Entrega } from '../types/entrega';
import { loadEntregas } from '../storage/entregaStorage';

// Retorna o número total de entregas
export const getEntregasCount = (): number => {
  const entregas = loadEntregas();
  return entregas.length;
};

// Retorna o número de entregas por status
export const getEntregasCountByStatus = (status: 'pendente' | 'entregue' | 'cancelado'): number => {
  const entregas = loadEntregas();
  return entregas.filter(entrega => entrega.status === status).length;
};

// Retorna as entregas filtradas por status
export const getEntregasByStatus = (status: 'pendente' | 'entregue' | 'cancelado'): Entrega[] => {
  const entregas = loadEntregas();
  return entregas.filter(entrega => entrega.status === status);
};

// Verifica se o limite de entregas foi atingido
export const isLimitReached = (planoLimite: number): boolean => {
  const entregas = loadEntregas();
  return entregas.length >= planoLimite;
};

// Retorna um objeto com a contagem de entregas por bairro
export const getEntregasPorBairro = (): { [bairro: string]: number } => {
  const entregas = loadEntregas();
  
  // Criar um objeto para armazenar a contagem de entregas por bairro
  const contagemPorBairro: { [bairro: string]: number } = {};
  
  // Iterar sobre as entregas e incrementar a contagem para cada bairro
  entregas.forEach(entrega => {
    const bairro = entrega.bairro;
    if (contagemPorBairro[bairro]) {
      contagemPorBairro[bairro]++;
    } else {
      contagemPorBairro[bairro] = 1;
    }
  });
  
  return contagemPorBairro;
};

// Retorna um objeto com a contagem de entregas por dia
export const getEntregasPorDia = (): { [data: string]: number } => {
  const entregas = loadEntregas();
  
  // Criar um objeto para armazenar a contagem de entregas por dia
  const contagemPorDia: { [data: string]: number } = {};
  
  // Iterar sobre as entregas e incrementar a contagem para cada dia
  entregas.forEach(entrega => {
    if (!entrega.criado_em) return;
    
    const data = entrega.criado_em.split('T')[0];
    if (contagemPorDia[data]) {
      contagemPorDia[data]++;
    } else {
      contagemPorDia[data] = 1;
    }
  });
  
  return contagemPorDia;
};

// Retorna a próxima entrega pendente (para o dashboard)
export const getProximaEntregaPendente = (): Entrega | null => {
  const entregas = loadEntregas();
  return entregas.find(e => e.status === 'pendente') || null;
};

// Agrupa entregas pelo mesmo endereço
export const agruparEntregasPorEndereco = (entregas: Entrega[]): Entrega[] => {
  const enderecos = new Map<string, Entrega[]>();
  
  // Agrupar entregas pelo endereço completo (rua + número)
  entregas.forEach(entrega => {
    const chaveEndereco = `${entrega.endereco}-${entrega.numero}`;
    if (!enderecos.has(chaveEndereco)) {
      enderecos.set(chaveEndereco, []);
    }
    enderecos.get(chaveEndereco)!.push(entrega);
  });
  
  // Transformar os grupos em entregas únicas com contador
  const entregasAgrupadas: Entrega[] = [];
  enderecos.forEach((grupo, chave) => {
    if (grupo.length === 1) {
      // Se só tem uma entrega no endereço, manter como está
      entregasAgrupadas.push(grupo[0]);
    } else {
      // Se tem múltiplas entregas, criar uma entrega agrupada
      const base = { ...grupo[0] };
      base.grupoTamanho = grupo.length;
      entregasAgrupadas.push(base);
    }
  });
  
  return entregasAgrupadas;
};
