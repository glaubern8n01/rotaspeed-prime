
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Share } from 'lucide-react';
import { Location } from './RouteOptimizer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
// Adicionamos a referência para o arquivo de tipos do Google Maps
/// <reference path="../../types/google-maps.d.ts" />
import { shareLocationViaWhatsApp } from '@/services/messaging/whatsappMessaging';

interface RouteMapProps {
  locations: Location[];
  currentLocationIndex: number;
}

const RouteMap: React.FC<RouteMapProps> = ({ locations, currentLocationIndex }) => {
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const { toast } = useToast();
  
  // Carregar configurações para o navegador padrão
  const [navegadorPadrao, setNavegadorPadrao] = useState<string>('google');
  
  useEffect(() => {
    try {
      const config = localStorage.getItem('rotaspeed_config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        setNavegadorPadrao(parsedConfig.navegadorPadrao || 'google');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de navegador:', error);
    }
  }, []);
  
  // Inicializar o mapa quando locations mudar
  useEffect(() => {
    let isMounted = true;
    setIsMapLoading(true);
    
    // Verificar se a API do Google Maps está disponível
    const googleMapsApiScript = document.querySelector('script[src*="maps.googleapis.com/maps/api"]');
    
    // Se não temos o script do Google Maps, vamos tentar carregá-lo
    if (!googleMapsApiScript) {
      try {
        let apiKey = '';
        // Tentar obter a chave da API das configurações
        const config = localStorage.getItem('rotaspeed_config');
        if (config) {
          const parsedConfig = JSON.parse(config);
          apiKey = parsedConfig.apiKeyGoogleMaps || '';
        }
        
        // Se não temos uma chave de API, usar modo offline
        if (!apiKey) {
          setMapError('API Key do Google Maps não configurada. Usando modo offline.');
          setIsMapLoading(false);
          return;
        }
        
        // Adicionar o script do Google Maps
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) {
            initializeGoogleMap();
          }
        };
        script.onerror = () => {
          if (isMounted) {
            setMapError('Erro ao carregar API do Google Maps. Usando modo offline.');
            setIsMapLoading(false);
          }
        };
        document.head.appendChild(script);
        
        return () => {
          // Se o componente for desmontado antes de carregar o script, remover os listeners
          script.onload = null;
          script.onerror = null;
          isMounted = false;
        };
      } catch (error) {
        console.error('Erro ao carregar script do Google Maps:', error);
        setMapError('Erro ao carregar API do Google Maps. Usando modo offline.');
        setIsMapLoading(false);
      }
    } else {
      // Se o script já está carregado, inicializar o mapa
      initializeGoogleMap();
    }
    
    function initializeGoogleMap() {
      if (!window.google || !window.google.maps) {
        setMapError('Não foi possível carregar o Google Maps API');
        setIsMapLoading(false);
        return;
      }
      
      if (!isMounted || !mapContainerRef.current) return;
      
      try {
        // Limpar marcadores anteriores
        if (markersRef.current) {
          markersRef.current.forEach(marker => marker.setMap(null));
          markersRef.current = [];
        }
        
        // Limpar polyline anterior
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }
        
        // Verificar se há pelo menos um local
        if (locations.length === 0) {
          setIsMapLoading(false);
          return;
        }
        
        const bounds = new google.maps.LatLngBounds();
        
        // Se não existe um mapa ainda, criar um
        if (!mapRef.current) {
          // Centro inicial no Brasil
          mapRef.current = new google.maps.Map(mapContainerRef.current, {
            center: { lat: -23.55, lng: -46.63 },
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });
        }
        
        // Mostrar marcadores para cada local com coordenadas
        locations.forEach((location, index) => {
          if (location.lat && location.lng) {
            const position = { lat: location.lat, lng: location.lng };
            const label = `${index + 1}`;
            
            // Determinar se este marcador está ativo
            const isActive = index === currentLocationIndex;
            
            const marker = new google.maps.Marker({
              position,
              map: mapRef.current,
              label: {
                text: label,
                color: isActive ? '#fff' : '#000',
                fontWeight: isActive ? 'bold' : 'normal'
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: isActive ? '#FF0000' : '#0088FF',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 10
              },
              animation: isActive ? google.maps.Animation.BOUNCE : null,
              title: `${location.endereco}, ${location.numero}`
            });
            
            // Adicionar informações de entrega ao clicar no marcador
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px;">
                  <strong>${location.endereco}, ${location.numero}</strong>
                  <p>${location.bairro} - CEP: ${location.cep}</p>
                  ${location.cliente ? `<p>Cliente: ${location.cliente}</p>` : ''}
                  ${location.grupoTamanho ? `<p><strong>Pacotes: ${location.grupoTamanho}</strong></p>` : ''}
                  ${location.status ? `<p>Status: ${location.status}</p>` : ''}
                </div>
              `
            });
            
            marker.addListener('click', () => {
              infoWindow.open(mapRef.current, marker);
            });
            
            markersRef.current.push(marker);
            bounds.extend(position);
          }
        });
        
        // Criar uma linha conectando os pontos em ordem
        const path = locations
          .filter(loc => loc.lat && loc.lng)
          .map(loc => ({ lat: loc.lat!, lng: loc.lng! }));
        
        if (path.length > 1) {
          polylineRef.current = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: mapRef.current
          });
        }
        
        // Ajustar o mapa para mostrar todos os marcadores
        if (markersRef.current.length > 0) {
          mapRef.current.fitBounds(bounds);
          
          // Zoom adicional para uma visualização melhor
          const zoom = mapRef.current.getZoom();
          if (zoom && zoom > 16) {
            mapRef.current.setZoom(16);
          }
        }
        
        setIsMapLoading(false);
        setMapError(null); // Limpar erro se o mapa carregou com sucesso
      } catch (error) {
        console.error('Erro ao inicializar o mapa:', error);
        setMapError('Erro ao carregar o mapa. Verifique sua conexão com a internet.');
        setIsMapLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [locations, currentLocationIndex]);
  
  // Função para compartilhar rota no WhatsApp
  const shareRoute = () => {
    try {
      if (locations.length === 0) {
        toast({
          title: "Sem endereços",
          description: "Não há endereços para compartilhar",
          variant: "destructive"
        });
        return;
      }
      
      const currentLocation = locations[currentLocationIndex] || locations[0];
      if (!currentLocation) return;
      
      shareLocationViaWhatsApp(currentLocation);
    } catch (error) {
      console.error('Erro ao compartilhar rota:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar a rota",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Mapa de Rota</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={shareRoute}
            disabled={locations.length === 0}
          >
            <Share className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mapError ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-amber-800">Mapa indisponível</h4>
                <p className="text-sm text-amber-700 mt-1">{mapError}</p>
                <p className="text-xs text-amber-600 mt-2">
                  Para ativar o mapa, configure sua chave de API do Google Maps nas configurações do app.
                </p>
                
                {locations.length > 0 && currentLocationIndex >= 0 && currentLocationIndex < locations.length && (
                  <div className="mt-3 p-3 bg-white rounded-md shadow-sm border border-gray-200">
                    <p className="font-medium">Endereço Atual:</p>
                    <p className="text-sm mt-1">
                      {locations[currentLocationIndex].endereco}, {locations[currentLocationIndex].numero}<br />
                      {locations[currentLocationIndex].bairro} - CEP: {locations[currentLocationIndex].cep}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div 
            ref={mapContainerRef} 
            className={`h-[350px] ${isMapLoading ? 'bg-gray-100 animate-pulse' : ''}`}
          >
            {isMapLoading && (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Carregando mapa...</p>
              </div>
            )}
          </div>
        )}
        
        {/* Informações do local atual */}
        {locations.length > 0 && currentLocationIndex >= 0 && currentLocationIndex < locations.length && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="font-medium text-blue-800">
              Parada {currentLocationIndex + 1} de {locations.length}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {locations[currentLocationIndex].endereco}, {locations[currentLocationIndex].numero}<br />
              {locations[currentLocationIndex].bairro} - CEP: {locations[currentLocationIndex].cep}
              {locations[currentLocationIndex].cliente && (
                <><br />Cliente: {locations[currentLocationIndex].cliente}</>
              )}
            </p>
            {locations[currentLocationIndex].grupoTamanho && locations[currentLocationIndex].grupoTamanho > 1 && (
              <p className="text-sm font-bold text-blue-900 mt-1">
                Este endereço contém {locations[currentLocationIndex].grupoTamanho} pacotes
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteMap;
