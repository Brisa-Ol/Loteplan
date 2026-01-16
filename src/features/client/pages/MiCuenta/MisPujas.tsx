// src/pages/User/Pujas/MisPujas.tsx

import {
  CalendarToday,
  CheckCircle, ErrorOutline,
  Gavel,
  Info,
  MonetizationOn, OpenInNew, Warning
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes Comunes
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import PujaService from '@/core/api/services/puja.service';
import { env } from '@/core/config/env';
import type { PujaDto } from '@/core/types/dto/puja.dto';


const MisPujas: React.FC = () => {
  const navigate = useNavigate();

  // 1. Obtener las pujas del usuario logueado
  const { data: misPujas = [], isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data,
  });

  // Helpers de Formato Centralizados
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat(env.defaultLocale, { 
        style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 
    }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString(env.defaultLocale, {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
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
          <Typography fontWeight={700} color="success.main">
            {formatCurrency(Number(puja.monto_puja))}
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
          <Typography variant="body2" color="text.secondary">
            {formatDate(puja.fecha_puja)}
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
        let icon = <Info fontSize="small" />;

        switch (puja.estado_puja) {
          case 'activa': 
             color = 'info'; 
             icon = <Gavel fontSize="small" />;
             break;
          case 'ganadora_pendiente': 
             color = 'warning'; 
             label = 'GANASTE (PAGAR)'; 
             icon = <Warning fontSize="small" />;
             break;
          case 'ganadora_pagada': 
             color = 'success'; 
             label = 'GANADA Y PAGADA'; 
             icon = <CheckCircle fontSize="small" />;
             break;
          case 'perdedora': 
             color = 'default'; // Neutral, no error
             icon = <ErrorOutline fontSize="small" />;
             break;
          case 'ganadora_incumplimiento': 
             color = 'error'; 
             label = 'ANULADA'; 
             icon = <ErrorOutline fontSize="small" />;
             break;
        }

        return (
             <Chip 
                label={label} 
                color={color} 
                size="small" 
                icon={icon}
                variant={puja.estado_puja === 'activa' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 'bold' }} 
             />
        );
      }
    },
    { 
      id: 'acciones', 
      label: 'Acciones', 
      align: 'right',
      render: (puja) => (
        <Tooltip title="Ver detalle del lote">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => navigate(`/lotes/${puja.id_lote}`)}
            >
              <OpenInNew />
            </IconButton>
        </Tooltip>
      )
    }
  ], [navigate]);

  // Ordenar por defecto: más recientes primero
  const sortedPujas = useMemo(() => {
      return [...misPujas].sort((a, b) => new Date(b.fecha_puja).getTime() - new Date(a.fecha_puja).getTime());
  }, [misPujas]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Mis Subastas" 
        subtitle="Historial de tus participaciones y estado de tus ofertas." 
      />

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <DataTable 
          columns={columns} 
          data={sortedPujas} 
          getRowKey={(row) => row.id}
          emptyMessage="Aún no has participado en ninguna subasta."
          pagination
          defaultRowsPerPage={10} // Paginación estándar
        />
      </QueryHandler>
    </PageContainer>
  );
};

export default MisPujas;