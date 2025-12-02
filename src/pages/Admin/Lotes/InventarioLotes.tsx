import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Stack, Tooltip, TextField, MenuItem, Divider, InputAdornment 
} from '@mui/material';
import { 
  Add, Edit, Delete, PlayCircleFilled, StopCircle, Warning, Collections, 
  Search, Inventory, Gavel, AssignmentLate, CheckCircle 
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

// Tipos
import type { CreateLoteDto, LoteDto, UpdateLoteDto } from '../../../types/dto/lote.dto';
import LoteService from '../../../Services/lote.service';
import ProyectoService from '../../../Services/proyecto.service';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// Modales
import ManageLoteImagesModal from './modals/ManageLoteImagesModal';
import CreateEditLoteModal from './modals/CreateEditLoteModal';

// Interfaces Auxiliares
interface ApiErrorResponse {
  mensaje?: string;
  message?: string;
  error?: string;
}

// --- COMPONENTE DE TARJETA KPI ---
const MiniStatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
    <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 1, borderRadius: '50%', display: 'flex' }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" fontWeight="bold">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
    </Box>
  </Paper>
);

const InventarioLotes: React.FC = () => {
  const queryClient = useQueryClient();
  
  // --- ESTADOS ---
  const [modalOpen, setModalOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');

  // --- QUERIES ---
  
  // 1. Cargar Lotes
  const { data: lotes = [], isLoading: loadingLotes, error } = useQuery({
    queryKey: ['adminLotes'],
    queryFn: async () => (await LoteService.findAllAdmin()).data,
    retry: 1,
    staleTime: 30000,
  });

  // 2. Cargar Proyectos (Para el filtro y para mostrar el nombre en la tabla)
  const { data: proyectos = [], isLoading: loadingProyectos } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    retry: 1,
    staleTime: 60000,
  });

  // --- KPIS (Estadísticas calculadas) ---
  const stats = useMemo(() => ({
    total: lotes.length,
    enSubasta: lotes.filter(l => l.estado_subasta === 'activa').length,
    finalizados: lotes.filter(l => l.estado_subasta === 'finalizada').length,
    huerfanos: lotes.filter(l => !l.id_proyecto).length
  }), [lotes]);

  // --- FILTRADO COMBINADO ---
  const filteredLotes = useMemo(() => {
    return lotes.filter(lote => {
      // 1. Filtro por Texto (Nombre o ID)
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        lote.nombre_lote.toLowerCase().includes(term) ||
        lote.id.toString().includes(term);

      // 2. Filtro por Proyecto
      let matchesProject = true;
      if (filterProject === 'huerfano') {
        matchesProject = !lote.id_proyecto;
      } else if (filterProject !== 'all') {
        matchesProject = lote.id_proyecto === Number(filterProject);
      }

      return matchesSearch && matchesProject;
    });
  }, [lotes, searchTerm, filterProject]);

  // --- HELPER DE ERROR ---
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      return axiosError.response?.data?.mensaje 
        || axiosError.response?.data?.message 
        || axiosError.response?.data?.error
        || axiosError.message 
        || 'Error desconocido';
    }
    return String(error);
  };

  // --- MUTACIONES ---
  const saveMutation = useMutation({
    mutationFn: async (payload: { dto: CreateLoteDto | UpdateLoteDto; id?: number }) => {
      if (payload.id) {
        return await LoteService.update(payload.id, payload.dto as UpdateLoteDto);
      }
      return await LoteService.create(payload.dto as CreateLoteDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      setModalOpen(false);
      setSelectedLote(null);
    },
    onError: (error: unknown) => alert(`❌ Error al guardar: ${getErrorMessage(error)}`)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await LoteService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminLotes'] }),
    onError: (error: unknown) => alert(`❌ Error al eliminar: ${getErrorMessage(error)}`)
  });

  const startAuction = useMutation({
    mutationFn: (id: number) => LoteService.startAuction(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      const data = response.data as any; 
      alert(`✅ ${data?.mensaje || 'Subasta iniciada'}`);
    },
    onError: (error: unknown) => alert(`❌ Error: ${getErrorMessage(error)}`)
  });

  const endAuction = useMutation({
    mutationFn: (id: number) => LoteService.endAuction(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['adminLotes'] });
      const data = response.data as any;
      alert(`🏁 ${data?.mensaje || 'Subasta finalizada'}`);
    },
    onError: (error: unknown) => alert(`❌ Error: ${getErrorMessage(error)}`)
  });

  // Helpers visuales
  const getStatusColor = (estado: string): 'success' | 'info' | 'default' => {
    if (estado === 'activa') return 'success';
    if (estado === 'finalizada') return 'info';
    return 'default';
  };

  return (
    <PageContainer maxWidth="xl">
      
      {/* 1. Encabezado Centrado */}
      <Box textAlign="center" mb={5}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">Gestión de Lotes</Typography>
        <Typography color="text.secondary">Inventario, asignación de proyectos y control de subastas.</Typography>
      </Box>

      {/* 2. KPIs */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
        <Box flex={1}><MiniStatCard title="Total Lotes" value={stats.total} icon={<Inventory />} color="primary" /></Box>
        <Box flex={1}><MiniStatCard title="En Subasta" value={stats.enSubasta} icon={<Gavel />} color="success" /></Box>
        <Box flex={1}><MiniStatCard title="Finalizados" value={stats.finalizados} icon={<CheckCircle />} color="info" /></Box>
        <Box flex={1}><MiniStatCard title="Huérfanos" value={stats.huerfanos} icon={<AssignmentLate />} color="warning" /></Box>
      </Stack>

      {/* 3. Barra de Herramientas */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        
        {/* Búsqueda por Texto */}
        <TextField 
          placeholder="Buscar por nombre o ID..." 
          size="small" 
          sx={{ flexGrow: 1, minWidth: 250 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
        
        {/* Filtro Dropdown (Proyectos) */}
        <TextField
          select
          label="Filtrar por Proyecto"
          size="small"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          sx={{ minWidth: 200 }}
          disabled={loadingProyectos}
        >
          <MenuItem value="all">Todos los Lotes</MenuItem>
          <MenuItem value="huerfano" sx={{ color: 'warning.main' }}>⚠️ Sin Proyecto</MenuItem>
          <Divider />
          {proyectos.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
          ))}
        </TextField>

        {/* Botón Nuevo */}
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          color="primary"
          onClick={() => { setSelectedLote(null); setModalOpen(true); }}
        >
          Nuevo Lote
        </Button>
      </Paper>

      {/* 4. Tabla */}
      <QueryHandler isLoading={loadingLotes} error={error as Error}>
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Lote</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Proyecto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Precio Base</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Ganador</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Subasta</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLotes.map((lote) => (
                <TableRow key={lote.id} hover>
                  <TableCell>
                    <Typography fontWeight="bold" variant="body2">{lote.nombre_lote}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {lote.id}</Typography>
                  </TableCell>
                  
                  {/* ✅ COLUMNA PROYECTO CORREGIDA */}
                  <TableCell>
                    {lote.id_proyecto ? (
                      // Buscamos el nombre del proyecto en el array 'proyectos'
                      <Chip 
                        label={proyectos.find(p => p.id === lote.id_proyecto)?.nombre_proyecto || `Proy. ${lote.id_proyecto}`} 
                        size="small" 
                        variant="outlined" 
                        color="primary" // Opcional: darle color al proyecto
                      />
                    ) : (
                      <Chip label="Huérfano" size="small" color="warning" />
                    )}
                  </TableCell>

                  <TableCell>${Number(lote.precio_base).toLocaleString('es-AR')}</TableCell>

                  <TableCell>
                    <Chip 
                      label={lote.estado_subasta.toUpperCase()} 
                      color={getStatusColor(lote.estado_subasta)} 
                      size="small" 
                    />
                  </TableCell>
                  
                  <TableCell>
                    {lote.id_ganador ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip label={`ID: ${lote.id_ganador}`} size="small" color="success" variant="outlined"/>
                        {lote.intentos_fallidos_pago > 0 && (
                          <Tooltip title={`${lote.intentos_fallidos_pago} intentos fallidos`}>
                            <Warning fontSize="small" color="error" />
                          </Tooltip>
                        )}
                      </Stack>
                    ) : '-'}
                  </TableCell>

                  <TableCell align="right">
                    {lote.estado_subasta === 'pendiente' && lote.id_proyecto && (
                      <Tooltip title="Iniciar Subasta">
                        <IconButton 
                          color="success" 
                          onClick={() => { if (confirm('¿Iniciar subasta?')) startAuction.mutate(lote.id); }}
                        >
                          <PlayCircleFilled />
                        </IconButton>
                      </Tooltip>
                    )}
                    {lote.estado_subasta === 'activa' && (
                      <Tooltip title="Finalizar Subasta">
                        <IconButton 
                          color="error" 
                          onClick={() => { if (confirm('¿Finalizar subasta?')) endAuction.mutate(lote.id); }}
                        >
                          <StopCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end">
                      <Tooltip title="Imágenes">
                        <IconButton onClick={() => { setSelectedLote(lote); setImagesOpen(true); }} color="primary">
                          <Collections fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => { setSelectedLote(lote); setModalOpen(true); }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => { if (confirm(`¿Eliminar ${lote.nombre_lote}?`)) deleteMutation.mutate(lote.id); }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredLotes.length === 0 && (
                 <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No se encontraron lotes.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      {/* Modales */}
      <CreateEditLoteModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedLote(null); }}
        onSubmit={async (data, id) => { await saveMutation.mutateAsync({ dto: data, id }); }}
        loteToEdit={selectedLote}
        isLoading={saveMutation.isPending}
      />

      {selectedLote && (
        <ManageLoteImagesModal
          open={imagesOpen}
          onClose={() => { setImagesOpen(false); setSelectedLote(null); }}
          lote={selectedLote}
        />
      )}
    </PageContainer>
  );
};

export default InventarioLotes;