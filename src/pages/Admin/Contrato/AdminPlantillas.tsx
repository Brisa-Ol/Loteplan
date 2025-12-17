import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment, Divider,
  ToggleButtonGroup, ToggleButton 
} from '@mui/material';
import { 
  Search, Upload as UploadIcon,
  VerifiedUser, GppBad, Add as AddIcon,
  CheckCircleOutline, Visibility, VisibilityOff,
  FilterList
} from '@mui/icons-material'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { ContratoPlantillaDto, CreatePlantillaDto, UpdatePlantillaPdfDto } from '../../../types/dto/contrato.dto';
import ContratoPlantillaService from '../../../Services/contrato-plantilla.service';
import ProyectoService from '../../../Services/proyecto.service';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn, DataSwitch } from '../../../components/common/DataTable/DataTable'; 

import CreatePlantillaModal from './components/modals/CreatePlantillaModal';
import UpdatePdfModal from './components/modals/UpdatePdfModal';
import { useModal } from '../../../hooks/useModal';

// 🆕 Tipo para el filtro de visibilidad
type VisibilityFilter = 'all' | 'active' | 'inactive';

const AdminPlantillas: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('active');
  
  const createModal = useModal();
  const updateModal = useModal();
  
  const [plantillaToUpdate, setPlantillaToUpdate] = useState<ContratoPlantillaDto | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get('proyecto');
    if (proyectoId) setFilterProject(proyectoId);
  }, []);

  // --- Queries ---
  // 🔄 Siempre traemos TODAS las plantillas para poder filtrar localmente
  const { data: plantillas = [], isLoading, error } = useQuery<ContratoPlantillaDto[]>({
    queryKey: ['adminPlantillas'],
    queryFn: async () => (await ContratoPlantillaService.findAll()).data
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 60000
  });

  const assignedProjectIds = useMemo(() => {
    const ids = new Set<number>();
    plantillas.forEach(p => { if (p.id_proyecto) ids.add(p.id_proyecto); });
    return ids;
  }, [plantillas]);

  // 🆕 Estadísticas para mostrar en badges
  const stats = useMemo(() => {
    const total = plantillas.length;
    const activas = plantillas.filter(p => p.activo).length;
    const inactivas = total - activas;
    return { total, activas, inactivas };
  }, [plantillas]);

  // 🆕 Filtrado mejorado con visibilidad
  const filteredPlantillas = useMemo(() => {
    return plantillas.filter(plantilla => {
      // Filtro de búsqueda
      const term = searchTerm.toLowerCase();
      const matchesSearch = plantilla.nombre_archivo.toLowerCase().includes(term);
      
      // Filtro de proyecto
      let matchesProject = true;
      if (filterProject !== 'all') {
        matchesProject = plantilla.id_proyecto === Number(filterProject);
      }

      // 🆕 Filtro de visibilidad
      let matchesVisibility = true;
      if (visibilityFilter === 'active') {
        matchesVisibility = plantilla.activo === true;
      } else if (visibilityFilter === 'inactive') {
        matchesVisibility = plantilla.activo === false;
      }
      // Si es 'all', no filtramos por estado

      return matchesSearch && matchesProject && matchesVisibility;
    });
  }, [plantillas, searchTerm, filterProject, visibilityFilter]);

  // --- Mutaciones ---
  
  const createMutation = useMutation({
    mutationFn: (data: CreatePlantillaDto) => ContratoPlantillaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      createModal.close(); 
    },
    onError: (err: any) => alert(`Error al crear: ${err.message}`)
  });

  const updatePdfMutation = useMutation({
    mutationFn: (data: UpdatePlantillaPdfDto) => ContratoPlantillaService.updatePdf(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      updateModal.close(); 
      setPlantillaToUpdate(null);
    },
    onError: (err: any) => alert(`Error al actualizar PDF: ${err.message}`)
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (plantilla: ContratoPlantillaDto) => {
      return await ContratoPlantillaService.toggleActive(plantilla.id, !plantilla.activo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
    },
    onError: (err: any) => {
      console.error("Error al cambiar estado:", err);
      alert(`Error al cambiar estado: ${err.response?.data?.message || err.message}`);
    }
  });

  // --- Handlers ---
  const handleOpenUpdate = (plantilla: ContratoPlantillaDto) => {
    setPlantillaToUpdate(plantilla);
    updateModal.open(); 
  };

  const handleCloseUpdate = () => {
    updateModal.close(); 
    setPlantillaToUpdate(null);
  };

  // ========================================================================
  // ⚙️ DEFINICIÓN DE COLUMNAS
  // ========================================================================
  const columns: DataTableColumn<ContratoPlantillaDto>[] = [
    { 
      id: 'id', 
      label: 'ID', 
      minWidth: 50 
    },
    { 
      id: 'nombre_archivo', 
      label: 'Nombre / Archivo', 
      minWidth: 250,
      render: (row) => (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography 
              variant="body2" 
              fontWeight={600} 
              color={row.activo ? 'text.primary' : 'text.disabled'} 
            >
              {row.nombre_archivo}
            </Typography>
            {!row.activo && (
              <Chip 
                label="OCULTA" 
                size="small" 
                color="warning" 
                variant="outlined"
                icon={<VisibilityOff sx={{ fontSize: 14 }} />}
              />
            )}
          </Stack>
          <Tooltip title={row.url_archivo}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                maxWidth: 300, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}
            >
              {row.url_archivo}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    { 
      id: 'version', 
      label: 'Versión', 
      render: (row) => (
        <Chip 
          label={`v${row.version}`} 
          size="small" 
          variant="outlined" 
          color={row.activo ? 'default' : 'warning'}
        />
      )
    },
    { 
      id: 'id_proyecto', 
      label: 'Proyecto Asignado', 
      minWidth: 200,
      render: (row) => (
        row.id_proyecto ? (
          <Chip 
            label={proyectos.find(p => p.id === row.id_proyecto)?.nombre_proyecto || `ID Proyecto: ${row.id_proyecto}`} 
            color="primary" 
            size="small" 
            variant="filled" 
            sx={{ fontWeight: 500, opacity: row.activo ? 1 : 0.6 }}
          />
        ) : (
          <Chip 
            label="General / Global" 
            color="default" 
            size="small" 
            variant="outlined" 
            sx={{ opacity: row.activo ? 1 : 0.6 }}
          />
        )
      )
    },
    {
      id: 'activo', 
      label: 'Estado',
      minWidth: 180,
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <DataSwitch 
            active={!!row.activo} 
            onChange={() => toggleVisibilityMutation.mutate(row)}
            activeLabel="Visible"
            inactiveLabel="Oculto"
            disabled={toggleVisibilityMutation.isPending}
          />
          {!row.activo && (
            <Typography variant="caption" color="warning.main" fontWeight="bold">
              No disponible
            </Typography>
          )}
        </Stack>
      )
    },
    { 
      id: 'integrity_compromised', 
      label: 'Integridad', 
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          {row.integrity_compromised ? (
            <Tooltip title="PELIGRO: El hash del archivo no coincide.">
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={0.5} 
                sx={{ 
                  color: 'error.main', 
                  bgcolor: 'error.lighter', 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1 
                }}
              >
                <GppBad fontSize="small" />
                <Typography variant="caption" fontWeight="bold">Comprometido</Typography>
              </Stack>
            </Tooltip>
          ) : (
            <Tooltip title="Hash Verificado: Integridad Correcta">
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'success.main' }}>
                <VerifiedUser fontSize="small" />
                <Typography variant="caption">Verificado</Typography>
              </Stack>
            </Tooltip>
          )}
        </Stack>
      )
    },
    {
      id: 'actions', 
      label: 'Acciones', 
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Actualizar PDF (Nueva Versión)">
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => handleOpenUpdate(row)}
              disabled={!row.activo}
            >
              <UploadIcon />
            </IconButton>
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
      
      {/* 🆕 Barra de Estadísticas */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 2, 
          display: 'flex', 
          gap: 3, 
          alignItems: 'center',
          borderRadius: 2,
          bgcolor: 'primary.lighter'
        }} 
        elevation={0}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterList color="primary" />
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            Estadísticas:
          </Typography>
        </Stack>
        <Chip 
          label={`Total: ${stats.total}`} 
          color="default" 
          size="small" 
        />
        <Chip 
          icon={<Visibility />}
          label={`Activas: ${stats.activas}`} 
          color="success" 
          size="small" 
        />
        <Chip 
          icon={<VisibilityOff />}
          label={`Ocultas: ${stats.inactivas}`} 
          color="warning" 
          size="small" 
        />
      </Paper>
      
      {/* Toolbar de Filtros */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          alignItems: 'center', 
          borderRadius: 2 
        }} 
        elevation={0} 
        variant="outlined"
      >
        <TextField 
          placeholder="Buscar plantilla..." 
          size="small" 
          sx={{ flexGrow: 1, minWidth: 250 }}
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ 
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ) 
          }}
        />

        {/* 🆕 Toggle de Visibilidad */}
        <ToggleButtonGroup
          value={visibilityFilter}
          exclusive
          onChange={(_, newValue) => {
            if (newValue !== null) setVisibilityFilter(newValue);
          }}
          size="small"
          color="primary"
        >
          <ToggleButton value="active">
            <Visibility sx={{ mr: 1, fontSize: 18 }} />
            Solo Activas ({stats.activas})
          </ToggleButton>
          <ToggleButton value="all">
            Todas ({stats.total})
          </ToggleButton>
          <ToggleButton value="inactive">
            <VisibilityOff sx={{ mr: 1, fontSize: 18 }} />
            Solo Ocultas ({stats.inactivas})
          </ToggleButton>
        </ToggleButtonGroup>
        
        <TextField
          select 
          label="Filtrar por Proyecto" 
          size="small" 
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)} 
          sx={{ minWidth: 300 }}
        >
          <MenuItem value="all"><em>Todos los Proyectos</em></MenuItem>
          <Divider />
          {proyectos.map(p => {
            const tienePlantilla = assignedProjectIds.has(p.id);
            return (
              <MenuItem 
                key={p.id} 
                value={p.id} 
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <Typography variant="body2">{p.nombre_proyecto}</Typography>
                {tienePlantilla && (
                  <Chip 
                    icon={<CheckCircleOutline style={{ fontSize: 14 }} />} 
                    label="Asignado" 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                    sx={{ height: 20, fontSize: '0.7rem' }} 
                  />
                )}
              </MenuItem>
            );
          })}
        </TextField>

        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          color="primary" 
          onClick={createModal.open}
        >
          Nueva Plantilla
        </Button>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
          columns={columns}
          data={filteredPlantillas}
          getRowKey={(row) => row.id}
          getRowSx={(row) => ({
            opacity: row.activo ? 1 : 0.6,
            bgcolor: row.integrity_compromised 
              ? 'error.lighter' 
              : (row.activo ? 'inherit' : 'action.hover'),
            borderLeft: !row.activo ? '4px solid' : 'none',
            borderLeftColor: 'warning.main',
            transition: 'all 0.3s ease'
          })}
          emptyMessage={
            visibilityFilter === 'inactive' 
              ? "No hay plantillas ocultas. Todas están activas." 
              : "No se encontraron plantillas para este filtro."
          }
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modales */}
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