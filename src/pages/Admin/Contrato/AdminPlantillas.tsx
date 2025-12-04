import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment 
} from '@mui/material';
import { 
  Search, 
  Upload as UploadIcon,
  Delete as DeleteIcon,
  VerifiedUser, 
  GppBad, 
  Add as AddIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


import type { 
  ContratoPlantillaDto, 
  CreatePlantillaDto, 
  UpdatePlantillaPdfDto 
} from '../../../types/dto/contrato.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// Modales
import CreatePlantillaModal from './modals/CreatePlantillaModal';
import UpdatePdfModal from './modals/UpdatePdfModal';
import ContratoPlantillaService from '../../../Services/contrato-plantilla.service';

const AdminPlantillas: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  
  // Estado Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [plantillaToUpdate, setPlantillaToUpdate] = useState<ContratoPlantillaDto | null>(null);

  // 1. Query: Obtener Todas las Plantillas
  const { data: plantillas = [], isLoading, error } = useQuery<ContratoPlantillaDto[]>({
    queryKey: ['adminPlantillas'],
    queryFn: async () => {
        const res = await ContratoPlantillaService.findAll();
        return res.data; 
    }
  });

  // 2. Filtrado en Cliente (Búsqueda por nombre y filtro por tipo)
  const filteredPlantillas = useMemo(() => {
    return plantillas.filter(plantilla => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = plantilla.nombre_archivo.toLowerCase().includes(term);
      
      const matchesProject = 
        filterProject === 'all' ? true :
        filterProject === 'general' ? plantilla.id_proyecto === null :
        true; 

      return matchesSearch && matchesProject;
    });
  }, [plantillas, searchTerm, filterProject]);

  // --- Mutaciones ---

  // Crear Plantilla
  const createMutation = useMutation({
    mutationFn: (data: CreatePlantillaDto) => ContratoPlantillaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => alert(`Error al crear: ${err.message}`)
  });

  // Actualizar PDF
  const updatePdfMutation = useMutation({
    mutationFn: (data: UpdatePlantillaPdfDto) => ContratoPlantillaService.updatePdf(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      setPlantillaToUpdate(null);
    },
    onError: (err: any) => alert(`Error al actualizar PDF: ${err.message}`)
  });

  // Eliminar (Soft Delete)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => ContratoPlantillaService.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
    }
  });

  return (
    <PageContainer maxWidth="xl">
      <Box textAlign="center" mb={5}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Gestión de Plantillas
        </Typography>
        <Typography color="text.secondary">
          Administra los documentos base (PDFs) para la firma de contratos.
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        <TextField 
          placeholder="Buscar plantilla..." size="small" sx={{ flexGrow: 1, minWidth: 250 }}
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
        
        <TextField
          select label="Tipo" size="small" value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)} sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Todas</MenuItem>
          <MenuItem value="general">Generales (Sin Proyecto)</MenuItem>
        </TextField>

        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          color="primary" 
          onClick={() => setIsCreateModalOpen(true)}
        >
          Nueva Plantilla
        </Button>
      </Paper>

      {/* Tabla */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Nombre / Archivo</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Versión</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Proyecto Asignado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Integridad (Hash)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlantillas.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  
                  {/* Columna Nombre */}
                  <TableCell>
                    <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {row.nombre_archivo}
                        </Typography>
                        {/* URL cortada visualmente */}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.url_archivo}
                        </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip label={`v${row.version}`} size="small" variant="outlined" />
                  </TableCell>

                  {/* Columna Proyecto */}
                  <TableCell>
                    {row.id_proyecto ? (
                      <Chip label={`ID Proyecto: ${row.id_proyecto}`} color="info" size="small" />
                    ) : (
                      <Chip label="General / Global" color="default" size="small" variant="outlined" />
                    )}
                  </TableCell>

                  {/* Columna Integridad (Solo visual, dato viene del backend) */}
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {row.integrity_compromised ? (
                         <Tooltip title="PELIGRO: El hash del archivo no coincide con la base de datos. Archivo alterado.">
                           <GppBad color="error" />
                         </Tooltip>
                      ) : (
                        <Tooltip title="Hash Verificado: Archivo íntegro">
                           <VerifiedUser color="success" />
                        </Tooltip>
                      )}
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                        {row.hash_archivo_original ? row.hash_archivo_original.substring(0, 8) + '...' : 'N/A'}
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="right">
                    <Tooltip title="Actualizar archivo PDF (Nueva versión)">
                      <IconButton color="primary" onClick={() => setPlantillaToUpdate(row)}>
                        <UploadIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Eliminar Plantilla">
                      <IconButton 
                        color="error" 
                        onClick={() => {
                          if(window.confirm('¿Seguro que deseas eliminar esta plantilla?')) {
                            deleteMutation.mutate(row.id);
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredPlantillas.length === 0 && (
                 <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No se encontraron plantillas.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      {/* Modales con corrección de tipos Promise<void> */}
      <CreatePlantillaModal 
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
        isLoading={createMutation.isPending}
      />

      <UpdatePdfModal 
        open={!!plantillaToUpdate}
        plantilla={plantillaToUpdate}
        onClose={() => setPlantillaToUpdate(null)}
        onSubmit={async (data) => { await updatePdfMutation.mutateAsync(data); }}
        isLoading={updatePdfMutation.isPending}
      />

    </PageContainer>
  );
};

export default AdminPlantillas;