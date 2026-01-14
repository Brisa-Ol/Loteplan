// src/pages/User/ResumenesCuenta/MisResumenes.tsx

import {
  Assessment,
  Business,
  CheckCircle,
  Close, LocalShipping,
  MonetizationOn,
  Percent,
  ReceiptLong, TrendingUp,
  Warning
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

// Servicios y Tipos
import ResumenCuentaService from '../../../services/resumenCuenta.service';
import type { DetalleCuotaJson, ResumenCuentaDto } from '../../../types/dto/resumenCuenta.dto';

// Componentes Comunes
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard'; // ✅ Importamos StatCard

// ✅ Importamos configuración centralizada
import { env } from '../../../config/env';

// ----------------------------------------------------------------------
// 1. SUB-COMPONENTE: Modal de Detalle Financiero (Estilizado)
// ----------------------------------------------------------------------
interface DetalleModalProps {
  open: boolean;
  onClose: () => void;
  data: DetalleCuotaJson | null;
  nombreProyecto: string;
}

const DetalleCuotaModal: React.FC<DetalleModalProps> = ({ open, onClose, data, nombreProyecto }) => {
  const theme = useTheme();
  
  // Helper local para formato moneda
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(env.defaultLocale, { 
        style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 
    }).format(val);

  if (!data) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 32, height: 32 }}>
                <ReceiptLong fontSize="small" />
            </Avatar>
            <Box>
                <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>Composición de Cuota</Typography>
                <Typography variant="caption" color="text.secondary">{nombreProyecto}</Typography>
            </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        
        {/* Sección Cemento (Referencia) */}
        <Paper 
            variant="outlined" 
            sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.05), borderColor: alpha(theme.palette.info.main, 0.2) }}
        >
          <Typography variant="subtitle2" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, fontWeight: 700 }}>
            <LocalShipping fontSize="small" /> Referencia de Valor
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Producto Base</Typography>
              <Typography variant="body2" fontWeight={600}>{data.nombre_cemento}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary" display="block">Valor Unitario</Typography>
              <Typography variant="body2" fontWeight={600}>${data.valor_cemento}</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Sección Desglose */}
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
            Desglose del Cálculo
        </Typography>

        <Stack spacing={2} sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Valor Móvil ({data.valor_cemento_unidades} unidades)</Typography>
            <Typography variant="body2" fontWeight={500}>{formatCurrency(data.valor_movil)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Carga Administrativa</Typography>
            <Typography variant="body2" fontWeight={500}>{formatCurrency(data.carga_administrativa)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">IVA s/Carga Admin</Typography>
            <Typography variant="body2" fontWeight={500}>{formatCurrency(data.iva_carga_administrativa)}</Typography>
          </Box>
        </Stack>
          
        <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
          
        <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
            sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText', 
                p: 2, 
                borderRadius: 2,
                boxShadow: theme.shadows[2]
            }}
        >
          <Typography variant="subtitle1" fontWeight={600}>Valor Mensual Final</Typography>
          <Typography variant="h6" fontWeight={700}>{formatCurrency(data.valor_mensual_final)}</Typography>
        </Box>

      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" fullWidth color="inherit">Cerrar Detalle</Button>
      </DialogActions>
    </Dialog>
  );
};

// ----------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
const MisResumenes: React.FC = () => {
  const theme = useTheme();
  
  // Estado para el Modal
  const [selectedResumen, setSelectedResumen] = useState<{data: DetalleCuotaJson, nombre: string} | null>(null);

  // Query
  const { data: resumenes = [], isLoading, error } = useQuery<ResumenCuentaDto[]>({
    queryKey: ['misResumenes'],
    queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });

  // Helpers Centralizados
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(env.defaultLocale, { 
        style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 
    }).format(val);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalPlanes = resumenes.length;
    const promedioAvance = totalPlanes > 0 
        ? resumenes.reduce((acc, curr) => acc + curr.porcentaje_pagado, 0) / totalPlanes 
        : 0;
    const cuotasVencidasTotal = resumenes.reduce((acc, curr) => acc + curr.cuotas_vencidas, 0);
    return { totalPlanes, promedioAvance, cuotasVencidasTotal };
  }, [resumenes]);

  // Definición de Columnas
  const columns = useMemo<DataTableColumn<ResumenCuentaDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto / Plan',
      minWidth: 220,
      render: (row) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <Business fontSize="small" />
            </Avatar>
            <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    {row.proyecto_info?.nombre_proyecto || row.nombre_proyecto}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Plan de {row.meses_proyecto} cuotas
                </Typography>
            </Box>
        </Stack>
      )
    },
    {
      id: 'progreso',
      label: 'Progreso',
      minWidth: 200,
      render: (row) => (
        <Box sx={{ width: '100%' }}>
            <Box display="flex" justifyContent="space-between" mb={0.5} alignItems="center">
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {row.cuotas_pagadas} de {row.meses_proyecto} cuotas
                </Typography>
                <Typography variant="caption" fontWeight={700} color="primary.main">
                    {row.porcentaje_pagado.toFixed(1)}%
                </Typography>
            </Box>
            <LinearProgress 
                variant="determinate" 
                value={row.porcentaje_pagado} 
                sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: row.porcentaje_pagado >= 100 ? theme.palette.success.main : theme.palette.primary.main
                    }
                }}
            />
        </Box>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      minWidth: 140,
      render: (row) => (
        <Stack direction="row" spacing={1}>
            {row.cuotas_vencidas > 0 ? (
                <Chip 
                    icon={<Warning fontSize="small" />}
                    label={`${row.cuotas_vencidas} Vencidas`} 
                    size="small" 
                    color="error" 
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                />
            ) : row.porcentaje_pagado >= 100 ? (
                <Chip 
                    icon={<CheckCircle fontSize="small" />}
                    label="Completado" 
                    size="small" 
                    color="success" 
                    variant="filled" 
                    sx={{ fontWeight: 600 }}
                />
            ) : (
                <Chip 
                    label="Al día" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                    sx={{ fontWeight: 600, borderColor: theme.palette.success.main, color: theme.palette.success.dark }}
                />
            )}
        </Stack>
      )
    },
    {
      id: 'valor_actual',
      label: 'Valor Actual',
      minWidth: 140,
      render: (row) => (
        <Stack alignItems="flex-end">
            <Typography variant="body2" fontWeight={800} color="text.primary">
                {formatCurrency(row.detalle_cuota.valor_mensual_final)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: 12, color: 'info.main' }} /> Actualizado
            </Typography>
        </Stack>
      )
    },
    {
      id: 'acciones',
      label: 'Acción',
      align: 'right',
      minWidth: 120,
      render: (row) => (
        <Button
            size="small"
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => setSelectedResumen({ 
                data: row.detalle_cuota, 
                nombre: row.proyecto_info?.nombre_proyecto || row.nombre_proyecto 
            })}
            sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                color: 'text.secondary', 
                borderColor: theme.palette.divider,
                '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
            }}
        >
            Detalle
        </Button>
      )
    }
  ], [theme]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Resumen de Cuenta" 
        subtitle="Analiza el progreso de tus planes y la composición financiera de tus cuotas." 
      />

      {/* --- KPI SECTION CON STATCARD --- */}
      <Box 
        mb={4}
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} 
        gap={3}
      >
        <StatCard 
            title="Total Planes" 
            value={stats.totalPlanes.toString()} 
            icon={<Business />} 
            color="primary" 
            loading={isLoading}
            subtitle="Planes Activos"
        />
        <StatCard 
            title="Avance Promedio" 
            value={`${stats.promedioAvance.toFixed(0)}%`} 
            icon={<Percent />} 
            color="secondary" 
            loading={isLoading}
            subtitle="Avance Global"
        />
        <StatCard 
            title={stats.cuotasVencidasTotal > 0 ? "Cuotas Vencidas" : "Estado Deuda"} 
            value={stats.cuotasVencidasTotal.toString()} 
            icon={stats.cuotasVencidasTotal > 0 ? <Warning /> : <MonetizationOn />} 
            color={stats.cuotasVencidasTotal > 0 ? "error" : "success"} 
            loading={isLoading}
            subtitle={stats.cuotasVencidasTotal > 0 ? "Requiere atención" : "Todo al día"}
        />
      </Box>

      {/* --- TABLE SECTION --- */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <Paper 
            elevation={0}
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[1]
            }}
        >
            <DataTable
                columns={columns}
                data={resumenes}
                getRowKey={(row) => row.id}
                pagination={true}
                defaultRowsPerPage={5}
                emptyMessage="No tienes planes activos actualmente."
                
                // ✅ Atenuar planes completados para enfocar en los activos
                isRowActive={(row) => row.porcentaje_pagado < 100}

                // ✅ Resaltado de deudas (Alerta crítica)
                getRowSx={(row) => ({
                    bgcolor: row.cuotas_vencidas > 0 ? alpha(theme.palette.error.main, 0.05) : 'inherit',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        bgcolor: row.cuotas_vencidas > 0 ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.primary.main, 0.02)
                    }
                })}
            />
        </Paper>
      </QueryHandler>

      {/* Modal de Detalle */}
      <DetalleCuotaModal 
        open={!!selectedResumen}
        onClose={() => setSelectedResumen(null)}
        data={selectedResumen?.data || null}
        nombreProyecto={selectedResumen?.nombre || ''}
      />
    </PageContainer>
  );
};

export default MisResumenes;