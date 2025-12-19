import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment, useTheme, Switch, CircularProgress, alpha, Snackbar, Alert
} from '@mui/material';
import { 
  Search, Upload as UploadIcon, Add as AddIcon,
  Edit as EditIcon, Delete as DeleteIcon
} from '@mui/icons-material'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- DTOs y Servicios ---
import type { ContratoPlantillaDto, CreatePlantillaDto, UpdatePlantillaPdfDto } from '../../../types/dto/contrato.dto';
import ContratoPlantillaService from '../../../Services/contrato-plantilla.service';
import ProyectoService from '../../../Services/proyecto.service';

// --- Componentes Comunes ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// --- Modales ---
import CreatePlantillaModal from './components/modals/CreatePlantillaModal';
import UpdatePdfModal from './components/modals/UpdatePdfModal';
import UpdateMetadataModal from './components/modals/UpdateMetadataModal'; 

const AdminPlantillas: React.FC = () => {
  const theme = useTheme(); 
  const queryClient = useQueryClient();
  
  // 1. Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [plantillaSelected, setPlantillaSelected] = useState<ContratoPlantillaDto | null>(null);
  
  // Estado para el efecto Flash
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Ref para mantener el estado inicial de visibilidad (sticky sort)
  const initialStatusRef = useRef<Record<number, boolean>>({});

  // 2. Modales Hooks
  const createModal = useModal();
  const updatePdfModal = useModal();
  const updateMetaModal = useModal();
  const confirmDialog = useConfirmDialog();

  // Estado del Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success'
  });

  const showMessage = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Auto-filtro desde URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get('proyecto');
    if (proyectoId) setFilterProject(proyectoId);
  }, []);

  // 3. Data Fetching
  const { data: plantillas = [], isLoading, error } = useQuery<ContratoPlantillaDto[]>({
    queryKey: ['adminPlantillas'],
    queryFn: async () => (await ContratoPlantillaService.findAll()).data,
    staleTime: 1000 * 60 * 2 // 2 min cache
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 1000 * 60 * 30 // 30 min cache
  });

  // --- EFECTO PARA CAPTURAR ESTADO INICIAL ---
  useEffect(() => {
    if (plantillas.length > 0) {
      plantillas.forEach(p => {
        if (initialStatusRef.current[p.id] === undefined) {
          initialStatusRef.current[p.id] = p.activo;
        }
      });
    }
  }, [plantillas]);

  // 4. Lógica de Filtrado y Stats (Memoized)
  const filteredPlantillas = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    // 1. Filtrado
    const filtered = plantillas.filter(plantilla => {
      const matchesSearch = plantilla.nombre_archivo.toLowerCase().includes(term);
      const matchesProject = filterProject === 'all' || plantilla.id_proyecto === Number(filterProject);
      return matchesSearch && matchesProject;
    });

    // 2. Ordenamiento "Sticky"
    return filtered.sort((a, b) => {
      // Usamos el estado guardado en el Ref para ordenar
      const statusA = initialStatusRef.current[a.id] ?? a.activo;
      const statusB = initialStatusRef.current[b.id] ?? b.activo;

      if (statusA !== statusB) {
        return statusA ? -1 : 1;
      }
      return a.nombre_archivo.localeCompare(b.nombre_archivo);
    });
  }, [plantillas, searchTerm, filterProject]);

  // 5. Mutaciones y Handlers
  const handleSuccess = (msg: string, modalClose?: () => void) => {
    queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
    if (modalClose) modalClose();
    setPlantillaSelected(null);
    showMessage(msg, 'success');
  };

  const handleError = (err: any) => {
    console.error(err);
    confirmDialog.close();
    const msg = err.response?.data?.message || 'Ocurrió un error inesperado';
    showMessage(msg, 'error');
  };

  const createMutation = useMutation({
    mutationFn: ContratoPlantillaService.create,
    onSuccess: () => handleSuccess('Plantilla creada correctamente.', createModal.close),
    onError: handleError
  });

  const updatePdfMutation = useMutation({
    mutationFn: ContratoPlantillaService.updatePdf,
    onSuccess: () => handleSuccess('PDF actualizado y hash recalculado.', updatePdfModal.close),
    onError: handleError
  });

  const updateMetaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<ContratoPlantillaDto> }) => 
      ContratoPlantillaService.update(id, data),
    onSuccess: () => handleSuccess('Datos actualizados.', updateMetaModal.close),
    onError: handleError
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (plantilla: ContratoPlantillaDto) => 
      ContratoPlantillaService.toggleActive(plantilla.id, !plantilla.activo),
    onSuccess: (_, plantilla) => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      confirmDialog.close();
      
      // Efecto Flash
      setHighlightedId(plantilla.id);
      setTimeout(() => setHighlightedId(null), 2500);
      showMessage(plantilla.activo ? 'Plantilla ocultada' : 'Plantilla activada', 'success');
    },
    onError: handleError
  });

  const softDeleteMutation = useMutation({
    mutationFn: ContratoPlantillaService.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      confirmDialog.close();
      showMessage('Plantilla eliminada (enviada a papelera).', 'success');
    },
    onError: handleError
  });

  // --- HANDLERS ---
  const handleToggleActive = (plantilla: ContratoPlantillaDto) => {
    confirmDialog.confirm('toggle_plantilla_status', plantilla);
  };

  const handleDelete = (plantilla: ContratoPlantillaDto) => {
    confirmDialog.confirm('delete_plantilla', plantilla);
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.data) return;
    
    if (confirmDialog.action === 'toggle_plantilla_status') {
      toggleActiveMutation.mutate(confirmDialog.data);
    }
    else if (confirmDialog.action === 'delete_plantilla') {
      softDeleteMutation.mutate(confirmDialog.data.id);
    }
  };

  // UI Open/Close Handlers
  const handleOpenUpdatePdf = (row: ContratoPlantillaDto) => {
    setPlantillaSelected(row);
    updatePdfModal.open(); 
  };

  const handleOpenUpdateMeta = (row: ContratoPlantillaDto) => {
    setPlantillaSelected(row);
    updateMetaModal.open();
  };

  // 6. Columnas
  const columns = useMemo<DataTableColumn<ContratoPlantillaDto>[]>(() => [
    { id: 'id', label: 'ID', minWidth: 50 },
    { 
      id: 'nombre_archivo', label: 'Nombre / Archivo', minWidth: 250,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600} color={row.activo ? 'text.primary' : 'text.disabled'}>
            {row.nombre_archivo}
          </Typography>
          <Tooltip title={row.hash_archivo_original}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: theme.palette.text.secondary }}>
               {row.hash_archivo_original?.substring(0, 10)}...
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    { 
      id: 'version', label: 'Ver.', align: 'center',
      render: (row) => <Chip label={`v${row.version}`} size="small" variant="outlined" sx={{ borderColor: theme.palette.divider }} />
    },
    { 
      id: 'id_proyecto', label: 'Proyecto', minWidth: 180,
      render: (row) => row.id_proyecto ? (
        <Chip 
          label={proyectos.find(p => p.id === row.id_proyecto)?.nombre_proyecto || `ID: ${row.id_proyecto}`} 
          color="primary" 
          size="small" 
        />
      ) : (
        <Chip label="Global" size="small" variant="outlined" />
      )
    },
    {
      id: 'visibilidad',
      label: 'Estado',
      align: 'center',
      render: (row) => {
        const isProcessingThis = toggleActiveMutation.isPending && confirmDialog.data?.id === row.id;

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessingThis ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Switch
                checked={row.activo}
                onChange={() => handleToggleActive(row)}
                color="success"
                size="small"
                disabled={toggleActiveMutation.isPending || softDeleteMutation.isPending}
              />
            )}
            
            {!isProcessingThis && (
              <Typography 
                variant="caption" 
                color={row.activo ? 'success.main' : 'text.disabled'}
                fontWeight={600}
                sx={{ minWidth: 50 }}
              >
                {row.activo ? 'Activa' : 'Inactiva'}
              </Typography>
            )}
          </Stack>
        );
      }
    },
    {
      id: 'actions', label: 'Acciones', align: 'right', minWidth: 150,
      render: (row) => (
        <Stack direction="row" spacing={0} justifyContent="flex-end">
          <Tooltip title="Editar Datos">
            <IconButton 
              size="small" 
              onClick={() => handleOpenUpdateMeta(row)}
              disabled={toggleActiveMutation.isPending || softDeleteMutation.isPending}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar PDF">
            <IconButton 
              size="small" 
              onClick={() => handleOpenUpdatePdf(row)} 
              disabled={!row.activo || toggleActiveMutation.isPending || softDeleteMutation.isPending} 
              sx={{ color: theme.palette.primary.main }}
            >
              <UploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              size="small" 
              onClick={() => handleDelete(row)} 
              disabled={toggleActiveMutation.isPending || softDeleteMutation.isPending}
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [proyectos, theme, toggleActiveMutation.isPending, softDeleteMutation.isPending, confirmDialog.data]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Gestión de Plantillas" subtitle="Administración de documentos base." />

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        {/* Toolbar */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField 
            placeholder="Buscar..." size="small" value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1 }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>) }}
          />
          <TextField
            select label="Filtrar Proyecto" size="small" value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)} sx={{ minWidth: 220 }}
          >
            <MenuItem value="all"><em>Todos</em></MenuItem>
            {proyectos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
          </TextField>
          <Button variant="contained" startIcon={<AddIcon />} onClick={createModal.open}>Nuevo Contrato</Button>
        </Stack>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable 
          columns={columns} 
          data={filteredPlantillas} 
          getRowKey={(row) => row.id} 
          pagination 
          defaultRowsPerPage={10} 
          getRowSx={(row) => {
            const isHighlighted = highlightedId === row.id;
            return { 
              opacity: row.activo ? 1 : 0.6,
              transition: 'background-color 0.8s ease, opacity 0.3s ease',
              bgcolor: isHighlighted 
                ? (theme) => alpha(theme.palette.success.main, 0.2)
                : row.integrity_compromised 
                  ? theme.palette.error.light 
                  : (row.activo ? 'inherit' : 'action.hover')
            };
          }}
        />
      </QueryHandler>

      {/* Modales */}
      <CreatePlantillaModal 
        open={createModal.isOpen} 
        onClose={createModal.close} 
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }} 
        isLoading={createMutation.isPending} 
        proyectos={proyectos} 
      />
      
      <UpdatePdfModal 
        open={updatePdfModal.isOpen} 
        onClose={() => { updatePdfModal.close(); setPlantillaSelected(null); }} 
        plantilla={plantillaSelected} 
        onSubmit={async (data) => { await updatePdfMutation.mutateAsync(data); }} 
        isLoading={updatePdfMutation.isPending} 
      />

      {plantillaSelected && updateMetaModal.isOpen && (
         <UpdateMetadataModal 
           open={updateMetaModal.isOpen} 
           onClose={() => { updateMetaModal.close(); setPlantillaSelected(null); }} 
           plantilla={plantillaSelected} 
           proyectos={proyectos} 
           onSubmit={async (values) => { await updateMetaMutation.mutateAsync({ id: plantillaSelected.id, data: values }); }} 
           isLoading={updateMetaMutation.isPending} 
         />
      )}

      {/* Modal de Confirmación */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={toggleActiveMutation.isPending || softDeleteMutation.isPending}
      />

      {/* Snackbar Global */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminPlantillas;