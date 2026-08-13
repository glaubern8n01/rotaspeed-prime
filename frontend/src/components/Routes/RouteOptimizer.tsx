import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, MapPin, Shuffle } from 'lucide-react';
import { Entrega } from '@/services/types/entrega';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as api from '@/services/api/rotaspeedApi';
// Adicionamos a referência para o arquivo de tipos do Google Maps
/// <reference path="../../types/google-maps.d.ts" />

// Update the Location interface to extend the Entrega interface but make index required
export interface Location extends Omit<Entrega, 'index'> {
  index: number;     // Índice na rota é obrigatório
  lat?: number;      // Latitude (opcional para compatibilidade)
  lng?: number;      // Longitude (opcional para compatibilidade)
  fullAddress?: string; // Endereço completo (opcional para compatibilidade)
}

// Interface para localizações com coordenadas
interface GeocodedLocation extends Location {
  lat: number;       // Obrigatório para localizações geocodificadas
  lng: number;       // Obrigatório para localizações geocodificadas
  fullAddress: string; // Obrigatório para localizações geocodificadas
}

interface RouteOptimizerProps {
  locations: Location[];
  onOptimized: (optimizedLocations: Location[]) => void;
  onLocationOrderChange?: (newLocations: Location[]) => void;
}

// Função para geocodificar endereços usando a API do Google Maps
const geocodeAddress = async (address: string, cep: string): Promise<{lat: number, lng: number} | null> => {
  try {
    // 1) Backend Python (Nominatim/OSM) — geocodificação REAL, grátis e sem chave.
    try {
      const query = `${cep ? cep + ', ' : ''}${address}, Brasil`;
      const [res] = await api.geocode([query]);
      if (res && res.lat != null && res.lon != null && res.confidence !== 'none') {
        return { lat: res.lat, lng: res.lon };
      }
    } catch (backendErr) {
      console.warn('Geocode backend indisponível, usando fallback local:', backendErr);
    }

    // 2) Fallback: Google Maps (se o usuário configurou chave) ou simulação por CEP.
    // Tenta obter a chave da API do localStorage
    const config = localStorage.getItem('rotaspeed_config');
    const apiKey = config ? JSON.parse(config).apiKeyGoogleMaps : '';
    
    // Priorizar CEP para melhor geocodificação
    const searchAddress = `${cep}, ${address}, Brasil`;
    
    // Se não temos uma chave API, usamos uma simulação baseada no CEP
    if (!apiKey) {
      console.log(`Simulando geocodificação para: ${searchAddress}`);
      
      let cepBase = cep.replace(/\D/g, '').substring(0, 5);
      if (!cepBase || cepBase.length < 5) {
        cepBase = "00000";
      }
      
      // Mapeamento de CEPs para diferentes regiões do Brasil
      // Esta é uma simulação simples, os valores reais seriam diferentes
      const cepPrimeiro = parseInt(cepBase.charAt(0));
      
      // São Paulo (SP) -> CEPs começando com 0, 1
      // Rio de Janeiro (RJ) -> CEPs começando com 2
      // Minas Gerais (MG) -> CEPs começando com 3
      // etc.
      
      let baseLat = -23.55; // São Paulo como padrão
      let baseLng = -46.63;
      
      switch(cepPrimeiro) {
        case 0: // São Paulo capital
        case 1: // São Paulo interior
          baseLat = -23.55;
          baseLng = -46.63;
          break;
        case 2: // Rio de Janeiro
          baseLat = -22.91;
          baseLng = -43.20;
          break;
        case 3: // Minas Gerais
          baseLat = -19.92;
          baseLng = -43.94;
          break;
        case 4: // Bahia
          baseLat = -12.97;
          baseLng = -38.50;
          break;
        case 5: // Pernambuco / Paraíba
          baseLat = -8.05;
          baseLng = -34.88;
          break;
        case 6: // Ceará / Piauí
          baseLat = -3.73;
          baseLng = -38.52;
          break;
        case 7: // Pará
          baseLat = -1.45;
          baseLng = -48.48;
          break;
        case 8: // Paraná / Santa Catarina
          baseLat = -25.43;
          baseLng = -49.27;
          break;
        case 9: // Rio Grande do Sul
          baseLat = -30.03;
          baseLng = -51.23;
          break;
      }
      
      // Adicionar variação baseada nos dígitos do CEP para localizações próximas mas diferentes
      const cepDigits = cepBase.split('').map(Number);
      const latVariation = (cepDigits[1] + cepDigits[3]) / 10000;
      const lngVariation = (cepDigits[2] + cepDigits[4]) / 10000;
      
      return { 
        lat: baseLat + latVariation, 
        lng: baseLng + lngVariation 
      };
    }
    
    // Implementação real com API Google Maps
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Erro na API Google Maps: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    
    // Se não encontrou, simulamos (mas com log)
    console.warn(`Geocodificação falhou para: ${searchAddress}. Usando coordenadas simuladas.`);
    return { 
      lat: -23.55 + (Math.random() - 0.5) * 0.1,
      lng: -46.63 + (Math.random() - 0.5) * 0.1
    };
  } catch (error) {
    console.error('Erro na geocodificação:', error);
    return null;
  }
};

// Função para calcular a distância entre dois pontos usando a fórmula de Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

// Agrupamento de entregas por endereço completo
const groupDeliveriesBySameAddress = (locations: Location[]): Location[] => {
  const addressGroups: { [key: string]: Location[] } = {};
  
  locations.forEach(loc => {
    // Criar uma chave única para o endereço
    const addressKey = `${loc.endereco}-${loc.numero}-${loc.bairro}-${loc.cep}`.toLowerCase();
    
    if (!addressGroups[addressKey]) {
      addressGroups[addressKey] = [];
    }
    
    addressGroups[addressKey].push(loc);
  });
  
  // Manter apenas o primeiro item de cada grupo
  const uniqueLocations = Object.values(addressGroups).map(group => {
    // Se houver mais de uma entrega no mesmo endereço, marcar de alguma forma
    if (group.length > 1) {
      return {
        ...group[0],
        grupoTamanho: group.length // Adicionamos esta propriedade para indicar múltiplas entregas
      };
    }
    return group[0];
  });
  
  return uniqueLocations;
};

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ 
  locations, 
  onOptimized,
  onLocationOrderChange 
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [pontoPartida, setPontoPartida] = useState('');
  const [useGrouping, setUseGrouping] = useState(true);
  const [useAutomatic, setUseAutomatic] = useState(true);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();
  
  // Tentar obter localização atual do usuário
  useEffect(() => {
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "Localização obtida",
            description: "Sua posição atual será usada como ponto de partida"
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          toast({
            title: "Erro de localização",
            description: "Não foi possível obter sua localização atual",
            variant: "destructive"
          });
          setUseCurrentLocation(false);
        }
      );
    }
  }, [useCurrentLocation, toast]);
  
  // Função para iniciar arrastar um item
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };
  
  // Função para soltar um item em uma nova posição
  const handleDrop = (targetIndex: number) => {
    if (draggedItem === null || draggedItem === targetIndex) {
      setDraggedItem(null);
      return;
    }
    
    // Criar uma cópia das localizações
    const newLocations = [...locations];
    
    // Obter o item arrastado
    const draggedItemValue = newLocations[draggedItem];
    
    // Remover o item da posição original
    newLocations.splice(draggedItem, 1);
    
    // Inserir o item na nova posição
    newLocations.splice(targetIndex, 0, draggedItemValue);
    
    // Atualizar índices
    const updatedLocations = newLocations.map((loc, idx) => ({
      ...loc,
      index: idx
    }));
    
    // Notificar sobre a mudança
    if (onLocationOrderChange) {
      onLocationOrderChange(updatedLocations);
    } else {
      // Caso não tenha callback de ordenação, usar o de otimização
      onOptimized(updatedLocations);
    }
    
    // Limpar estado de arrasto
    setDraggedItem(null);
  };
  
  const optimizeRoute = async () => {
    if (locations.length < 2) {
      toast({
        title: "Poucos endereços",
        description: "São necessários pelo menos dois endereços para otimizar uma rota",
        variant: "destructive"
      });
      return;
    }
    
    setIsOptimizing(true);
    
    try {
      toast({
        title: "Otimizando rota",
        description: "Processando endereços e calculando melhor rota..."
      });
      
      // Se não estiver usando otimização automática, apenas retornar os locais na ordem atual
      if (!useAutomatic) {
        setTimeout(() => {
          onOptimized(locations);
          toast({
            title: "Rota mantida",
            description: "A ordem manual foi mantida conforme solicitado"
          });
          setIsOptimizing(false);
        }, 500);
        return;
      }
      
      // Se usarGrouping estiver ativado, agrupar entregas no mesmo endereço
      let locationsToProcess = locations;
      if (useGrouping) {
        locationsToProcess = groupDeliveriesBySameAddress(locations);
      }
      
      // 1. Para cada endereço, criar um texto completo para geocodificação
      const locationsWithFullAddress: Location[] = locationsToProcess.map(loc => {
        const fullAddress = `${loc.endereco}, ${loc.numero}, ${loc.bairro}`;
        return { ...loc, fullAddress };
      });
      
      // 2. Geocodificar todos os endereços
      const geocodedLocationsPromises = locationsWithFullAddress.map(async (loc, index) => {
        // Priorizar o CEP para melhor precisão geográfica
        const coords = await geocodeAddress(`${loc.endereco}, ${loc.numero}, ${loc.bairro}`, loc.cep);
        
        if (coords) {
          return { 
            ...loc, 
            lat: coords.lat, 
            lng: coords.lng,
            index,
            fullAddress: loc.fullAddress || `${loc.endereco}, ${loc.numero}, ${loc.bairro}, ${loc.cep}`
          } as GeocodedLocation;
        }
        
        // Fallback: usar coordenadas simuladas se a geocodificação falhar
        return { 
          ...loc, 
          lat: -23.55 + (Math.random() - 0.5) * 0.1,
          lng: -46.63 + (Math.random() - 0.5) * 0.1,
          index,
          fullAddress: loc.fullAddress || `${loc.endereco}, ${loc.numero}, ${loc.bairro}, ${loc.cep}`
        } as GeocodedLocation;
      });
      
      const geocodedLocations: GeocodedLocation[] = await Promise.all(geocodedLocationsPromises);
      console.log("Endereços geocodificados:", geocodedLocations);
      
      // 3. Se temos um ponto de partida, determinar
      let startingPoint: GeocodedLocation | null = null;
      let locationsToOptimize = [...geocodedLocations];
      
      // Usar a localização atual como ponto de partida, se disponível e selecionada
      if (useCurrentLocation && currentLocation) {
        startingPoint = {
          id: 'starting-point',
          endereco: 'Minha Localização',
          numero: '',
          bairro: '',
          cep: '',
          status: 'pendente',
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          index: -1,
          fullAddress: 'Minha Localização Atual'
        };
        
        // Colocar ponto de partida como primeiro na lista
        locationsToOptimize = [startingPoint, ...geocodedLocations];
      } 
      // Ou usar um ponto de partida personalizado, se fornecido
      else if (pontoPartida) {
        try {
          // Tentar extrair um CEP do ponto de partida
          const cepMatch = pontoPartida.match(/\d{5}-?\d{3}/);
          const cep = cepMatch ? cepMatch[0] : "00000-000";
          
          const coords = await geocodeAddress(pontoPartida, cep);
          if (coords) {
            startingPoint = {
              id: 'starting-point',
              endereco: 'Ponto de Partida',
              numero: '',
              bairro: '',
              cep: cep,
              status: 'pendente',
              lat: coords.lat,
              lng: coords.lng,
              index: -1,
              fullAddress: pontoPartida
            };
            
            // Colocar ponto de partida como primeiro na lista
            locationsToOptimize = [startingPoint, ...geocodedLocations];
          }
        } catch (error) {
          console.error('Erro ao processar ponto de partida:', error);
        }
      }
      
      // 4. Otimização REAL no backend Python (OR-Tools/2-opt). Fallback: NN local.
      try {
        const result = await api.optimize(
          locationsToOptimize.map((loc, i) => ({ id: String(i), lat: loc.lat, lon: loc.lng })),
          { depot_index: 0, round_trip: false }
        );
        const byId = new Map(locationsToOptimize.map((loc, i) => [String(i), loc]));
        const ordered = result.order.map(id => byId.get(id)).filter(Boolean) as GeocodedLocation[];
        const withDepot = [locationsToOptimize[0], ...ordered];
        const finalRoute = startingPoint
          ? withDepot.filter(loc => loc.id !== 'starting-point')
          : withDepot;
        const finalOptimizedRoute = finalRoute.map((loc, idx) => ({ ...loc, index: idx }));
        onOptimized(finalOptimizedRoute);
        toast({
          title: 'Rota otimizada (Python)',
          description: `${finalOptimizedRoute.length} endereços na melhor sequência via ${result.solver} — ${result.total_distance_km} km`
        });
        setIsOptimizing(false);
        return;
      } catch (backendErr) {
        console.warn('Otimização backend indisponível, usando NN local:', backendErr);
      }

      // 4b. Fallback local: algoritmo do vizinho mais próximo
      const optimizedRoute: GeocodedLocation[] = [];
      
      // O primeiro ponto é o ponto de partida ou o primeiro endereço
      optimizedRoute.push(locationsToOptimize[0]);
      
      // Lista de pontos não visitados (excluindo o primeiro que já foi adicionado)
      const unvisited = new Set<GeocodedLocation>(locationsToOptimize.slice(1));
      
      // Para cada ponto, encontrar o vizinho não visitado mais próximo
      while (unvisited.size > 0) {
        const lastPoint = optimizedRoute[optimizedRoute.length - 1];
        let nearestPoint: GeocodedLocation | null = null;
        let minDistance = Infinity;
        
        // Encontrar o ponto mais próximo
        unvisited.forEach(point => {
          const distance = calculateDistance(
            lastPoint.lat, lastPoint.lng, 
            point.lat, point.lng
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = point;
          }
        });
        
        if (nearestPoint) {
          optimizedRoute.push(nearestPoint);
          unvisited.delete(nearestPoint);
        } else {
          // Se não encontramos o ponto mais próximo (improvável), adicione qualquer ponto não visitado
          const nextPoint = Array.from(unvisited)[0];
          optimizedRoute.push(nextPoint);
          unvisited.delete(nextPoint);
        }
      }
      
      // 5. Remover o ponto de partida para a lista final se for um ponto personalizado
      const finalRoute = startingPoint 
        ? optimizedRoute.filter(loc => loc.id !== 'starting-point')
        : optimizedRoute;
      
      // 6. Atualizar índices após a otimização
      const finalOptimizedRoute = finalRoute.map((loc, idx) => ({
        ...loc,
        index: idx
      }));
      
      console.log("Rota otimizada:", finalOptimizedRoute);
      
      // Dar um tempo para simular processamento
      setTimeout(() => {
        onOptimized(finalOptimizedRoute);
        toast({
          title: "Rota otimizada",
          description: `${finalOptimizedRoute.length} endereços foram organizados na melhor sequência de entrega`
        });
        setIsOptimizing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Erro na otimização da rota:', error);
      toast({
        title: "Erro na otimização",
        description: "Não foi possível otimizar a rota. Tente novamente.",
        variant: "destructive"
      });
      setIsOptimizing(false);
    }
  };
  
  // Função para reordenar aleatoriamente as entregas (shuffle)
  const shuffleLocations = () => {
    if (locations.length < 2) return;
    
    // Criar uma cópia das localizações
    const newLocations = [...locations];
    
    // Algoritmo Fisher-Yates para embaralhar
    for (let i = newLocations.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newLocations[i], newLocations[j]] = [newLocations[j], newLocations[i]];
    }
    
    // Atualizar índices
    const updatedLocations = newLocations.map((loc, idx) => ({
      ...loc,
      index: idx
    }));
    
    // Notificar sobre a mudança
    onOptimized(updatedLocations);
    
    toast({
      title: "Rota reorganizada",
      description: "A ordem das entregas foi reorganizada aleatoriamente"
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label htmlFor="startingPoint">Ponto de Partida (opcional)</Label>
          <div className="flex">
            <Input
              id="startingPoint"
              value={pontoPartida}
              onChange={(e) => {
                setPontoPartida(e.target.value);
                // Desativar uso de localização atual ao digitar um ponto de partida
                if (e.target.value) setUseCurrentLocation(false);
              }}
              placeholder="Endereço inicial ou deixe vazio para usar o primeiro da lista"
              className="flex-grow"
              disabled={useCurrentLocation}
            />
          </div>
          <div className="mt-1 flex items-center space-x-2">
            <input
              type="checkbox"
              id="useCurrentLocation"
              checked={useCurrentLocation}
              onChange={(e) => {
                setUseCurrentLocation(e.target.checked);
                // Limpar o ponto de partida manual quando usar localização atual
                if (e.target.checked) setPontoPartida('');
              }}
              className="rounded border-gray-300 focus:ring-blue-500"
            />
            <Label htmlFor="useCurrentLocation" className="text-xs text-gray-600">
              Usar minha localização atual como ponto de partida
            </Label>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useGrouping"
            checked={useGrouping}
            onChange={(e) => setUseGrouping(e.target.checked)}
            className="rounded border-gray-300 focus:ring-blue-500"
          />
          <Label htmlFor="useGrouping">Agrupar mesmo endereço</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useAutomatic"
            checked={useAutomatic}
            onChange={(e) => setUseAutomatic(e.target.checked)}
            className="rounded border-gray-300 focus:ring-blue-500"
          />
          <Label htmlFor="useAutomatic">Otimização automática</Label>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {locations.length} {locations.length === 1 ? 'endereço' : 'endereços'} para otimizar
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={shuffleLocations}
            disabled={isOptimizing || locations.length < 2}
            variant="outline"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Misturar
          </Button>
          
          <Button 
            onClick={optimizeRoute}
            disabled={isOptimizing || locations.length < 1}
            className="bg-rotaspeed-secondary hover:bg-green-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Otimizando...' : useAutomatic ? 'Otimizar Rota' : 'Usar Ordem Atual'}
          </Button>
        </div>
      </div>
      
      {pontoPartida && !useCurrentLocation && (
        <div className="flex items-center text-sm text-blue-600">
          <MapPin className="h-4 w-4 mr-1" />
          <span>Ponto de partida definido: {pontoPartida}</span>
        </div>
      )}
      
      {useCurrentLocation && currentLocation && (
        <div className="flex items-center text-sm text-blue-600">
          <MapPin className="h-4 w-4 mr-1" />
          <span>Usando sua localização atual como ponto de partida</span>
        </div>
      )}
      
      {/* Lista de endereços arrastáveis */}
      {locations.length > 0 && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <div className="bg-gray-50 py-2 px-3 border-b">
            <h3 className="text-sm font-medium text-gray-700">Endereços na ordem atual</h3>
            <p className="text-xs text-gray-500">Arraste para reorganizar manualmente</p>
          </div>
          <ul className="divide-y divide-gray-200">
            {locations.map((location, index) => (
              <li 
                key={location.id || index}
                className={`p-3 flex justify-between items-center cursor-grab
                  ${draggedItem === index ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
              >
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-blue-800">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{location.endereco}, {location.numero}</p>
                    <p className="text-xs text-gray-500">{location.bairro}</p>
                  </div>
                </div>
                {location.grupoTamanho && location.grupoTamanho > 1 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {location.grupoTamanho} pacotes
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;
