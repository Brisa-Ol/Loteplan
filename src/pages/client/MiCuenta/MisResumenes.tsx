import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Stack, Chip, Button, LinearProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider
} from '@mui/material';
import { 
  Assessment, Close, LocalShipping, ReceiptLong, TrendingUp 
} from '@mui/icons-material';

// Servicios y Tipos
import ResumenCuentaService from '../../../Services/resumenCuenta.service';
import type { ResumenCuentaDto, DetalleCuotaJson } from '../../../types/dto/resumenCuenta.dto';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable'; // 👈 Tu DataTable

// ----------------------------------------------------------------------
// 1. SUB-COMPONENTE: Modal de Detalle Financiero
// ----------------------------------------------------------------------
interface DetalleModalProps {
  open: boolean;
  onClose: () => void;
  data: DetalleCuotaJson | null;
  nombreProyecto: string;
}

const DetalleCuotaModal: React.FC<DetalleModalProps> = ({ open, onClose, data, nombreProyecto }) => {
  if (!data) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
        <Box>
            <Typography variant="h6" fontWeight={700}>Composición de Cuota</Typography>
            <Typography variant="caption" color="text.secondary">{nombreProyecto}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Sección Cemento */}
        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocalShipping fontSize="small" /> Referencia de Valor
          </Typography>
          <Box display="flex" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">Producto Base</Typography>
              <Typography variant="body2" fontWeight={600}>{data.nombre_cemento}</Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">Valor Unitario</Typography>
              <Typography variant="body2" fontWeight={600}>${data.valor_cemento}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Sección Desglose */}
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
           <ReceiptLong fontSize="small" /> Desglose del Costo
        </Typography>

        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Valor Móvil ({data.valor_cemento_unidades} u.)</Typography>
            <Typography variant="body2" fontWeight={500}>${data.valor_movil.toLocaleString()}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Carga Administrativa</Typography>
            <Typography variant="body2" fontWeight={500}>${data.carga_administrativa.toLocaleString()}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">IVA s/Carga Admin</Typography>
            <Typography variant="body2" fontWeight={500}>${data.iva_carga_administrativa.toLocaleString()}</Typography>
          </Box>
          
          <Divider sx={{ borderStyle: 'dashed' }} />
          
          <Box display="flex" justifyContent="space-between" sx={{ color: 'primary.main', bgcolor: 'primary.lighter', p: 1, borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>Valor Mensual Final</Typography>
            <Typography variant="subtitle1" fontWeight={700}>${data.valor_mensual_final.toLocaleString()}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

// ----------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
const MisResumenes: React.FC = () => {
  // Estado para el Modal
  const [selectedResumen, setSelectedResumen] = useState<{data: DetalleCuotaJson, nombre: string} | null>(null);

  // Query
  const { data: resumenes = [], isLoading, error } = useQuery<ResumenCuentaDto[]>({
    queryKey: ['misResumenes'],
    queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });

  // Definición de Columnas
  const columns = useMemo<DataTableColumn<ResumenCuentaDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto / Plan',
      minWidth: 200,
      render: (row) => (
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {row.proyecto_info?.nombre_proyecto || row.nombre_proyecto}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Plan de {row.meses_proyecto} cuotas
          </Typography>
        </Box>
      )
    },
    {
      id: 'progreso',
      label: 'Progreso',
      minWidth: 180,
      render: (row) => (
        <Box sx={{ width: '100%' }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">Avance</Typography>
                <Typography variant="caption" fontWeight={700} color="primary.main">{row.porcentaje_pagado.toFixed(1)}%</Typography>
            </Box>
            <LinearProgress 
                variant="determinate" 
                value={row.porcentaje_pagado} 
                sx={{ height: 6, borderRadius: 3 }}
            />
        </Box>
      )
    },
    {
      id: 'estado',
      label: 'Estado Cuotas',
      minWidth: 150,
      render: (row) => (
        <Stack direction="row" spacing={1}>
            <Chip 
                label={`${row.cuotas_pagadas} Pagadas`} 
                size="small" 
                color="success" 
                variant="outlined" 
                sx={{ fontSize: '0.7rem' }}
            />
            {row.cuotas_vencidas > 0 && (
                <Chip 
                    label={`${row.cuotas_vencidas} Vencidas`} 
                    size="small" 
                    color="error" 
                    variant="filled" // O 'filled'
                    sx={{ fontSize: '0.7rem' }}
                />
            )}
        </Stack>
      )
    },
    {
      id: 'valor_actual',
      label: 'Valor Actual',
      minWidth: 120,
      render: (row) => (
        <Stack alignItems="flex-end">
            <Typography variant="body2" fontWeight={700}>
                ${row.detalle_cuota.valor_mensual_final.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: 10 }} /> Actualizado
            </Typography>
        </Stack>
      )
    },
    {
      id: 'acciones',
      label: 'Detalle',
      align: 'right',
      minWidth: 100,
      render: (row) => (
        <Button
            size="small"
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => setSelectedResumen({ 
                data: row.detalle_cuota, 
                nombre: row.proyecto_info?.nombre_proyecto || row.nombre_proyecto 
            })}
            sx={{ borderRadius: 2, textTransform: 'none' }}
        >
            Ver Composición
        </Button>
      )
    }
  ], []);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Resumen de Cuenta" 
        subtitle="Analiza el progreso de tus planes y la composición financiera de tus cuotas." 
      />

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
            columns={columns}
            data={resumenes}
            getRowKey={(row) => row.id}
            pagination={true}
            defaultRowsPerPage={5}
            emptyMessage="No tienes planes activos actualmente."
            // Resaltamos si hay cuotas vencidas en la fila entera de forma sutil
            getRowSx={(row) => ({
                backgroundColor: row.cuotas_vencidas > 0 ? '#fff5f5' : 'inherit'
            })}
        />
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