import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment, Divider, useTheme
} from '@mui/material';
import { 
  Search, Upload as UploadIcon, Add as AddIcon,
  Edit as EditIcon, Delete as DeleteIcon, 
  FilterList, 
} from '@mui/icons-material'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';

// --- DTOs y Servicios ---
import type { ContratoPlantillaDto, CreatePlantillaDto, UpdatePlantillaPdfDto } from '../../../types/dto/contrato.dto';
import ContratoPlantillaService from '../../../Services/contrato-plantilla.service';
import ProyectoService from '../../../Services/proyecto.service';

// --- Componentes Comunes ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable'; // Ensure DataSwitch is exported from here or adjust import
import { useModal } from '../../../hooks/useModal';

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

  // 2. Modales Hooks
  const createModal = useModal();
  const updatePdfModal = useModal();
  const updateMetaModal = useModal();

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

  // 4. Lógica de Filtrado y Stats (Memoized)
  const assignedProjectIds = useMemo(() => {
    const ids = new Set<number>();
    plantillas.forEach(p => { if (p.id_proyecto && p.activo) ids.add(p.id_proyecto); });
    return ids;
  }, [plantillas]);

  const stats = useMemo(() => {
    const total = plantillas.length;
    const activas = plantillas.filter(p => p.activo).length;
    const inactivas = total - activas;
    const comprometidas = plantillas.filter(p => p.integrity_compromised).length;
    return { total, activas, inactivas, comprometidas };
  }, [plantillas]);

  const filteredPlantillas = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return plantillas.filter(plantilla => {
      const matchesSearch = plantilla.nombre_archivo.toLowerCase().includes(term);
      const matchesProject = filterProject === 'all' || plantilla.id_proyecto === Number(filterProject);
      return matchesSearch && matchesProject;
    });
  }, [plantillas, searchTerm, filterProject]);

  // 5. Mutaciones y Handlers
  const handleSuccess = (msg: string, modalClose?: () => void) => {
    queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
    if (modalClose) modalClose();
    setPlantillaSelected(null);
    Swal.fire({
      title: '¡Éxito!',
      text: msg,
      icon: 'success',
      confirmButtonColor: theme.palette.primary.main
    });
  };

  const handleError = (err: any) => {
    console.error(err);
    Swal.fire({
      title: 'Error',
      text: err.response?.data?.message || 'Ocurrió un error inesperado',
      icon: 'error',
      confirmButtonColor: theme.palette.error.main
    });
  };

  const createMutation = useMutation({
    mutationFn: ContratoPlantillaService.create,
    onSuccess: () => handleSuccess('Plantilla creada.', createModal.close),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] }),
    onError: handleError
  });

  const softDeleteMutation = useMutation({
    mutationFn: ContratoPlantillaService.softDelete,
    onSuccess: () => handleSuccess('Plantilla eliminada (papelera).'),
    onError: handleError
  });

  // UI Open/Close Handlers
  const handleOpenUpdatePdf = (row: ContratoPlantillaDto) => {
    setPlantillaSelected(row);
    updatePdfModal.open(); 
  };

  const handleOpenUpdateMeta = (row: ContratoPlantillaDto) => {
    setPlantillaSelected(row);
    updateMetaModal.open();
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "La plantilla dejará de estar disponible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme.palette.error.main,
      cancelButtonColor: theme.palette.grey[500],
      confirmButtonText: 'Sí, eliminar'
    }).then((res) => { if (res.isConfirmed) softDeleteMutation.mutate(id); });
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
      id: 'actions', label: 'Acciones', align: 'right', minWidth: 150,
      render: (row) => (
        <Stack direction="row" spacing={0} justifyContent="flex-end">
          <Tooltip title="Editar Datos">
            <IconButton size="small" onClick={() => handleOpenUpdateMeta(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar PDF">
            <IconButton size="small" onClick={() => handleOpenUpdatePdf(row)} disabled={!row.activo} sx={{ color: theme.palette.primary.main }}>
              <UploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ color: theme.palette.error.main }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [proyectos, theme]);

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
        <DataTable columns={columns} data={filteredPlantillas} getRowKey={(row) => row.id} pagination defaultRowsPerPage={10} 
          getRowSx={(row) => ({ 
            opacity: row.activo ? 1 : 0.6, 
            backgroundColor: row.integrity_compromised ? theme.palette.error.light : undefined 
          })}
        />
      </QueryHandler>

      {/* Modales */}
      <CreatePlantillaModal 
        open={createModal.isOpen} 
        onClose={createModal.close} 
        // ✅ Corregido: usamos llaves para que la función sea void
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
    </PageContainer>
  );
};

export default AdminPlantillas;