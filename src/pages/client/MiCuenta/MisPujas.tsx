import React, { useMemo } from 'react';
import { 
  Box, Typography, Chip, Stack, LinearProgress, useTheme, alpha, Button 
} from '@mui/material';
import { 
  Gavel, CalendarToday, MonetizationOn, OpenInNew, Warning 
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';

// Servicios y Tipos
import PujaService from '../../../services/puja.service';
import type { PujaDto } from '../../../types/dto/puja.dto';

const MisPujas: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // 1. Obtener las pujas del usuario logueado
  const { data: misPujas = [], isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data,
  });

  // 2. Configuración de Columnas
  const columns = useMemo<DataTableColumn<PujaDto>[]>(() => [
    { 
      id: 'lote', 
      label: 'Lote', 
      minWidth: 200,
      render: (puja) => (
        <Box>
          <Typography fontWeight={700} variant="body2">
            {puja.lote?.nombre_lote || `Lote #${puja.id_lote}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID Puja: {puja.id}
          </Typography>
        </Box>
      )
    },
    { 
      id: 'monto', 
      label: 'Mi Oferta', 
      render: (puja) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <MonetizationOn color="success" fontSize="small" />
          <Typography fontWeight={700}>
            ${Number(puja.monto_puja).toLocaleString('es-AR')}
          </Typography>
        </Stack>
      )
    },
    { 
      id: 'fecha', 
      label: 'Fecha', 
      render: (puja) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarToday color="action" fontSize="small" />
          <Typography variant="body2">
            {new Date(puja.fecha_puja).toLocaleDateString()}
          </Typography>
        </Stack>
      )
    },
    { 
      id: 'estado', 
      label: 'Estado', 
      render: (puja) => {
        let color: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default';
        let label = puja.estado_puja.toUpperCase().replace('_', ' ');

        switch (puja.estado_puja) {
          case 'activa': color = 'info'; break;
          case 'ganadora_pendiente': color = 'warning'; label = 'GANASTE (PAGAR)'; break;
          case 'ganadora_pagada': color = 'success'; label = 'GANADA Y PAGADA'; break;
          case 'perdedora': color = 'error'; break;
          case 'ganadora_incumplimiento': color = 'error'; label = 'ANULADA'; break;
        }

        return <Chip label={label} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
      }
    },
    { 
      id: 'acciones', 
      label: 'Acciones', 
      align: 'right',
      render: (puja) => (
        <Button 
          size="small" 
          variant="outlined" 
          endIcon={<OpenInNew />}
          onClick={() => navigate(`/lotes/${puja.id_lote}`)}
        >
          Ver Lote
        </Button>
      )
    }
  ], [navigate]);

  return (
    <PageContainer>
      <PageHeader 
        title="Mis Subastas" 
        subtitle="Historial de tus participaciones y estado de tus ofertas." 
      />

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <DataTable 
          columns={columns} 
          data={misPujas} 
          getRowKey={(row) => row.id}
          emptyMessage="Aún no has participado en ninguna subasta."
          pagination
        />
      </QueryHandler>
    </PageContainer>
  );
};

export default MisPujas;