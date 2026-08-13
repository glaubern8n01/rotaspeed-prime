
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Image, Mic, FileText, Keyboard } from 'lucide-react';
import TextEntry from '@/components/PackageEntry/TextEntry';
import ImageEntry from '@/components/PackageEntry/ImageEntry';
import AudioEntry from '@/components/PackageEntry/AudioEntry';
import FileEntry from '@/components/PackageEntry/FileEntry';
import VoiceRecognition from '@/components/PackageEntry/VoiceRecognition';

interface EntregaInputTabsProps {
  onTextSubmit: (data: { endereco: string; numero: string; bairro: string; cep: string; cliente?: string; telefone?: string }) => void;
  onImageProcess: (file: File) => Promise<void>;
  onAudioProcess: (file: File) => Promise<void>;
  onPDFProcess: (file: File) => Promise<void>;
  onSpreadsheetProcess: (file: File) => Promise<void>;
  onVoiceRecognition: (text: string) => void;
}

const EntregaInputTabs: React.FC<EntregaInputTabsProps> = ({
  onTextSubmit,
  onImageProcess,
  onAudioProcess,
  onPDFProcess,
  onSpreadsheetProcess,
  onVoiceRecognition
}) => {
  return (
    <div className="rotaspeed-card">
      <Tabs defaultValue="text">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:grid-cols-5 mb-4">
          <TabsTrigger value="text" className="flex gap-2 items-center">
            <Keyboard className="h-4 w-4" />
            <span className="hidden md:inline">Texto</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex gap-2 items-center">
            <Image className="h-4 w-4" />
            <span className="hidden md:inline">Foto</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex gap-2 items-center">
            <Mic className="h-4 w-4" />
            <span className="hidden md:inline">Áudio</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex gap-2 items-center">
            <Edit className="h-4 w-4" />
            <span className="hidden md:inline">Ditado</span>
          </TabsTrigger>
          <TabsTrigger value="file" className="flex gap-2 items-center">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Arquivo</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="text">
          <TextEntry onSubmit={onTextSubmit} />
        </TabsContent>
        
        <TabsContent value="image">
          <ImageEntry onProcess={onImageProcess} />
        </TabsContent>
        
        <TabsContent value="audio">
          <AudioEntry onProcess={onAudioProcess} />
        </TabsContent>
        
        <TabsContent value="voice">
          <VoiceRecognition onResult={onVoiceRecognition} />
        </TabsContent>
        
        <TabsContent value="file">
          <FileEntry 
            onProcessPDF={onPDFProcess} 
            onProcessSpreadsheet={onSpreadsheetProcess} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EntregaInputTabs;
