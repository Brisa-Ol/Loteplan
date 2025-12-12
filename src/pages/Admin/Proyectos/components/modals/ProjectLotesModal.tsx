import React, { useMemo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Paper, Typography, Box, Chip, IconButton, Tooltip, Stack, CircularProgress 
} from '@mui/material';
import { 
  Close, Inventory2, 
  Description as ContractIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  CheckCircle, 
  WarningAmber,
  Map as MapIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Servicios
import LoteService from '../../../../../Services/lote.service';
import ContratoPlantillaService from '../../../../../Services/contrato-plantilla.service';

// DataTable
import { DataTable, type DataTableColumn } from '../../../../../components/common/DataTable/DataTable'; 

// DTOs
import type { ProyectoDto } from '../../../../../types/dto/proyecto.dto';
import type { LoteDto } from '../../../../../types/dto/lote.dto';
import type { ContratoPlantillaDto } from '../../../../../types/dto/contrato.dto';

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
  const navigate = useNavigate();
  
  // =========================================================
  // 1. QUERIES
  // =========================================================

  const { data: lotes = [], isLoading: isLoadingLotes } = useQuery<LoteDto[]>({
    queryKey: ['lotesByProject', proyecto?.id],
    queryFn: async () => {
      if (!proyecto) return [];
      
      try {
        // ⚠️ CAMBIO ESTRATÉGICO PARA NO TOCAR EL BACKEND:
        // El endpoint 'getByProject' filtra 'activo: true' en el servidor.
        // Para ver los inactivos, usamos 'findAllAdmin' (que trae TODO) y filtramos aquí.
        const res = await LoteService.findAllAdmin(); 
        const allLotes = Array.isArray(res.data) ? res.data : [];

        // Filtramos manualmente en el cliente por el ID del proyecto actual
        const lotesDeEsteProyecto = allLotes.filter(l => l.id_proyecto === proyecto.id);

        console.log(`📦 Lotes encontrados para ID ${proyecto.id}:`, lotesDeEsteProyecto);
        return lotesDeEsteProyecto;

      } catch (error) {
        console.error("Error cargando lotes:", error);
        return [];
      }
    },
    enabled: open && !!proyecto,
    staleTime: 0, 
    refetchOnMount: true
  });

  // Query del Contrato (Sin cambios)
  const { data: plantillaAsignada, isLoading: isLoadingContrato } = useQuery<ContratoPlantillaDto | null>({
    queryKey: ['plantillaByProject', proyecto?.id],
    queryFn: async () => {
      if (!proyecto) return null;
      try {
        const res = await ContratoPlantillaService.findAll();
        // Validación extra de seguridad por si data no es array
        const list = Array.isArray(res.data) ? res.data : [];
        return list.find(p => p.id_proyecto === proyecto.id) || null;
      } catch (e) {
        return null;
      }
    },
    enabled: open && !!proyecto,
    staleTime: 0,
  });

  // =========================================================
  // 2. CONFIGURACIÓN COLUMNAS
  // =========================================================

  const formatPrice = (precio: number) => {
    const moneda = (proyecto as any)?.moneda || 'USD';
    return `${moneda} ${Number(precio).toLocaleString('es-AR', { 
      minimumFractionDigits: 0, maximumFractionDigits: 2 
    })}`;
  };

  const getEstadoSubastaColor = (estado: string) => {
    switch(estado?.toLowerCase()) {
      case 'activa': return 'success';
      case 'pendiente': return 'warning';
      case 'finalizada': return 'default';
      default: return 'default';
    }
  };

  const columns = useMemo<DataTableColumn<LoteDto>[]>(() => [
    { 
      id: 'id', 
      label: 'ID', 
      minWidth: 50,
      render: (row) => <Typography variant="caption" fontWeight="bold">#{row.id}</Typography>
    },
    { 
      id: 'nombre_lote', 
      label: 'Nombre', 
      align: 'left',
      render: (row) => (
        <Box>
            <Typography variant="body2" fontWeight={600}>{row.nombre_lote}</Typography>
            {/* Si 'activo' es false (o 0), mostramos la etiqueta */}
            {!row.activo && (
                <Chip 
                  label="Inactivo" 
                  size="small" 
                  color="error" 
                  variant="outlined" 
                  sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }} 
                />
            )}
        </Box>
      )
    },
    { 
      id: 'precio_base', 
      label: 'Precio Base', 
      align: 'right',
      render: (row) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {formatPrice(row.precio_base)}
        </Typography>
      )
    },
    {
      id: 'latitud', 
      label: 'Ubicación',
      align: 'center',
      render: (row) => (
         row.latitud && row.longitud ? (
           <Tooltip title={`Lat: ${row.latitud}, Lng: ${row.longitud}`}>
             <MapIcon fontSize="small" color="action" />
           </Tooltip>
         ) : <Typography variant="caption" color="text.disabled">-</Typography>
      )
    },
    { 
      id: 'estado_subasta', 
      label: 'Estado', 
      align: 'center',
      render: (row) => (
        <Chip 
          label={row.estado_subasta?.toUpperCase() || 'N/A'} 
          size="small" 
          color={getEstadoSubastaColor(row.estado_subasta || '')} 
          variant="outlined"
          sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
        />
      )
    },
    { 
      id: 'id_ganador', 
      label: 'Ganador', 
      align: 'center',
      render: (row) => (
        row.id_ganador ? (
          <Chip label="Adjudicado" size="small" color="success" variant="filled" sx={{fontSize: '0.7rem'}} />
        ) : (
          <Typography variant="caption" color="text.disabled">-</Typography>
        )
      )
    }
  ], [proyecto]); 

  // =========================================================
  // 3. RENDER
  // =========================================================

  const contratoUrl = plantillaAsignada?.url_archivo;

  const handleVerTodosLotes = () => {
    if (!proyecto) return;
    navigate(`/admin/lotes?proyecto=${proyecto.id}`);
    onClose();
  };

  const handleVerContrato = () => {
    if (contratoUrl) window.open(contratoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGestionarContrato = () => {
    if (!proyecto) return;
    navigate(`/admin/plantillas?proyecto=${proyecto.id}`);
    onClose();
  };

  if (!proyecto) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory2 color="primary" />
          <Box>
            <Typography variant="h6" fontWeight="bold">Lotes del Proyecto</Typography>
            <Typography variant="body2" color="text.secondary">{proyecto.nombre_proyecto}</Typography>
          </Box>
        </Box>
        <Tooltip title="Cerrar">
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Tooltip>
      </DialogTitle>
      
      <DialogContent dividers sx={{ bgcolor: '#fafafa', p: 3 }}>
        
        {/* --- Sección Contrato --- */}
        <Paper 
          variant="outlined" 
          sx={{ mb: 3, p: 2, bgcolor: plantillaAsignada ? 'success.50' : 'warning.50', borderColor: plantillaAsignada ? 'success.200' : 'warning.200', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box>
             <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <Typography variant="subtitle2" fontWeight="bold">Contrato Base</Typography>
                {isLoadingContrato ? <CircularProgress size={16} /> : plantillaAsignada ? (
                    <Chip icon={<CheckCircle style={{fontSize: 16}}/>} label="Asignado" size="small" color="success" />
                ) : (
                    <Chip icon={<WarningAmber style={{fontSize: 16}}/>} label="Pendiente" size="small" color="warning" />
                )}
             </Stack>
             <Typography variant="caption" color="text.secondary">
                {plantillaAsignada ? `${plantillaAsignada.nombre_archivo}` : "No hay plantilla PDF asignada."}
             </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {plantillaAsignada && (
                <Button variant="contained" size="small" color="success" startIcon={<ContractIcon />} onClick={handleVerContrato} sx={{ color: 'white' }}>Ver PDF</Button>
            )}
            <Button variant="outlined" size="small" color={plantillaAsignada ? "primary" : "warning"} startIcon={<EditIcon />} onClick={handleGestionarContrato}>{plantillaAsignada ? 'Cambiar' : 'Subir'}</Button>
          </Box>
        </Paper>

        {/* --- Sección Tabla --- */}
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">Inventario ({lotes.length})</Typography>
        </Box>

        {isLoadingLotes ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <DataTable
              columns={columns}
              data={lotes}
              getRowKey={(row) => row.id} // ✅ Clave para DataTable
              pagination={true}
              defaultRowsPerPage={5}
              rowsPerPageOptions={[5, 10]} 
              emptyMessage="No se encontraron lotes para este proyecto."
              variant="outlined"
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Cerrar</Button>
        <Button variant="contained" onClick={handleVerTodosLotes} endIcon={<OpenInNewIcon />}>Gestión Avanzada</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectLotesModal;