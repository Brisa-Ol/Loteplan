import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Stack, Tooltip, 
  TextField, InputAdornment, MenuItem 
} from '@mui/material';
import { 
  Add, Delete, PlayArrow, Search, Edit,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon 
} from '@mui/icons-material';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProyectoService from '../../../Services/proyecto.service';
import type { CreateProyectoDto, ProyectoDto, UpdateProyectoDto } from '../../../types/dto/proyecto.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import CreateProyectoModal from './modals/CreateProyectoModal';
import ConfigCuotasModal from './modals/ConfigCuotasModal';
import EditProyectoModal from './modals/EditProyectoModal';
import ProjectLotesModal from './modals/ProjectLotesModal';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// Modales


// Tipo para el filtro
type TipoInversionFilter = 'all' | 'mensual' | 'directo';

const AdminProyectos: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Estados de modales
  const [isModalOpen, setModalOpen] = useState(false);
  const [cuotasModalOpen, setCuotasModalOpen] = useState(false);
  const [lotesModalOpen, setLotesModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false); // Nuevo estado para edición
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');

  // 1. Cargar Proyectos
  const { data: proyectos, isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  // 2. Mutación: Crear Proyecto
  const createMutation = useMutation({
    mutationFn: (data: CreateProyectoDto) => ProyectoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      setModalOpen(false);
      alert('Proyecto creado correctamente');
    },
    onError: (err: any) => alert(`Error: ${err.response?.data?.error || err.message}`)
  });

  // 3. Mutación: Iniciar Proceso
  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      alert('Proyecto iniciado. Cobros activados.');
    }
  });

  // 4. Mutación: Eliminar (Soft Delete)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProyectos'] })
  });

  // 5. Mutación: Editar Proyecto (Nueva)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) => ProyectoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      setEditModalOpen(false);
      alert('Proyecto actualizado correctamente');
    },
    onError: (err: any) => alert(`Error al editar: ${err.response?.data?.error || err.message}`)
  });

  // Helpers
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'En proceso': return 'success';
      case 'Finalizado': return 'default';
      default: return 'warning';
    }
  };
  
  // 6. Filtrado Combinado
  const filteredProyectos = useMemo(() => {
    if (!proyectos) return [];
    
    const term = searchTerm.toLowerCase();
    
    return proyectos.filter(p => {
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(term);
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });
  }, [proyectos, searchTerm, filterTipo]);

  // Handlers
  const handleVerLotes = (proyecto: ProyectoDto) => {
    setSelectedProject(proyecto);
    setLotesModalOpen(true);
  };

  const handleConfigCuotas = (proyecto: ProyectoDto) => {
    setSelectedProject(proyecto);
    setCuotasModalOpen(true);
  };

  const handleEdit = (proyecto: ProyectoDto) => {
    setSelectedProject(proyecto);
    setEditModalOpen(true);
  };

  return (
    <PageContainer maxWidth="xl">
     
      <PageHeader
              title="Gestión de Proyectos"
              subtitle=" Administra el catálogo de inversiones y sus estados."
            />
      {/* Barra de Herramientas */}
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
        {/* Filtro por Nombre */}
        <TextField 
          placeholder="Buscar por nombre de proyecto..." 
          size="small" 
          sx={{ flexGrow: 1, minWidth: 200 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ 
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ) 
          }}
        />

        {/* Filtro por Tipo */}
        <TextField
          select
          label="Filtrar por tipo"
          size="small"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value as TipoInversionFilter)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="directo">Directo</MenuItem>
          <MenuItem value="mensual">Ahorro (Mensual)</MenuItem>
        </TextField>
        
        {/* Botón Nuevo Proyecto */}
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => setModalOpen(true)}
          size="medium"
        >
          Nuevo Proyecto
        </Button>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <TableContainer 
          component={Paper} 
          sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} 
          elevation={0}
        >
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Finanzas</strong></TableCell>
                <TableCell><strong>Progreso</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProyectos.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {p.nombre_proyecto}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {p.id}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={p.tipo_inversion === 'mensual' ? 'Ahorro' : 'Directo'} 
                      size="small"
                      color={p.tipo_inversion === 'mensual' ? 'primary' : 'default'} 
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={p.estado_proyecto} 
                      size="small" 
                      color={getStatusColor(p.estado_proyecto) as any}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {p.moneda} {Number(p.monto_inversion).toLocaleString()}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {p.tipo_inversion === 'mensual' 
                      ? <Typography variant="body2">
                          {p.suscripciones_actuales} / {p.obj_suscripciones} Subs
                        </Typography>
                      : <Typography variant="body2">
                          {p.lotes?.length || 0} Lotes
                        </Typography>
                    }
                  </TableCell>
                  
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      
                      {/* Botón: Configurar Cuota (Solo Mensual) */}
                      {p.tipo_inversion === 'mensual' && (
                        <Tooltip title="Configurar Cuota Mensual">
                          <IconButton 
                            sx={{ color: "#E07A4D" }} 
                            onClick={() => handleConfigCuotas(p)}
                          >
                            <MonetizationOnIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Botón: Iniciar Proceso (ICONO VERDE) */}
                      {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
                        <Tooltip title="Iniciar Proceso (Activar Cobros)">
                          <IconButton 
                            color="success" 
                            onClick={() => {
                              if(confirm('¿Iniciar conteo de meses? Esto activará los cobros.')) {
                                startMutation.mutate(p.id);
                              }
                            }}
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* --- NUEVO BOTÓN EDITAR (PENCIL) --- */}
                      {/* Colocado entre el verde y el ojito */}
                      <Tooltip title="Editar Proyecto">
                        <IconButton 
                          color="primary"
                          onClick={() => handleEdit(p)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      {/* Botón: Ver Lotes (ICONO OJITO) */}
                      <Tooltip title="Ver Lotes / Asignar">
                        <IconButton 
                          color="info"
                          onClick={() => handleVerLotes(p)}
                        >
                          <VisibilityIcon sx={{ color:"#333333" }} />
                        </IconButton>
                      </Tooltip>

                      {/* Botón: Eliminar */}
                      <Tooltip title="Eliminar">
                        <IconButton 
                          color="error" 
                          onClick={() => {
                            if(confirm('¿Eliminar proyecto?')) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                      
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredProyectos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">
                      {isLoading 
                        ? 'Cargando proyectos...' 
                        : 'No hay proyectos registrados que coincidan con los filtros aplicados.'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      {/* MODALES */}
      <CreateProyectoModal 
        open={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={async (data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <ConfigCuotasModal
        open={cuotasModalOpen}
        onClose={() => {
          setCuotasModalOpen(false);
          setSelectedProject(null);
        }}
        proyecto={selectedProject}
      />

      {/* --- NUEVO MODAL DE EDICIÓN --- */}
      <EditProyectoModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProject(null);
        }}
        proyecto={selectedProject}
        onSubmit={async (id, data) => updateMutation.mutate({ id, data })}
        isLoading={updateMutation.isPending}
      />

      <ProjectLotesModal
        open={lotesModalOpen}
        onClose={() => {
          setLotesModalOpen(false);
          setSelectedProject(null);
        }}
        proyecto={selectedProject}
      />
    </PageContainer>
  );
};

export default AdminProyectos;