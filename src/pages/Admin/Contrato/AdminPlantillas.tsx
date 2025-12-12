import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment, Divider 
} from '@mui/material';
import { 
  Search, Upload as UploadIcon, Delete as DeleteIcon,
  VerifiedUser, GppBad, Add as AddIcon,
  CheckCircleOutline
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Tipos y Servicios
import type { ContratoPlantillaDto, CreatePlantillaDto, UpdatePlantillaPdfDto } from '../../../types/dto/contrato.dto';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// 👇 Importamos TU componente genérico
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable'; 

// Modales
import CreatePlantillaModal from './components/modals/CreatePlantillaModal';
import UpdatePdfModal from './components/modals/UpdatePdfModal';
import ContratoPlantillaService from '../../../Services/contrato-plantilla.service';
import ProyectoService from '../../../Services/proyecto.service';

// ✅ 1. Importamos el hook
import { useModal } from '../../../hooks/useModal';

const AdminPlantillas: React.FC = () => {
  const queryClient = useQueryClient();
  
  // --- Estados ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  
  // ✅ 2. Hooks para Modales
  const createModal = useModal();
  const updateModal = useModal();
  
  // Estado para Datos (separado de visibilidad)
  const [plantillaToUpdate, setPlantillaToUpdate] = useState<ContratoPlantillaDto | null>(null);

  // Efecto para capturar el ID del proyecto desde la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get('proyecto');
    if (proyectoId) setFilterProject(proyectoId);
  }, []);

  // --- Queries ---
  const { data: plantillas = [], isLoading, error } = useQuery<ContratoPlantillaDto[]>({
    queryKey: ['adminPlantillas'],
    queryFn: async () => (await ContratoPlantillaService.findAll()).data
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 60000
  });

  // Lógica Visual: Identificar proyectos asignados
  const assignedProjectIds = useMemo(() => {
    const ids = new Set<number>();
    plantillas.forEach(p => { if (p.id_proyecto) ids.add(p.id_proyecto); });
    return ids;
  }, [plantillas]);

  // Filtrado
  const filteredPlantillas = useMemo(() => {
    return plantillas.filter(plantilla => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = plantilla.nombre_archivo.toLowerCase().includes(term);
      
      let matchesProject = true;
      if (filterProject !== 'all') {
        matchesProject = plantilla.id_proyecto === Number(filterProject);
      }

      return matchesSearch && matchesProject;
    });
  }, [plantillas, searchTerm, filterProject]);

  // --- Mutaciones ---
  const createMutation = useMutation({
    mutationFn: (data: CreatePlantillaDto) => ContratoPlantillaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      createModal.close(); // ✅
    },
    onError: (err: any) => alert(`Error al crear: ${err.message}`)
  });

  const updatePdfMutation = useMutation({
    mutationFn: (data: UpdatePlantillaPdfDto) => ContratoPlantillaService.updatePdf(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      updateModal.close(); // ✅
      setPlantillaToUpdate(null);
    },
    onError: (err: any) => alert(`Error al actualizar PDF: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ContratoPlantillaService.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] })
  });

  // --- Handlers ---
  const handleOpenUpdate = (plantilla: ContratoPlantillaDto) => {
    setPlantillaToUpdate(plantilla);
    updateModal.open(); // ✅
  };

  const handleCloseUpdate = () => {
    updateModal.close(); // ✅
    setPlantillaToUpdate(null);
  };

  // ========================================================================
  // ⚙️ DEFINICIÓN DE COLUMNAS PARA EL DATATABLE
  // ========================================================================
  const columns: DataTableColumn<ContratoPlantillaDto>[] = [
    { 
      id: 'id', label: 'ID', minWidth: 50 
    },
    { 
      id: 'nombre_archivo', label: 'Nombre / Archivo', minWidth: 250,
      render: (row) => (
        <Box>
            <Typography variant="body2" fontWeight={600}>{row.nombre_archivo}</Typography>
            <Tooltip title={row.url_archivo}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.url_archivo}
                </Typography>
            </Tooltip>
        </Box>
      )
    },
    { 
      id: 'version', label: 'Versión', 
      render: (row) => <Chip label={`v${row.version}`} size="small" variant="outlined" /> 
    },
    { 
      id: 'id_proyecto', label: 'Proyecto Asignado', minWidth: 200,
      render: (row) => (
        row.id_proyecto ? (
            <Chip 
              label={proyectos.find(p => p.id === row.id_proyecto)?.nombre_proyecto || `ID Proyecto: ${row.id_proyecto}`} 
              color="primary" size="small" variant="filled" sx={{ fontWeight: 500 }}
            />
          ) : (
            <Chip label="General / Global" color="default" size="small" variant="outlined" />
          )
      )
    },
    { 
      id: 'integrity_compromised', label: 'Integridad', 
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            {row.integrity_compromised ? (
                <Tooltip title="PELIGRO: El hash del archivo no coincide.">
                    <IconButton size="small" color="error"><GppBad /></IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="Hash Verificado: Integridad Correcta">
                    <VerifiedUser color="success" fontSize="small" />
                </Tooltip>
            )}
        </Stack>
      )
    },
    {
      id: 'actions', label: 'Acciones', align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Actualizar PDF">
                <IconButton size="small" color="primary" onClick={() => handleOpenUpdate(row)}><UploadIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
                <IconButton size="small" color="error" onClick={() => { if(window.confirm('¿Borrar?')) deleteMutation.mutate(row.id); }}><DeleteIcon /></IconButton>
            </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
         title="Gestión de Plantillas"
         subtitle="Administra los documentos base (PDFs) para la firma de contratos."
      />
      
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        <TextField 
          placeholder="Buscar plantilla..." size="small" sx={{ flexGrow: 1, minWidth: 250 }}
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
        />
        
        <TextField
          select label="Filtrar por Proyecto" size="small" value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)} sx={{ minWidth: 300 }}
        >
          <MenuItem value="all"><em>Todos los Proyectos</em></MenuItem>
          <Divider />
          {proyectos.map(p => {
             const tienePlantilla = assignedProjectIds.has(p.id);
             return (
               <MenuItem key={p.id} value={p.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{p.nombre_proyecto}</Typography>
                  {tienePlantilla && (
                    <Chip icon={<CheckCircleOutline style={{ fontSize: 14 }} />} label="Asignado" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                  )}
               </MenuItem>
             );
          })}
        </TextField>

        <Button variant="contained" startIcon={<AddIcon />} color="primary" onClick={createModal.open}>
          Nueva Plantilla
        </Button>
      </Paper>

      {/* ✅ USO DEL COMPONENTE DATATABLE */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
            columns={columns}
            data={filteredPlantillas}
            getRowKey={(row) => row.id}
            emptyMessage="No se encontraron plantillas para este filtro."
            pagination={true}
            defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modales con Hook */}
      <CreatePlantillaModal 
        open={createModal.isOpen} 
        onClose={createModal.close}
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
        isLoading={createMutation.isPending}
      />
      <UpdatePdfModal 
        open={updateModal.isOpen} 
        plantilla={plantillaToUpdate} 
        onClose={handleCloseUpdate}
        onSubmit={async (data) => { await updatePdfMutation.mutateAsync(data); }}
        isLoading={updatePdfMutation.isPending}
      />
    </PageContainer>
  );
};

export default AdminPlantillas;