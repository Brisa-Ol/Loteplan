import React, { useMemo } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, LinearProgress, Alert, Divider,
  Avatar, IconButton, Tooltip, useTheme, alpha
} from '@mui/material';
import { 
  Warning, ErrorOutline, CheckCircle, Person,
  Info, Timeline, Image as ImageIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import type { LoteDto } from '../../../../core/types/dto/lote.dto';
import LoteService from '../../../../core/api/services/lote.service';
import imagenService from '../../../../core/api/services/imagen.service';
import { useSortedData } from '../../hooks/useSortedData';


// --- COMPONENTE KPI (Estandarizado) ---
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'success' | 'warning' | 'error' | 'info';
  description?: string;
}> = ({ title, value, icon, color, description }) => {
  const theme = useTheme();
  const paletteColor = theme.palette[color];

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 2, 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        transition: 'all 0.2s ease',
        '&:hover': {
            borderColor: paletteColor.main,
            transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ 
        bgcolor: alpha(paletteColor.main, 0.1), 
        color: paletteColor.main, 
        p: 1.5, 
        borderRadius: '50%', 
        display: 'flex' 
      }}>
        {icon}
      </Box>
      <Box flex={1}>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" color={paletteColor.main} fontWeight={700}>
            {description}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

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
  
  // 1. QUERY (Data cruda)
  const { data: lotesRaw = [], isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    refetchInterval: 15000,
  });

  // 2. HOOK: Ordenamiento (Aunque filtraremos después, esto garantiza consistencia si la tabla crece)
  const { sortedData: lotes, highlightedId } = useSortedData(lotesRaw);

  // Análisis de datos
  const analytics = useMemo(() => {
    // Usamos 'lotes' (que ya vienen ordenados por ID desc) para filtrar
    const finalizados = lotes.filter(l => l.estado_subasta === 'finalizada' && l.id_ganador);
    
    // Pendientes: intentos > 0 y < 3
    const pendientesPago = finalizados.filter(l => 
      (l.intentos_fallidos_pago || 0) > 0 && (l.intentos_fallidos_pago || 0) < 3
    );
    
    const riesgoCritico = pendientesPago.filter(l => (l.intentos_fallidos_pago || 0) >= 2);
    const primerIntento = pendientesPago.filter(l => (l.intentos_fallidos_pago || 0) === 1);
    const proximosVencer = pendientesPago.filter(l => calcularDiasRestantes(l) <= 10);
    const capitalEnRiesgo = riesgoCritico.reduce((acc, l) => acc + Number(l.precio_base), 0);
    
    // 3. MEJORA: Ordenamiento Específico de Negocio para esta tabla
    // Aunque el hook ordena por fecha de creación, para "Control de Pagos" 
    // es más importante ver arriba los de "Mayor Riesgo" (más intentos fallidos).
    const detallesOrdenados = [...pendientesPago].sort((a, b) => (b.intentos_fallidos_pago || 0) - (a.intentos_fallidos_pago || 0));

    return {
      totalFinalizados: finalizados.length,
      pendientesPago: pendientesPago.length,
      riesgoCritico: riesgoCritico.length,
      primerIntento: primerIntento.length,
      proximosVencer: proximosVencer.length,
      capitalEnRiesgo,
      detalles: detallesOrdenados
    };
  }, [lotes]);

  const getLoteImage = (lote: LoteDto) => 
    lote.imagenes?.[0] ? imagenService.resolveImageUrl(lote.imagenes[0].url) : undefined;

  // ========================================================================
  // ⚙️ DEFINICIÓN DE COLUMNAS PARA DATATABLE
  // ========================================================================
  const columns: DataTableColumn<LoteDto>[] = useMemo(() => [
    {
      id: 'lote',
      label: 'Lote / ID',
      minWidth: 220,
      render: (lote) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
                src={getLoteImage(lote)} 
                variant="rounded" 
                sx={{ 
                    width: 48, height: 48, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                }}
            >
                <ImageIcon fontSize="small" />
            </Avatar>
            <Box>
                <Typography variant="body2" fontWeight={700} color="text.primary">{lote.nombre_lote}</Typography>
                <Typography variant="caption" color="text.secondary">
                ID: {lote.id}
                </Typography>
            </Box>
        </Stack>
      )
    },
    {
      id: 'ganador',
      label: 'Ganador Actual',
      render: (lote) => (
        <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 24, height: 24, bgcolor: alpha(theme.palette.primary.main, 0.2), color: 'primary.main', fontSize: 12 }}>
                <Person fontSize="inherit" />
            </Avatar>
            <Typography variant="body2" fontWeight={500}>
                Usuario #{lote.id_ganador}
            </Typography>
        </Stack>
      )
    },
    {
      id: 'monto',
      label: 'Monto',
      render: (lote) => (
        <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontFamily: 'monospace' }}>
            ${Number(lote.precio_base).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'intentos',
      label: 'Intentos Fallidos',
      minWidth: 160,
      render: (lote) => {
        const intentos = lote.intentos_fallidos_pago || 0;
        const esRiesgoCritico = intentos >= 2;
        return (
            <Stack spacing={0.5} width="100%">
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" fontWeight={700} color={esRiesgoCritico ? 'error.main' : 'text.secondary'}>
                        {intentos}/3
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Intentos</Typography>
                </Stack>
                <LinearProgress 
                    variant="determinate" 
                    value={(intentos / 3) * 100}
                    color={intentos === 1 ? 'warning' : 'error'}
                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.grey[300], 0.5) }}
                />
            </Stack>
        );
      }
    },
    {
      id: 'dias',
      label: 'Días Restantes',
      render: (lote) => {
        const dias = calcularDiasRestantes(lote);
        return (
            <Chip
                label={`${dias} días`}
                size="small"
                color={dias <= 10 ? 'error' : dias <= 30 ? 'warning' : 'success'}
                variant={dias <= 10 ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700 }}
            />
        );
      }
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (lote) => {
        const esRiesgoCritico = (lote.intentos_fallidos_pago || 0) >= 2;
        return esRiesgoCritico ? (
            <Chip 
                label="CRÍTICO" 
                size="small" 
                color="error" 
                variant="filled"
                icon={<ErrorOutline sx={{ fontSize: '14px !important' }} />}
                sx={{ fontWeight: 700 }}
            />
        ) : (
            <Chip 
                label="En seguimiento" 
                size="small" 
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 600 }}
            />
        );
      }
    },
    {
      id: 'acciones',
      label: 'Info',
      align: 'right',
      render: (lote) => {
        const esRiesgoCritico = (lote.intentos_fallidos_pago || 0) >= 2;
        return (
            <Tooltip 
                title={
                    esRiesgoCritico 
                    ? "Si vence el plazo, el sistema marcará incumplimiento, devolverá el token y reasignará automáticamente."
                    : "El sistema monitoreará el vencimiento y actuará automáticamente."
                }
            >
                <IconButton size="small" color="info" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) } }}>
                    <Info fontSize="small" />
                </IconButton>
            </Tooltip>
        );
      }
    }
  ], [theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
    
      <PageHeader
        title="Gestión de Pagos"
        subtitle="Sistema automático de seguimiento de pagos y reasignación de lotes."
      />

      {/* Alerta informativa */}
      <Alert 
        severity="info" 
        icon={<Info />} 
        sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}
      >
        <Typography variant="body2" fontWeight={600}>
          🤖 Sistema Automático Activo
        </Typography>
        <Typography variant="caption">
          El sistema verifica diariamente vencimientos. Tras 3 intentos fallidos, el lote se reingresa automáticamente.
        </Typography>
      </Alert>

      {/* KPIs */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 4
      }}>
        <StatCard title="Total Finalizados" value={analytics.totalFinalizados} icon={<CheckCircle />} color="info" description="Subastas OK" />
        <StatCard title="En Proceso de Cobro" value={analytics.pendientesPago} icon={<Timeline />} color="warning" description="1 o 2 intentos" />
        <StatCard title="Riesgo Crítico" value={analytics.riesgoCritico} icon={<ErrorOutline />} color="error" description="Último intento" />
        <StatCard title="Capital en Riesgo" value={`$${analytics.capitalEnRiesgo.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} icon={<Warning />} color="error" description="Monto acumulado" />
      </Box>

      {/* Alertas críticas */}
      {analytics.riesgoCritico > 0 && (
        <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
          <Typography variant="body2" fontWeight={700}>
            ⚠️ ATENCIÓN: {analytics.riesgoCritico} lote{analytics.riesgoCritico > 1 ? 's' : ''} en riesgo crítico
          </Typography>
          <Typography variant="caption">
            Están a 1 intento del reingreso automático. El sistema reasignará si no se paga antes del vencimiento.
          </Typography>
        </Alert>
      )}

      {analytics.proximosVencer > 0 && (
        <Alert severity="warning" variant="filled" sx={{ mb: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
          <Typography variant="body2" fontWeight={700}>
            ⏰ {analytics.proximosVencer} lote{analytics.proximosVencer > 1 ? 's' : ''} con menos de 10 días de plazo
          </Typography>
        </Alert>
      )}

      {/* ✅ USO DEL COMPONENTE DATATABLE */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
            Lotes Pendientes de Pago (Seguimiento)
        </Typography>
        <QueryHandler isLoading={isLoading} error={error as Error}>
            <DataTable
                columns={columns}
                data={analytics.detalles} // Datos ordenados por riesgo
                getRowKey={(row) => row.id}
                emptyMessage="¡Excelente! No hay pendientes de pago con intentos fallidos."
                pagination={true}
                defaultRowsPerPage={5}
                
                // 4. MEJORA: Aunque no editamos aquí, si el sistema detecta cambios en tiempo real
                // (por el refetchInterval), el highlight visual mostraría qué fila cambió si se dispara un evento.
                highlightedRowId={highlightedId} 
            />
        </QueryHandler>
      </Box>

      {/* Explicación del flujo automático */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
          🔄 Flujo Automático de Reasignación
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" fontWeight={700} color="success.main" display="block">
              1. FINALIZACIÓN
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Se asigna ganador y plazo de 90 días (Intento 1).
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={700} color="warning.main" display="block">
              2. VENCIMIENTO & REASIGNACIÓN
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Si vence: Se marca incumplimiento, se devuelve token y se busca siguiente postor (Intento +1).
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={700} color="error.main" display="block">
              3. REINGRESO
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Si se agotan 3 intentos o no hay más postores: El lote se limpia y vuelve a estado 'pendiente'.
            </Typography>
          </Box>
        </Stack>
      </Paper>

    </PageContainer>
  );
};

export default AdminLotePagos;