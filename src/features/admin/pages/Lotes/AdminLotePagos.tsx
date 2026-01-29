import React, { useMemo } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, LinearProgress, Alert, Divider,
  Avatar, IconButton, Tooltip, useTheme, alpha
} from '@mui/material';
import { 
  Warning, ErrorOutline, CheckCircle, Person,
  Info, Timeline, Image as ImageIcon, AttachMoney
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard'; // ✅ Importación del componente Premium

import type { LoteDto } from '../../../../core/types/dto/lote.dto';
import LoteService from '../../../../core/api/services/lote.service';
import imagenService from '../../../../core/api/services/imagen.service';
import { useSortedData } from '../../hooks/useSortedData';

// Helper: 90 días desde fecha_fin
const calcularDiasRestantes = (lote: LoteDto): number => {
  if (!lote.fecha_fin) return 90;
  const fechaFin = new Date(lote.fecha_fin);
  const fechaLimite = new Date(fechaFin.getTime() + 90 * 24 * 60 * 60 * 1000);
  const ahora = new Date();
  const diff = fechaLimite.getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const AdminLotePagos: React.FC = () => {
  const theme = useTheme();
  
  const { data: lotesRaw = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 15000,
  });

  const { sortedData: lotes, highlightedId } = useSortedData(lotesRaw);

  const analytics = useMemo(() => {
    const finalizados = lotes.filter(l => l.estado_subasta === 'finalizada' && l.id_ganador);
    const pendientesPago = finalizados.filter(l => (l.intentos_fallidos_pago || 0) > 0);
    const riesgoCritico = pendientesPago.filter(l => (l.intentos_fallidos_pago || 0) >= 2);
    const capitalEnRiesgo = riesgoCritico.reduce((acc, l) => acc + Number(l.precio_base), 0);
    
    const detallesOrdenados = [...pendientesPago].sort((a, b) => 
      (b.intentos_fallidos_pago || 0) - (a.intentos_fallidos_pago || 0)
    );

    return {
      totalFinalizados: finalizados.length,
      pendientesPago: pendientesPago.length,
      riesgoCritico: riesgoCritico.length,
      capitalEnRiesgo,
      detalles: detallesOrdenados
    };
  }, [lotes]);

  const columns: DataTableColumn<LoteDto>[] = useMemo(() => [
    {
      id: 'lote',
      label: 'Lote / ID',
      minWidth: 220,
      render: (lote) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
                src={lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined} 
                variant="rounded" 
                sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}
            >
                <ImageIcon sx={{ color: theme.palette.primary.main }} />
            </Avatar>
            <Box>
                <Typography variant="body2" fontWeight={700}>{lote.nombre_lote}</Typography>
                <Typography variant="caption" color="text.secondary">ID: {lote.id}</Typography>
            </Box>
        </Stack>
      )
    },
    {
      id: 'ganador',
      label: 'Ganador',
      render: (lote) => (
        <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main }}>
                <Person sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography variant="body2" fontWeight={600}>Usuario #{lote.id_ganador}</Typography>
        </Stack>
      )
    },
    {
      id: 'monto',
      label: 'Capital',
      render: (lote) => (
        <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ fontFamily: 'monospace' }}>
            ${Number(lote.precio_base).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'intentos',
      label: 'Salud del Pago',
      minWidth: 160,
      render: (lote) => {
        const intentos = lote.intentos_fallidos_pago || 0;
        const isCritical = intentos >= 2;
        return (
            <Stack spacing={0.8} width="100%" sx={{ pr: 2 }}>
                <Typography variant="caption" fontWeight={800} color={isCritical ? 'error.main' : 'warning.main'}>
                  {intentos} DE 3 INTENTOS FALLIDOS
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={(intentos / 3) * 100}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3, 
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: isCritical ? theme.palette.error.main : theme.palette.warning.main
                      }
                    }}
                />
            </Stack>
        );
      }
    },
    {
      id: 'dias',
      label: 'Vencimiento',
      render: (lote) => {
        const dias = calcularDiasRestantes(lote);
        return (
            <Chip
                label={`${dias} DÍAS RESTANTES`}
                size="small"
                color={dias <= 10 ? 'error' : dias <= 30 ? 'warning' : 'success'}
                sx={{ fontWeight: 800, fontSize: '0.6rem' }}
            />
        );
      }
    },
    {
      id: 'acciones',
      label: 'Estado',
      align: 'right',
      render: (lote) => (
        <Tooltip title={lote.intentos_fallidos_pago >= 2 ? "Riesgo de liberación inmediata" : "En seguimiento"}>
            <IconButton size="small" sx={{ color: (lote.intentos_fallidos_pago || 0) >= 2 ? 'error.main' : 'info.main' }}>
                <Info fontSize="small" />
            </IconButton>
        </Tooltip>
      )
    }
  ], [theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Gestión de Cobranza de Subastas"
        subtitle="Monitoreo de capital en mora y control de procesos de reasignación automática."
      />

      {/* ========== 1. KPI SECTION (Premium StatCards) ========== */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
        <StatCard 
          title="Total Finalizados" 
          value={analytics.totalFinalizados} 
          icon={<CheckCircle />} 
          color="info" // ✅ Se verá Naranja por tu tema
          subtitle="Subastas cerradas"
          loading={isLoading}
        />
        <StatCard 
          title="Pagos en Proceso" 
          value={analytics.pendientesPago} 
          icon={<Timeline />} 
          color="warning" 
          subtitle="Con intentos fallidos"
          loading={isLoading}
        />
        <StatCard 
          title="Riesgo Crítico" 
          value={analytics.riesgoCritico} 
          icon={<ErrorOutline />} 
          color="error" 
          subtitle="Al borde de liberación"
          badge="Urgente"
          loading={isLoading}
        />
        <StatCard 
          title="Capital en Riesgo" 
          value={`$${analytics.capitalEnRiesgo.toLocaleString('es-AR')}`} 
          icon={<AttachMoney />} 
          color="error" 
          subtitle="Falta de pago"
          loading={isLoading}
        />
      </Box>

      {/* Alertas dinámicas */}
      {analytics.riesgoCritico > 0 && (
        <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 2, fontWeight: 700, borderLeft: '5px solid' }}>
          ATENCIÓN: {analytics.riesgoCritico} Lotes están en riesgo crítico de ser liberados por falta de pago del ganador.
        </Alert>
      )}

      {/* ========== 2. DATA TABLE ========== */}
      <QueryHandler isLoading={isLoading} error={error as Error}>
        <DataTable
          columns={columns}
          data={analytics.detalles}
          getRowKey={(row) => row.id}
          isRowActive={(lote) => (lote.intentos_fallidos_pago || 0) < 2}
          showInactiveToggle={true}
          inactiveLabel="Riesgo Crítico"
          highlightedRowId={highlightedId}
          emptyMessage="No hay lotes con incidencias de pago registradas."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ========== 3. INFO PROTOCOLO ========== */}
      <Paper sx={{ p: 4, mt: 4, bgcolor: alpha(theme.palette.background.paper, 0.4), borderRadius: 2, border: '1px solid', borderColor: theme.palette.secondary.main }} elevation={0}>
        <Typography variant="overline" fontWeight={800} color="primary.main" sx={{ mb: 2, display: 'block' }}>
          🔄 Protocolo Automático de Reasignación
        </Typography>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            • <b>Intento de Pago:</b> El ganador dispone de 90 días naturales para la entrega del capital.<br/>
            • <b>Fallo en Cobro:</b> Tras cada intento fallido, se notifica automáticamente al usuario y al administrador.<br/>
            • <b>Reasignación:</b> Al alcanzar el <b>3er intento fallido</b>, el sistema revoca la adjudicación y asigna el lote al siguiente postor de la lista.<br/>
            • <b>Disponibilidad:</b> Si no existen más postores válidos, el lote regresa a estado de "Suscripción Abierta".
          </Typography>
        </Stack>
      </Paper>
    </PageContainer>
  );
};

export default AdminLotePagos;