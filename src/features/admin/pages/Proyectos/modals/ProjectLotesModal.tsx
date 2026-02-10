// src/components/Admin/Proyectos/Components/modals/ProjectLotesModal.tsx

import {
  Gavel as AuctionIcon,
  CheckCircle,
  Close,
  Description as ContractIcon,
  Edit as EditIcon,
  Inventory2,
  Map as MapIcon,
  AttachMoney as MoneyIcon,
  OpenInNew as OpenInNewIcon,
  UploadFile as UploadIcon,
  WarningAmber
} from '@mui/icons-material';
import {
  alpha, Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';


// Componentes
import ContratoPlantillaService from '../../../../../core/api/services/contrato-plantilla.service';
import LoteService from '../../../../../core/api/services/lote.service';
import type { LoteDto } from '../../../../../core/types/dto/lote.dto';
import type { ProyectoDto } from '../../../../../core/types/dto/proyecto.dto';
import { DataTable, type DataTableColumn } from '../../../../../shared/components/data-grid/DataTable/DataTable';


interface ProjectLotesModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
}

const ProjectLotesModal: React.FC<ProjectLotesModalProps> = ({
  open,
  onClose,
  proyecto
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // =========================================================
  // 1. QUERIES OPTIMIZADOS
  // =========================================================

  // Usamos select para filtrar la data sin volver a fetchear si ya está en caché
  const { data: lotes = [], isLoading: isLoadingLotes } = useQuery({
    queryKey: ['adminLotes'], // Key global para aprovechar caché de otras pantallas
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    enabled: open && !!proyecto,
    select: (allLotes) => allLotes.filter(l => l.id_proyecto === proyecto?.id),
    staleTime: 1000 * 60 * 5 // 5 minutos de caché
  });

  const { data: plantillaAsignada, isLoading: isLoadingContrato } = useQuery({
    queryKey: ['adminPlantillas'], // Key global
    queryFn: async () => (await ContratoPlantillaService.findAll()).data,
    enabled: open && !!proyecto,
    select: (allPlantillas) => allPlantillas.find(p => p.id_proyecto === proyecto?.id) || null,
    staleTime: 1000 * 60 * 5
  });

  // =========================================================
  // 2. HELPERS
  // =========================================================

  const formatPrice = (precio: number | string) => {
    const moneda = proyecto?.moneda || 'USD';
    const valor = Number(precio);
    return `${moneda} ${valor.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // =========================================================
  // 3. COLUMNAS
  // =========================================================

  const columns = useMemo<DataTableColumn<LoteDto>[]>(() => [
    {
      id: 'id', label: 'ID', minWidth: 50,
      render: (row) => <Typography variant="caption" fontWeight="bold" fontFamily="monospace" color="text.secondary">#{row.id}</Typography>
    },
    {
      id: 'nombre_lote', label: 'Nombre Lote', align: 'left',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={700} color={!row.activo ? 'text.disabled' : 'text.primary'}>
            {row.nombre_lote}
          </Typography>
          {!row.activo && (
            <Chip
              label="Inactivo" size="small" variant="outlined"
              sx={{ height: 18, fontSize: '0.6rem', mt: 0.5, borderColor: 'error.light', color: 'error.main' }}
            />
          )}
        </Box>
      )
    },
    {
      id: 'precio_base', label: 'Precio Base', align: 'right',
      render: (row) => (
        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
          <MoneyIcon fontSize="inherit" color="action" sx={{ fontSize: 14 }} />
          <Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">
            {formatPrice(row.precio_base)}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'latitud', label: 'Mapa', align: 'center',
      render: (row) => (
        row.latitud && row.longitud ? (
          <Tooltip title={`Lat: ${row.latitud}, Lng: ${row.longitud}`}>
            <IconButton
              size="small" color="primary"
              href={`https://www.google.com/maps?q=${row.latitud},${row.longitud}`} // ✅ URL Corregida
              target="_blank" rel="noopener noreferrer"
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            >
              <MapIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : <Typography variant="caption" color="text.disabled">-</Typography>
      )
    },
    {
      id: 'estado_subasta', label: 'Estado', align: 'center',
      render: (row) => {
        const estado = row.estado_subasta?.toLowerCase() || 'n/a';

        let colorMain = theme.palette.text.secondary;

        if (estado === 'activa') {
          // colorKey = 'success'; // Eliminar asignación
          colorMain = theme.palette.success.main;
        }
        else if (estado === 'pendiente') {
          // colorKey = 'warning'; // Eliminar asignación
          colorMain = theme.palette.warning.main;
        }

        return (
          <Chip
            label={estado.toUpperCase()} size="small"
            icon={estado === 'activa' ? <AuctionIcon style={{ fontSize: 14 }} /> : undefined}
            sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha(colorMain, 0.1), color: colorMain, border: '1px solid', borderColor: alpha(colorMain, 0.2) }}
          />
        );
      }
    },
    {
      id: 'id_ganador', label: 'Ganador', align: 'center',
      render: (row) => (
        row.id_ganador ? (
          <Chip label="Adjudicado" size="small" variant="filled" sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: 'success.main', color: 'white' }} />
        ) : <Typography variant="caption" color="text.disabled">-</Typography>
      )
    }
  ], [proyecto, theme]);

  // =========================================================
  // 4. RENDER Y ACTIONS
  // =========================================================

  const handleVerTodosLotes = () => {
    if (!proyecto) return;
    navigate(`/admin/lotes?proyecto=${proyecto.id}`);
    onClose();
  };

  const handleVerContrato = () => {
    if (plantillaAsignada?.url_archivo) window.open(plantillaAsignada.url_archivo, '_blank', 'noopener,noreferrer');
  };

  const handleGestionarContrato = () => {
    if (!proyecto) return;
    navigate(`/admin/plantillas?proyecto=${proyecto.id}`);
    onClose();
  };

  if (!proyecto) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, pt: 3, px: 3, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <Inventory2 />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
              Gestión de Lotes
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Proyecto: <strong>{proyecto.nombre_proyecto}</strong>
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ bgcolor: alpha(theme.palette.background.default, 0.4), p: 4 }}>
        <Stack spacing={4}>

          {/* --- SECCIÓN CONTRATO --- */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5, borderRadius: 2, border: '1px solid',
              borderColor: plantillaAsignada ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.warning.main, 0.3),
              bgcolor: plantillaAsignada ? alpha(theme.palette.success.main, 0.04) : alpha(theme.palette.warning.main, 0.04),
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <ContractIcon fontSize="small" color={plantillaAsignada ? "success" : "warning"} />
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">CONTRATO BASE</Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">Estado:</Typography>
                {isLoadingContrato ? <CircularProgress size={14} /> : (
                  <Chip
                    label={plantillaAsignada ? "Asignado" : "Pendiente de Carga"}
                    size="small"
                    color={plantillaAsignada ? "success" : "warning"}
                    variant="outlined"
                    icon={plantillaAsignada ? <CheckCircle style={{ fontSize: 14 }} /> : <WarningAmber style={{ fontSize: 14 }} />}
                    sx={{ height: 20, fontWeight: 700, bgcolor: 'background.paper' }}
                  />
                )}
              </Stack>
              {plantillaAsignada && (
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5} sx={{ fontStyle: 'italic' }}>
                  {plantillaAsignada.nombre_archivo}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              {plantillaAsignada && (
                <Button variant="contained" size="small" color="success" startIcon={<OpenInNewIcon />} onClick={handleVerContrato} sx={{ color: 'white', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                  Ver PDF
                </Button>
              )}
              <Button variant="outlined" size="small" color={plantillaAsignada ? "primary" : "warning"} startIcon={plantillaAsignada ? <EditIcon /> : <UploadIcon />} onClick={handleGestionarContrato} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: 'background.paper' }}>
                {plantillaAsignada ? 'Cambiar' : 'Subir Contrato'}
              </Button>
            </Stack>
          </Paper>

          {/* --- SECCIÓN TABLA --- */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Inventario ({lotes.length})
            </Typography>

            {isLoadingLotes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <DataTable
                  columns={columns}
                  data={lotes}
                  getRowKey={(row) => row.id}
                  pagination={true}
                  defaultRowsPerPage={5}
                  rowsPerPageOptions={[5, 10]}
                  emptyMessage="No se encontraron lotes asociados a este proyecto."
                />
              </Box>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Button onClick={onClose} variant="text" color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleVerTodosLotes} endIcon={<OpenInNewIcon />} sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}>
          Gestión Avanzada
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectLotesModal;