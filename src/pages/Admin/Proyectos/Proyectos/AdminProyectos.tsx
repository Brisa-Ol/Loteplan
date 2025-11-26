import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Stack, Tooltip, useTheme, 
  TextField, InputAdornment, MenuItem // 🆕 Importar MenuItem
} from '@mui/material';
import { Add, Delete, PlayArrow, Link as LinkIcon, Search } from '@mui/icons-material';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import ProyectoService from '../../../../Services/proyecto.service';
import type { CreateProyectoDto } from '../../../../types/dto/proyecto.dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CreateProyectoModal from '../modals/CreateProyectoModal';
  import VisibilityIcon from '@mui/icons-material/Visibility';

// Definimos el tipo para el filtro para mayor claridad
type TipoInversionFilter = 'all' | 'mensual' | 'directo';

const AdminProyectos: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  // 🆕 Estado para el filtro de tipo de inversión
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');

  // 1. Cargar Proyectos
  const { data: proyectos, isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  // 2. Mutaciones (omitiendo por brevedad)
  const createMutation = useMutation({
    mutationFn: (data: CreateProyectoDto) => ProyectoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      setModalOpen(false);
      alert('Proyecto creado correctamente');
    },
    onError: (err: any) => alert(`Error: ${err.response?.data?.error || err.message}`)
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      alert('Proyecto iniciado. Cobros activados.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProyectos'] })
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'En proceso': return 'success';
      case 'Finalizado': return 'default';
      default: return 'warning';
    }
  };
  
  // 3. Lógica de Filtrado Combinada (useMemo)
  const filteredProyectos = useMemo(() => {
    if (!proyectos) return [];
    
    const term = searchTerm.toLowerCase();
    
    return proyectos.filter(p => {
      // Filtro por nombre
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(term);

      // 🆕 Filtro por tipo
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;

      return matchesSearch && matchesType;
    });
  }, [proyectos, searchTerm, filterTipo]);


  return (
    <PageContainer maxWidth="xl">
        {/* Encabezado */}
              <Box textAlign="center" mb={5}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">Gestión de Proyectos</Typography>
                <Typography color="text.secondary">Administra el catálogo de inversiones y sus estados.</Typography>
              </Box>
              
      {/* Barra de Herramientas (Filtros + Botón Crear) */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        
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

        {/* 🆕 Filtro por Tipo de Inversión (Select) */}
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
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
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
                    <Typography variant="subtitle2" fontWeight={600}>{p.nombre_proyecto}</Typography>
                    <Typography variant="caption" color="text.primary.dark">ID: {p.id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={p.tipo_inversion === 'mensual' ? 'Ahorro' : 'Directo'} 
                      size="small" 
                      color={p.tipo_inversion === 'mensual' ? 'primary' : 'secondary'} 
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
                      ? <Typography variant="body2">{p.suscripciones_actuales} / {p.obj_suscripciones} Subs</Typography>
                      : <Typography variant="body2">{p.lotes?.length || 0} Lotes</Typography>
                    }
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      
                      {/* Botón Iniciar Proceso (Solo Ahorro Pendiente) */}
                      {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
                        <Tooltip title="Iniciar Proceso (Activar Cobros)">
                          <IconButton 
                            color="success" 
                            onClick={() => {
                               if(confirm('¿Iniciar conteo de meses? Esto activará los cobros.')) startMutation.mutate(p.id);
                            }}
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Ver Lotes / Asignar">
                        <IconButton color="info">
  
                          <VisibilityIcon 
/>
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <IconButton 
                          color="error" 
                          onClick={() => {
                             if(confirm('¿Eliminar proyecto?')) deleteMutation.mutate(p.id);
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
                        {isLoading ? 'Cargando proyectos...' : 'No hay proyectos registrados que coincidan con los filtros aplicados.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      <CreateProyectoModal 
        open={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={async (data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </PageContainer>
  );
};

export default AdminProyectos;