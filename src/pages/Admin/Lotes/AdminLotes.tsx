import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Chip,
  IconButton, Tooltip, Stack, Alert, Snackbar,
  TextField, MenuItem, TablePagination, Dialog,
  DialogTitle, DialogContent, DialogActions, DialogContentText,
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';



const AdminLotes: React.FC = () => {
  const queryClient = useQueryClient();

  /** ─────────────────────────────────────────────
  * ESTADOS
  * ─────────────────────────────────────────────*/
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  // ❗ AÑADIMOS ESTADO PARA EL NUEVO MODAL
  const [manageImagesModalOpen, setManageImagesModalOpen] = useState(false); 
  const [selectedLote, setSelectedLote] = useState<LoteDTO | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [startAuctionDialogOpen, setStartAuctionDialogOpen] = useState(false);
  const [endAuctionDialogOpen, setEndAuctionDialogOpen] = useState(false);

  const [filtroProyecto, setFiltroProyecto] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  /** ─────────────────────────────────────────────
  * QUERIES
  * ─────────────────────────────────────────────*/
  const { data: lotes = [], isLoading, error } = useQuery<LoteDTO[], Error>({
    queryKey: ['adminAllLotes'],
    queryFn: loteService.getAllLotes,
  });

  const { data: proyectos = [] } = useQuery<ProyectoDTO[], Error>({
    queryKey: ['adminAllProjects'],
    queryFn: proyectoService.getAllProyectos,
  });

  /** ─────────────────────────────────────────────
  * MUTATIONS
  * ─────────────────────────────────────────────*/

  // ❗ MUTACIÓN DE CREACIÓN CORREGIDA
  const createMutation = useMutation({
    mutationFn: async ({ data, images }: { data: CreateLoteDTO; images: File[] }) => {
      const created = await loteService.createLote(data);

      if (images.length > 0 && created?.id) {
        // Usamos Promise.all para subir todas las imágenes en paralelo
        await Promise.all(
          images.map(file =>
            // Usamos el servicio adminImagenService.create
            adminImagenService.create(
              file,
              file.name,  // Descripción (puedes cambiarla)
              null,       // id_proyecto
              created.id  // id_lote
            )
          )
        );
      }
      return created;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminAllLotes'] });
      // Invalidamos la query de imágenes de este lote (para el modal de gestión)
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['loteImages', data.id] });
      }
      setSnackbar({ open: true, message: 'Lote creado con éxito', severity: 'success' });
      setCreateModalOpen(false);
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al crear lote',
        severity: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLoteDTO }) =>
      loteService.updateLote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllLotes'] });
      setSnackbar({ open: true, message: 'Lote actualizado', severity: 'success' });
      setEditModalOpen(false);
    },
    onError: (err: any) =>
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al actualizar lote',
        severity: 'error',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => loteService.deleteLote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllLotes'] });
      setSnackbar({ open: true, message: 'Lote desactivado', severity: 'success' });
      setDeleteDialogOpen(false);
    },
    onError: (err: any) =>
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al desactivar lote',
        severity: 'error',
      }),
  });

  const startAuctionMutation = useMutation({
    mutationFn: (id: number) => loteService.startAuction(id),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['adminAllLotes'] });
      setSnackbar({ open: true, message: data.mensaje || 'Subasta iniciada', severity: 'success' });
      setStartAuctionDialogOpen(false);
    },
    onError: (err: any) =>
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al iniciar subasta',
        severity: 'error',
      }),
  });

  const endAuctionMutation = useMutation({
    mutationFn: (id: number) => loteService.endAuction(id),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['adminAllLotes'] });
      setSnackbar({ open: true, message: data.mensaje || 'Subasta finalizada', severity: 'success' });
      setEndAuctionDialogOpen(false);
    },
    onError: (err: any) =>
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al finalizar subasta',
        severity: 'error',
      }),
  });

  /** ─────────────────────────────────────────────
  * HELPERS
  * ─────────────────────────────────────────────*/
  const getNombreProyecto = (id: number | null) => {
    if (!id) return 'Sin asignar';
    return proyectos.find(p => p.id === id)?.nombre_proyecto ?? `Proyecto ID: ${id}`;
  };

  const getEstadoChip = (estado: string) => {
    const map: Record<string, { color: any; label: string }> = {
      pendiente: { color: 'warning', label: 'Pendiente' },
      activa: { color: 'success', label: 'Activa' },
      finalizada: { color: 'default', label: 'Finalizada' },
    };
    return map[estado] ?? { color: 'default', label: estado };
  };

  /** ─────────────────────────────────────────────
  * FILTROS Y PAGINADO
  * ─────────────────────────────────────────────*/
  const lotesFiltrados = useMemo(() => {
    return lotes.filter(l => {
      const matchSearch = l.nombre_lote.toLowerCase().includes(busqueda.toLowerCase());
      const matchProyecto =
        filtroProyecto === 'todos' ||
        (filtroProyecto === 'sin_proyecto' && !l.id_proyecto) ||
        l.id_proyecto?.toString() === filtroProyecto;

      return matchSearch && matchProyecto;
    });
  }, [lotes, busqueda, filtroProyecto]);

  const lotesPaginados = useMemo(() => {
    const start = page * rowsPerPage;
    return lotesFiltrados.slice(start, start + rowsPerPage);
  }, [lotesFiltrados, page, rowsPerPage]);

  /** ─────────────────────────────────────────────
  * HANDLERS
  * ─────────────────────────────────────────────*/
  
  const handleCreateSubmit = async (data: CreateLoteDTO, images: File[]) => {
    await createMutation.mutateAsync({ data, images });
  };

  const handleEditSubmit = async (id: number, data: UpdateLoteDTO) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const confirmDelete = () => selectedLote && deleteMutation.mutate(selectedLote.id);
  const confirmStartAuction = () => selectedLote && startAuctionMutation.mutate(selectedLote.id);
  const confirmEndAuction = () => selectedLote && endAuctionMutation.mutate(selectedLote.id);

  // ❗ HANDLER DE GESTIÓN DE IMÁGENES
  const handleManageImages = (lote: LoteDTO) => {
    setSelectedLote(lote);
    setManageImagesModalOpen(true); // Abrimos el nuevo modal
  };

  // ❗ NUEVO: Handler centralizado para cerrar TODOS los modales/diálogos
  const handleCloseModals = () => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setManageImagesModalOpen(false);
    setDeleteDialogOpen(false);
    setStartAuctionDialogOpen(false);
    setEndAuctionDialogOpen(false);
    // Espera a que la animación de cierre termine para limpiar la selección
    setTimeout(() => setSelectedLote(null), 150); 
  };

  /** ─────────────────────────────────────────────
  * RENDER
  * ─────────────────────────────────────────────*/
  return (
    <PageContainer maxWidth="xl">
      <AdminBreadcrumbs />
      <PageHeader
        title="Gestión de Lotes"
        subtitle="Crea, edita y asigna lotes a proyectos específicos."
      />

      <Paper elevation={2} sx={{ p: 3 }}>
        {/* FILTROS */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <SectionTitle>Todos los Lotes ({lotesFiltrados.length})</SectionTitle>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Buscar lote..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
              sx={{ minWidth: 200 }}
            />

            <TextField
              select
              size="small"
              label="Filtrar por Proyecto"
              value={filtroProyecto}
              onChange={e => setFiltroProyecto(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="sin_proyecto">Sin asignar</MenuItem>
              {proyectos.map(p => (
                <MenuItem key={p.id} value={p.id.toString()}>
                  {p.nombre_proyecto}
                </MenuItem>
              ))}
            </TextField>

            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
              Crear Lote
            </Button>
          </Stack>
        </Stack>

        <QueryHandler isLoading={isLoading} error={error as Error | null}>
          {lotesFiltrados.length === 0 ? (
            <Alert severity="info">
              {busqueda || filtroProyecto !== 'todos'
                ? 'No se encontraron lotes con los filtros aplicados.'
                : 'No hay lotes creados todavía.'}
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Proyecto</TableCell>
                      <TableCell>Precio Base</TableCell>
                      <TableCell>Subasta</TableCell>
                      <TableCell align="center">Imágenes</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {lotesPaginados.map(lote => {
                      const estadoChip = getEstadoChip(lote.estado_subasta);

                      return (
                        <TableRow key={lote.id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{lote.nombre_lote}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {lote.id}
                            </Typography>
                          </TableCell>

                          <TableCell>{getNombreProyecto(lote.id_proyecto)}</TableCell>

                          <TableCell>
                            ${lote.precio_base.toLocaleString()}
                          </TableCell>

                          <TableCell>
                            <Chip size="small" label={estadoChip.label} color={estadoChip.color} />
                          </TableCell>

                          <TableCell align="center">
                            {lote.imagenes?.length ?? 0}
                          </TableCell>

                          <TableCell align="center">
                            <Stack direction="row" spacing={0} justifyContent="center">
                              <Tooltip title="Editar">
                                <IconButton size="small" color="primary" onClick={() => {
                                  setSelectedLote(lote);
                                  setEditModalOpen(true);
                                }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {lote.estado_subasta === 'pendiente' && (
                                <Tooltip title="Iniciar Subasta">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => {
                                      setSelectedLote(lote);
                                      setStartAuctionDialogOpen(true);
                                    }}
                                  >
                                    <StartIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {lote.estado_subasta === 'activa' && (
                                <Tooltip title="Finalizar Subasta">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => {
                                      setSelectedLote(lote);
                                      setEndAuctionDialogOpen(true);
                                    }}
                                  >
                                    <StopIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              <Tooltip title="Gestionar Imágenes">
                                <IconButton
                                  size="small"
                                  color="default"
                                  onClick={() => handleManageImages(lote)}
                                >
                                  <ImageIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Desactivar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedLote(lote);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={lotesFiltrados.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </QueryHandler>
      </Paper>

      {/* MODALES */}
      <CreateLoteModal
        open={createModalOpen}
        onClose={handleCloseModals} // 👈 Usamos el handler centralizado
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
        proyectos={proyectos}
      />

      <EditLoteModal
        open={editModalOpen}
        onClose={handleCloseModals} // 👈 Usamos el handler centralizado
        onSubmit={handleEditSubmit}
        lote={selectedLote}
        isLoading={updateMutation.isPending}
      />

      {/* ❗ RENDERIZAMOS EL NUEVO MODAL DE IMÁGENES */}
      {selectedLote && (
        <ManageLoteImagesModal
          open={manageImagesModalOpen}
          onClose={handleCloseModals} // 👈 Usamos el handler centralizado
          lote={selectedLote}
        />
      )}


      {/* DIÁLOGOS */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseModals}>
        <DialogTitle>Desactivar lote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro querés desactivar el lote <strong>{selectedLote?.nombre_lote}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModals}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            Desactivar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={startAuctionDialogOpen} onClose={handleCloseModals}>
        <DialogTitle>Iniciar subasta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Iniciar subasta del lote <strong>{selectedLote?.nombre_lote}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModals}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={confirmStartAuction}
            disabled={startAuctionMutation.isPending}
          >
            Iniciar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={endAuctionDialogOpen} onClose={handleCloseModals}>
        <DialogTitle>Finalizar subasta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Finalizar subasta del lote <strong>{selectedLote?.nombre_lote}</strong>?
            El ganador se asignará automáticamente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModals}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={confirmEndAuction}
            disabled={endAuctionMutation.isPending}
          >
            Finalizar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminLotes;