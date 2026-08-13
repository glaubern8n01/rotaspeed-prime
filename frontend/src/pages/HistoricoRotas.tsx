
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, Search, Calendar, MapPin } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { buscarRotasConfirmadas, RotaConfirmada } from '@/services/entregaService';

// Componente desabilitado temporariamente
// Para impedir o acesso, este componente redirecionará para a página inicial
// Quando o recurso estiver pronto, remova este comentário e implemente a funcionalidade completa
const HistoricoRotas = () => {
  const navigate = useNavigate();
  
  // Redirecionar imediatamente para a página inicial
  useEffect(() => {
    navigate('/');
  }, [navigate]);
  
  // Renderizar componente vazio
  return null;
};

export default HistoricoRotas;
