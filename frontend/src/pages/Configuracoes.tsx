
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Map, Camera, User, Phone, UploadCloud } from "lucide-react";

const Configuracoes = () => {
  const { toast } = useToast();
  const [apiKeyOCR, setApiKeyOCR] = useState<string>("");
  const [apiKeyGoogleMaps, setApiKeyGoogleMaps] = useState<string>("");
  const [navegadorPadrao, setNavegadorPadrao] = useState<string>("google");
  const [plano, setPlano] = useState<string>("essencial");
  const [nomeEntregador, setNomeEntregador] = useState<string>("");
  const [telefoneEntregador, setTelefoneEntregador] = useState<string>("");
  const [useDeliveryPersonNumber, setUseDeliveryPersonNumber] = useState<boolean>(true);
  const [systemPhoneNumber, setSystemPhoneNumber] = useState<string>("");
  const [audiosUsados, setAudiosUsados] = useState<number>(0);
  const [limiteAudios, setLimiteAudios] = useState<number>(15);
  const [pdfManual, setPdfManual] = useState<File | null>(null);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const configSalva = localStorage.getItem("rotaspeed_config");
      if (configSalva) {
        const config = JSON.parse(configSalva);
        setApiKeyOCR(config.apiKeyOCR || "");
        setApiKeyGoogleMaps(config.apiKeyGoogleMaps || "");
        setNavegadorPadrao(config.navegadorPadrao || "google");
        setPlano(config.plano || "essencial");
        setNomeEntregador(config.nomeEntregador || "");
        setTelefoneEntregador(config.telefoneEntregador || "");
        setUseDeliveryPersonNumber(config.useDeliveryPersonNumber !== false);
        setSystemPhoneNumber(config.systemPhoneNumber || "");
        setAudiosUsados(config.audiosUsados || 0);
        
        // Definir limites com base no plano
        switch (config.plano) {
          case "motorista":
            setLimiteAudios(30);
            break;
          case "avancado":
            setLimiteAudios(40);
            break;
          case "premium":
            setLimiteAudios(60);
            break;
          default:
            setLimiteAudios(15);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  }, []);

  // Salvar configurações
  const salvarConfiguracoes = () => {
    try {
      const config = {
        apiKeyOCR,
        apiKeyGoogleMaps,
        navegadorPadrao,
        plano,
        nomeEntregador,
        telefoneEntregador,
        useDeliveryPersonNumber,
        systemPhoneNumber,
        audiosUsados
      };
      
      localStorage.setItem("rotaspeed_config", JSON.stringify(config));
      
      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram salvas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    }
  };

  // Resetar contador de áudios usados
  const resetarContadorAudios = () => {
    try {
      const configSalva = localStorage.getItem("rotaspeed_config");
      if (configSalva) {
        const config = JSON.parse(configSalva);
        config.audiosUsados = 0;
        
        localStorage.setItem("rotaspeed_config", JSON.stringify(config));
        setAudiosUsados(0);
        
        toast({
          title: "Contador resetado",
          description: "O contador de áudios foi resetado com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro ao resetar contador:", error);
    }
  };
  
  // Lidar com upload de manual em PDF
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type !== "application/pdf") {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione um arquivo PDF",
          variant: "destructive",
        });
        return;
      }
      
      setPdfManual(file);
      
      toast({
        title: "Manual carregado",
        description: "O manual foi carregado com sucesso",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Configurações</h1>
          <p className="text-gray-600">
            Personalize as configurações do RotaSpeed conforme sua necessidade.
          </p>
        </div>

        <Tabs defaultValue="geral">
          <TabsList className="grid grid-cols-3 mb-4 md:w-[400px]">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
            <TabsTrigger value="limites">Limites</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>
                  Defina as configurações básicas da sua conta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plano">Plano Atual</Label>
                  <Select value={plano} onValueChange={setPlano}>
                    <SelectTrigger id="plano">
                      <SelectValue placeholder="Selecione seu plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essencial">Speed Fácil (até 85 pacotes/dia)</SelectItem>
                      <SelectItem value="motorista">Plano Motorista (até 155 pacotes/dia)</SelectItem>
                      <SelectItem value="avancado">Speed Avançado (até 170 pacotes/dia)</SelectItem>
                      <SelectItem value="premium">Speed Premium (até 255 pacotes/dia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="navegador">Navegador Padrão</Label>
                  <Select value={navegadorPadrao} onValueChange={setNavegadorPadrao}>
                    <SelectTrigger id="navegador">
                      <SelectValue placeholder="Selecione o navegador padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Maps</SelectItem>
                      <SelectItem value="waze">Waze</SelectItem>
                      <SelectItem value="apple">Apple Maps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Dados do Entregador
                </CardTitle>
                <CardDescription>
                  Informações usadas para mensagens automáticas aos clientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeEntregador">Nome do Entregador</Label>
                  <Input
                    id="nomeEntregador"
                    value={nomeEntregador}
                    onChange={(e) => setNomeEntregador(e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneEntregador">Telefone do Entregador (com DDD)</Label>
                  <Input
                    id="telefoneEntregador"
                    value={telefoneEntregador}
                    onChange={(e) => setTelefoneEntregador(e.target.value)}
                    placeholder="Ex: 11912345678"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Número para contato com cliente</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="useDeliveryPersonNumber"
                      checked={useDeliveryPersonNumber}
                      onChange={() => setUseDeliveryPersonNumber(true)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="useDeliveryPersonNumber" className="text-sm">
                      Usar número do entregador
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="useSystemNumber"
                      checked={!useDeliveryPersonNumber}
                      onChange={() => setUseDeliveryPersonNumber(false)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="useSystemNumber" className="text-sm">
                      Usar número do sistema
                    </Label>
                  </div>
                  
                  {!useDeliveryPersonNumber && (
                    <div className="pt-2">
                      <Label htmlFor="systemPhoneNumber">Número do Sistema (com DDD)</Label>
                      <Input
                        id="systemPhoneNumber"
                        value={systemPhoneNumber}
                        onChange={(e) => setSystemPhoneNumber(e.target.value)}
                        placeholder="Ex: 11912345678"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Map className="mr-2 h-5 w-5" />
                  API do Google Maps
                </CardTitle>
                <CardDescription>
                  Configure sua chave de API do Google Maps para otimização de rotas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKeyGoogleMaps">Chave de API</Label>
                  <Input
                    id="apiKeyGoogleMaps"
                    value={apiKeyGoogleMaps}
                    onChange={(e) => setApiKeyGoogleMaps(e.target.value)}
                    placeholder="Insira sua chave de API do Google Maps"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Para obter uma chave de API, visite o{" "}
                  <a
                    href="https://console.cloud.google.com/google/maps-apis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Google Cloud Console
                  </a>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  API de OCR
                </CardTitle>
                <CardDescription>
                  Configure sua chave de API para reconhecimento de texto em imagens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKeyOCR">Chave de API do OCR.space</Label>
                  <Input
                    id="apiKeyOCR"
                    value={apiKeyOCR}
                    onChange={(e) => setApiKeyOCR(e.target.value)}
                    placeholder="Insira sua chave de API do OCR.space"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Para obter uma chave de API, visite{" "}
                  <a
                    href="https://ocr.space/ocrapi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    OCR.space
                  </a>.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Manual de Configuração
                </CardTitle>
                <CardDescription>
                  Faça upload de um manual em PDF com instruções detalhadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md">
                  <input
                    type="file"
                    id="pdfManual"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <label htmlFor="pdfManual" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <UploadCloud className="h-10 w-10 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-500">
                        {pdfManual ? pdfManual.name : "Clique para selecionar um arquivo PDF"}
                      </span>
                    </div>
                  </label>
                </div>
                {pdfManual && (
                  <div className="flex justify-center">
                    <a
                      href={URL.createObjectURL(pdfManual)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Visualizar PDF
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Uso de Áudio
                </CardTitle>
                <CardDescription>
                  Monitore e gerencie o uso de processamento de áudio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-800">Uso de áudio neste mês</h3>
                  <div className="mt-2 relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                          {audiosUsados} de {limiteAudios}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                          {Math.round((audiosUsados / limiteAudios) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                      <div
                        style={{ width: `${(audiosUsados / limiteAudios) * 100}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          audiosUsados >= limiteAudios ? "bg-red-500" : "bg-blue-500"
                        }`}
                      ></div>
                    </div>
                  </div>
                  {audiosUsados >= limiteAudios && (
                    <p className="text-sm text-red-600 mt-2">
                      Você atingiu seu limite mensal. Áudios extras serão cobrados a R$ 0,40 por unidade.
                    </p>
                  )}
                  <p className="text-sm text-blue-600 mt-3">
                    <strong>Nota:</strong> O ditado por voz nativo (usando o microfone do navegador) 
                    não consome este limite.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Limites por plano</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>Speed Fácil (Motoboy): 15 áudios/mês</li>
                    <li>Plano Motorista: 30 áudios/mês</li>
                    <li>Speed Avançado: 40 áudios/mês</li>
                    <li>Speed Premium: 60 áudios/mês</li>
                  </ul>
                </div>

                <Button variant="outline" size="sm" onClick={resetarContadorAudios}>
                  Resetar contador de áudios
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Limites de Pacotes</CardTitle>
                <CardDescription>
                  Conheça os limites de pacotes do seu plano.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Pacotes por dia por plano:</h3>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>Speed Fácil (Motoboy): até 85 pacotes/dia</li>
                      <li>Plano Motorista: até 155 pacotes/dia</li>
                      <li>Speed Avançado: até 170 pacotes/dia</li>
                      <li>Speed Premium: até 255 pacotes/dia</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Custos adicionais:</h3>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>Pacotes extras: R$ 9,90 por 100 pacotes adicionais</li>
                      <li>Áudios extras: R$ 0,40 por unidade</li>
                      <li>Roteirização extra no mesmo dia: R$ 9,90</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={salvarConfiguracoes}>Salvar Configurações</Button>
        </div>
      </div>
    </Layout>
  );
};

export default Configuracoes;
