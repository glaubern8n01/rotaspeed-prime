import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import RouteMap from '@/components/Routes/RouteMap';
import RouteOptimizer, { Location } from '@/components/Routes/RouteOptimizer';
import { useToast } from '@/components/ui/use-toast';
import { 
  loadEntregas, 
  Entrega, 
  updateEntregaStatus, 
  editEntrega,
  agruparEntregasPorEndereco,
  sendDeliveryStartedMessage,
  sendDeliveryCompletedMessage,
  shareLocationViaWhatsApp,
  shareFullRouteViaWhatsApp
} from '@/services/entregaService';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Navigation, 
  Save, 
  PhoneOutgoing, 
  Share2,
  Edit,
  PlayCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Adicionar funcionalidade para salvar rota favorita
interface SavedRoute {
  id: string;
  name: string;
  date: string;
  locations: Location[];
}

const Rota = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState(0);
  const [routeName, setRouteName] = useState('');
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editForm, setEditForm] = useState({
    endereco: '',
    numero: '',
    bairro: '',
    cep: '',
    cliente: '',
    telefone: ''
  });
  const [rotaIniciada, setRotaIniciada] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Usado para forçar a recarga do mapa
  
  // Carregar entregas e rotas salvas
  useEffect(() => {
    try {
      // Carregar apenas entregas pendentes
      const parsedEntregas = loadEntregas().filter(
        (entrega: Entrega) => entrega.status === 'pendente'
      );
      
      // Converter entregas para o formato de locations com índice obrigatório
      const locationsFromEntregas: Location[] = parsedEntregas.map((entrega: Entrega, index: number) => ({
        ...entrega,
        index: index // Garantindo que index é sempre fornecido
      }));
      
      setLocations(locationsFromEntregas);
      setFilteredLocations(locationsFromEntregas);
      
      // Carregar rotas salvas
      const savedRoutesStr = localStorage.getItem('rotaspeed_saved_routes');
      if (savedRoutesStr) {
        const savedRoutes = JSON.parse(savedRoutesStr);
        setSavedRoutes(savedRoutes);
      }
    } catch (error) {
      console.error('Erro ao carregar entregas do localStorage:', error);
    }
  }, []);
  
  const handleOptimized = (optimizedLocations: Location[]) => {
    setLocations(optimizedLocations);
    setFilteredLocations(optimizedLocations);
    setCurrentLocation(0);
    setMapKey(prevKey => prevKey + 1); // Forçar recarga do mapa
    
    toast({
      title: "Rota otimizada",
      description: "A rota foi otimizada com sucesso"
    });
  };
  
  const handleNext = () => {
    if (currentLocation < filteredLocations.length - 1) {
      setCurrentLocation(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentLocation > 0) {
      setCurrentLocation(prev => prev - 1);
    }
  };
  
  const handleIniciarRota = () => {
    setRotaIniciada(true);
    
    // Se temos cliente e telefone, enviar mensagem de início
    const currentLocationData = filteredLocations[currentLocation];
    if (currentLocationData && currentLocationData.cliente && currentLocationData.telefone) {
      sendDeliveryStartedMessage(currentLocationData);
    }
    
    toast({
      title: "Rota iniciada",
      description: "Boa entrega! Siga a ordem de endereços otimizada"
    });
  };
  
  const handleCompleteDelivery = () => {
    if (filteredLocations.length === 0 || currentLocation >= filteredLocations.length) return;
    
    const location = filteredLocations[currentLocation];
    if (!location.id) return;
    
    // Tentar enviar mensagem de conclusão se tiver os dados do cliente
    if (location.cliente && location.telefone) {
      sendDeliveryCompletedMessage(location);
    }
    
    // Atualizar status da entrega no armazenamento
    const success = updateEntregaStatus(location.id, 'entregue');
    
    if (success) {
      // Remover esta localização das locations e ajustar índices
      const updatedLocations = filteredLocations.filter((_, idx) => idx !== currentLocation)
        .map((loc, newIdx) => ({ ...loc, index: newIdx }));
      
      setFilteredLocations(updatedLocations);
      
      // Atualizar também a lista original
      const updatedOriginalLocations = locations.filter(loc => loc.id !== location.id)
        .map((loc, newIdx) => ({ ...loc, index: newIdx }));
      
      setLocations(updatedOriginalLocations);
      
      // Ajustar o índice de localização atual se necessário
      if (currentLocation >= updatedLocations.length) {
        setCurrentLocation(Math.max(0, updatedLocations.length - 1));
      }
      
      // Forçar recarga do mapa
      setMapKey(prevKey => prevKey + 1);
      
      toast({
        title: "Entrega concluída",
        description: "A entrega foi marcada como concluída"
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da entrega",
        variant: "destructive"
      });
    }
  };
  
  // Função para salvar a rota atual
  const saveCurrentRoute = () => {
    if (locations.length === 0) {
      toast({
        title: "Sem rota para salvar",
        description: "Não há endereços na rota atual",
        variant: "destructive"
      });
      return;
    }
    
    if (!routeName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para a rota",
        variant: "destructive"
      });
      return;
    }
    
    // Criar nova rota salva
    const newRoute: SavedRoute = {
      id: Date.now().toString(),
      name: routeName,
      date: new Date().toISOString(),
      locations: [...locations]
    };
    
    // Adicionar à lista de rotas salvas
    const updatedRoutes = [...savedRoutes, newRoute];
    setSavedRoutes(updatedRoutes);
    
    // Salvar no localStorage
    try {
      localStorage.setItem('rotaspeed_saved_routes', JSON.stringify(updatedRoutes));
      toast({
        title: "Rota salva",
        description: `A rota "${routeName}" foi salva com sucesso`
      });
      
      // Resetar estado
      setRouteName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Erro ao salvar rota:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a rota",
        variant: "destructive"
      });
    }
  };
  
  // Função para carregar uma rota salva
  const loadSavedRoute = (routeId: string) => {
    const route = savedRoutes.find(r => r.id === routeId);
    if (!route) return;
    
    // Garantir que cada local tenha o campo 'index'
    const locationsWithIndex: Location[] = route.locations.map((loc, idx) => ({
      ...loc,
      index: idx
    }));
    
    setLocations(locationsWithIndex);
    setFilteredLocations(locationsWithIndex);
    setCurrentLocation(0);
    setMapKey(prevKey => prevKey + 1); // Forçar recarga do mapa
    
    toast({
      title: "Rota carregada",
      description: `A rota "${route.name}" foi carregada com sucesso`
    });
  };
  
  // Função para editar entrega
  const handleEditLocation = () => {
    if (!editingLocation) return;
    
    // Atualizar a entrega no armazenamento
    const success = editEntrega(editingLocation.id, editForm);
    
    if (success) {
      // Atualizar estado local
      const updatedLocations = locations.map(loc => 
        loc.id === editingLocation.id ? { ...loc, ...editForm } : loc
      );
      
      setLocations(updatedLocations);
      
      // Atualizar também a lista filtrada
      const updatedFilteredLocations = filteredLocations.map(loc => 
        loc.id === editingLocation.id ? { ...loc, ...editForm } : loc
      );
      
      setFilteredLocations(updatedFilteredLocations);
      
      // Fechar o diálogo
      setShowEditDialog(false);
      setEditingLocation(null);
      
      // Forçar recarga do mapa
      setMapKey(prevKey => prevKey + 1);
      
      toast({
        title: "Entrega atualizada",
        description: "O endereço foi atualizado com sucesso"
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o endereço",
        variant: "destructive"
      });
    }
  };
  
  // Função para abrir o diálogo de edição
  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setEditForm({
      endereco: location.endereco || '',
      numero: location.numero || '',
      bairro: location.bairro || '',
      cep: location.cep || '',
      cliente: location.cliente || '',
      telefone: location.telefone || ''
    });
    setShowEditDialog(true);
  };
  
  // Função para compartilhar a localização atual via WhatsApp
  const shareCurrentLocation = () => {
    if (filteredLocations.length === 0 || currentLocation >= filteredLocations.length) {
      toast({
        title: "Sem endereço",
        description: "Não há endereço para compartilhar",
        variant: "destructive"
      });
      return;
    }
    
    const location = filteredLocations[currentLocation];
    shareLocationViaWhatsApp(location);
  };
  
  // Função para compartilhar toda a rota via WhatsApp
  const shareFullRoute = () => {
    if (filteredLocations.length === 0) {
      toast({
        title: "Sem rota",
        description: "Não há rota para compartilhar",
        variant: "destructive"
      });
      return;
    }
    
    shareFullRouteViaWhatsApp(filteredLocations);
  };
  
  // Função para abrir a navegação no aplicativo preferido
  const openNavigation = () => {
    if (filteredLocations.length === 0 || currentLocation >= filteredLocations.length) return;
    
    const location = filteredLocations[currentLocation];
    const fullAddress = `${location.endereco}, ${location.numero}, ${location.bairro}, ${location.cep}`;
    
    // Obter navegador preferido das configurações
    let navigationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    
    try {
      const config = localStorage.getItem('rotaspeed_config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        const navegador = parsedConfig.navegadorPadrao || 'google';
        
        switch(navegador) {
          case 'waze':
            navigationUrl = `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}`;
            break;
          case 'apple':
            navigationUrl = `maps://?q=${encodeURIComponent(fullAddress)}`;
            break;
          default:
            navigationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
        }
      }
    } catch (error) {
      console.error('Erro ao ler configurações de navegação:', error);
    }
    
    window.open(navigationUrl, '_blank');
  };
  
  // Função para ligar para o cliente
  const callCustomer = () => {
    if (filteredLocations.length === 0 || currentLocation >= filteredLocations.length) return;
    
    const location = filteredLocations[currentLocation];
    if (!location.telefone) {
      toast({
        title: "Sem telefone",
        description: "Não há telefone para este cliente",
        variant: "destructive"
      });
      return;
    }
    
    // Criar URL para ligação
    const phoneUrl = `tel:${location.telefone.replace(/\D/g, '')}`;
    window.open(phoneUrl, '_self');
  };
  
  // Função para agrupar entregas no mesmo endereço
  const handleGroupLocations = () => {
    if (locations.length <= 1) return;
    
    const groupedLocations = agruparEntregasPorEndereco(locations);
    
    // Ensure each item has the required index property
    const groupedLocationsWithIndex = groupedLocations.map((loc, idx) => ({
      ...loc,
      index: idx
    }));
    
    setLocations(groupedLocationsWithIndex);
    setFilteredLocations(groupedLocationsWithIndex);
    setCurrentLocation(0);
    setMapKey(prevKey => prevKey + 1); // Forçar recarga do mapa
    
    toast({
      title: "Entregas agrupadas",
      description: `${locations.length - groupedLocations.length} endereços duplicados foram agrupados`
    });
  };
  
  // Handler para quando a ordem das localizações muda no RouteOptimizer
  const handleLocationOrderChange = (newLocations: Location[]) => {
    setFilteredLocations(newLocations);
    setMapKey(prevKey => prevKey + 1); // Forçar recarga do mapa
    
    toast({
      title: "Ordem atualizada",
      description: "A ordem das entregas foi atualizada"
    });
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Roteirização</h1>
          <p className="text-gray-600">
            Visualize e otimize sua rota de entregas para maior eficiência.
          </p>
        </div>
        
        {locations.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
            <h3 className="text-yellow-800 font-medium mb-2">Nenhuma entrega pendente</h3>
            <p className="text-sm text-yellow-700">
              Adicione entregas na página "Nova Entrega" para gerar rotas otimizadas.
            </p>
            
            {savedRoutes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-yellow-800 mb-2">Rotas Salvas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {savedRoutes.map(route => (
                    <Button 
                      key={route.id}
                      variant="outline" 
                      className="text-left" 
                      onClick={() => loadSavedRoute(route.id)}
                    >
                      {route.name} ({new Date(route.date).toLocaleDateString()})
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <RouteOptimizer 
              locations={locations} 
              onOptimized={handleOptimized} 
              onLocationOrderChange={handleLocationOrderChange}
            />
            
            <div className="flex justify-between my-4">
              <Button variant="outline" onClick={handleGroupLocations}>
                Agrupar Endereços Duplicados
              </Button>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={shareFullRoute}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar Rota Completa
                </Button>
                
                {!rotaIniciada ? (
                  <Button onClick={handleIniciarRota} className="bg-rotaspeed-primary hover:bg-blue-700">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar Rota
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => setRotaIniciada(false)}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Pausar Rota
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <RouteMap 
                  key={mapKey}
                  locations={filteredLocations} 
                  currentLocationIndex={currentLocation} 
                />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Endereço Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredLocations.length > 0 && currentLocation < filteredLocations.length ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{filteredLocations[currentLocation].endereco}, {filteredLocations[currentLocation].numero}</p>
                            <p className="text-sm">{filteredLocations[currentLocation].bairro}</p>
                            <p className="text-sm">CEP: {filteredLocations[currentLocation].cep}</p>
                            
                            {filteredLocations[currentLocation].cliente && (
                              <p className="text-sm mt-1 font-medium text-blue-700">
                                Cliente: {filteredLocations[currentLocation].cliente}
                              </p>
                            )}
                            
                            {filteredLocations[currentLocation].grupoTamanho && filteredLocations[currentLocation].grupoTamanho > 1 && (
                              <p className="text-sm font-semibold text-blue-700 mt-1">
                                Este endereço contém {filteredLocations[currentLocation].grupoTamanho} pacotes
                              </p>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(filteredLocations[currentLocation])}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={openNavigation} className="w-full">
                          <Navigation className="h-4 w-4 mr-2" />
                          Navegar
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={shareCurrentLocation}
                          className="w-full"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                      
                      {filteredLocations[currentLocation].telefone && (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={callCustomer}
                        >
                          <PhoneOutgoing className="h-4 w-4 mr-2" />
                          {filteredLocations[currentLocation].telefone}
                        </Button>
                      )}
                      
                      <Button
                        className="w-full bg-rotaspeed-secondary hover:bg-green-600"
                        onClick={handleCompleteDelivery}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar Entrega
                      </Button>
                      
                      <div className="flex items-center mt-4 justify-between">
                        <Button 
                          variant={currentLocation > 0 ? "default" : "outline"} 
                          onClick={handlePrevious}
                          disabled={currentLocation <= 0}
                          className="flex-1"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Button>
                        
                        <span className="px-2 font-medium">
                          {currentLocation + 1} / {filteredLocations.length}
                        </span>
                        
                        <Button
                          variant={currentLocation < filteredLocations.length - 1 ? "default" : "outline"}
                          onClick={handleNext}
                          disabled={currentLocation >= filteredLocations.length - 1}
                          className="flex-1"
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      
                      {!showSaveDialog ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowSaveDialog(true)}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Rota
                        </Button>
                      ) : (
                        <div className="border p-3 rounded-lg">
                          <label className="text-sm font-medium">Nome da Rota:</label>
                          <input
                            type="text"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            placeholder="Ex: Rota Centro"
                            className="w-full px-3 py-2 border rounded-md mb-2 mt-1"
                          />
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={saveCurrentRoute}
                              className="flex-1"
                            >
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setShowSaveDialog(false)}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      Nenhum endereço selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      
      {/* Diálogo de edição de entrega */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar endereço</DialogTitle>
            <DialogDescription>
              Edite as informações deste endereço de entrega.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endereco" className="text-right">
                Endereço
              </Label>
              <Input
                id="endereco"
                value={editForm.endereco}
                onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numero" className="text-right">
                Número
              </Label>
              <Input
                id="numero"
                value={editForm.numero}
                onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bairro" className="text-right">
                Bairro
              </Label>
              <Input
                id="bairro"
                value={editForm.bairro}
                onChange={(e) => setEditForm({ ...editForm, bairro: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cep" className="text-right">
                CEP
              </Label>
              <Input
                id="cep"
                value={editForm.cep}
                onChange={(e) => setEditForm({ ...editForm, cep: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cliente" className="text-right">
                Cliente
              </Label>
              <Input
                id="cliente"
                value={editForm.cliente}
                onChange={(e) => setEditForm({ ...editForm, cliente: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={editForm.telefone}
                onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" onClick={handleEditLocation}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Rota;
