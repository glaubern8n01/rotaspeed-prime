
import React from 'react';
import { Check, MapPin, MoreVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface Delivery {
  id: string;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  status: 'pendente' | 'entregue' | 'cancelado';
  criado_em: string;
  entregue_em?: string;
}

interface DeliveryTableProps {
  deliveries: Delivery[];
  onStatusChange: (id: string, status: 'pendente' | 'entregue' | 'cancelado') => void;
  onViewMap: (delivery: Delivery) => void;
}

const DeliveryTable: React.FC<DeliveryTableProps> = ({ 
  deliveries, 
  onStatusChange,
  onViewMap
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'entregue':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entregue</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Endereço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Data</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                Nenhuma entrega encontrada
              </TableCell>
            </TableRow>
          ) : (
            deliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{delivery.endereco}, {delivery.numero}</p>
                    <p className="text-sm text-muted-foreground">{delivery.bairro} - {delivery.cep}</p>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {delivery.status === 'entregue' && delivery.entregue_em ? 
                    formatDateTime(delivery.entregue_em) : 
                    formatDateTime(delivery.criado_em)
                  }
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewMap(delivery)}>
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>Ver no Mapa</span>
                      </DropdownMenuItem>
                      {delivery.status !== 'entregue' && (
                        <DropdownMenuItem onClick={() => onStatusChange(delivery.id, 'entregue')}>
                          <Check className="mr-2 h-4 w-4" />
                          <span>Marcar como Entregue</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {delivery.status !== 'cancelado' && (
                        <DropdownMenuItem 
                          onClick={() => onStatusChange(delivery.id, 'cancelado')}
                          className="text-red-600"
                        >
                          Cancelar Entrega
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DeliveryTable;
