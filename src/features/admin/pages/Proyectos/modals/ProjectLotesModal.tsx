// src/components/Admin/Proyectos/Components/modals/ProjectLotesModal.tsx

import {
  Close as CloseIcon,
  Description as ContractIcon,
  Edit as EditIcon,
  Inventory2 as InventoryIcon,
  UploadFile as UploadIcon,
  LocationOn, AccountBalance, AttachMoney, PeopleAlt, Map, OpenInNew,
  Visibility as VisibilityIcon,
  ArrowBackIosNew as PrevIcon, // 🆕 Iconos para el carrusel
  ArrowForwardIos as NextIcon
} from '@mui/icons-material';
import {
  Avatar, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
  Divider, IconButton, Paper, Stack, Typography, alpha, useTheme, Chip,
  CardMedia, List, ListItem, ListItemText, ListItemAvatar
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ContratoPlantillaService from '../../../../../core/api/services/contrato-plantilla.service';
import ImagenService from '../../../../../core/api/services/imagen.service';
import type { ProyectoDto } from '../../../../../core/types/dto/proyecto.dto';
import type { LoteDto } from '../../../../../core/types/dto/lote.dto';
import PdfPreviewModal from '@/shared/components/admin/PdfPreviewModal';


interface ProjectLotesModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
}

const ProjectLotesModal: React.FC<ProjectLotesModalProps> = ({ open, onClose, proyecto }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Estados de UI
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 🆕 Estado para el carrusel

  // Fetch de la plantilla activa
  const { data: plantillaAsignada, isLoading: isLoadingContrato } = useQuery({
    queryKey: ['plantillaActivaResumen', proyecto?.id],
    queryFn: async () => {
      if (!proyecto) return null;
      const response = await ContratoPlantillaService.findByProject(proyecto.id);
      const activas = response.data.filter(p => p.activo);
      if (activas.length === 0) return null;
      return activas.reduce((prev, curr) => curr.version > prev.version ? curr : prev);
    },
    enabled: open && !!proyecto,
  });

  // Limitar lotes a mostrar
  const lotesPreview = useMemo(() => {
    if (!proyecto?.lotes) return [];
    return proyecto.lotes.slice(0, 5);
  }, [proyecto?.lotes]);

  const remainingLotesCount = useMemo(() => {
    if (!proyecto?.lotes) return 0;
    return Math.max(0, proyecto.lotes.length - 5);
  }, [proyecto?.lotes]);

  if (!proyecto) return null;

  // Handlers de navegación
  const handleGestionarContrato = () => {
    navigate(`/admin/plantillas?proyecto=${proyecto.id}`);
    onClose();
  };

  const handleGestionarLotes = () => {
    navigate(`/admin/lotes?proyecto=${proyecto.id}`);
    onClose();
  };

  const isMensual = proyecto.tipo_inversion === 'mensual';

  // 🆕 LÓGICA DE GALERÍA DE IMÁGENES
  const hasImages = proyecto.imagenes && proyecto.imagenes.length > 0;
  const currentImageUrl = hasImages 
    ? ImagenService.resolveImageUrl(proyecto.imagenes![currentImageIndex].url) 
    : '/assets/placeholder-project.jpg';

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? proyecto.imagenes!.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === proyecto.imagenes!.length - 1 ? 0 : prev + 1));
  };

  // Resetear el índice de imagen al cerrar para que la próxima vez arranque desde la primera foto
  const handleClose = () => {
    setCurrentImageIndex(0);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        
        {/* HEADER DEL MODAL */}
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
              <InventoryIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800} component="div">{proyecto.nombre_proyecto}</Typography>
              <Stack direction="row" spacing={1} mt={0.5}>
                  <Chip label={isMensual ? 'Plan de Ahorro' : 'Inversión Directa'} size="small" color={isMensual ? "primary" : "secondary"} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                  <Chip label={proyecto.estado_proyecto.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={handleClose}><CloseIcon /></IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
          
          {/* 🆕 IMAGEN Y DESCRIPCIÓN (AHORA CON CARRUSEL) */}
          <Box sx={{ position: 'relative', height: 240, bgcolor: 'grey.900' }}>
              <CardMedia 
                  component="img" 
                  height="100%" 
                  image={currentImageUrl}
                  sx={{ objectFit: 'cover', opacity: 0.8 }} 
                  onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/placeholder-project.jpg';
                  }}
              />
              
              {/* Controles del Carrusel (Solo aparecen si hay más de 1 imagen) */}
              {hasImages && proyecto.imagenes!.length > 1 && (
                  <>
                      <IconButton 
                          onClick={handlePrevImage}
                          sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}
                      >
                          <PrevIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                          onClick={handleNextImage}
                          sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'primary.main' } }}
                      >
                          <NextIcon fontSize="small" />
                      </IconButton>
                      
                      {/* Indicador de posición (Ej: 1 / 5) */}
                      <Chip 
                          label={`${currentImageIndex + 1} / ${proyecto.imagenes!.length}`}
                          size="small"
                          sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', fontWeight: 800, fontSize: '0.65rem' }}
                      />
                  </>
              )}

              {/* Degradado y Descripción */}
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: 16, left: 24, right: 24, pointerEvents: 'none' }}>
                  <Typography variant="body2" color="white" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {proyecto.descripcion}
                  </Typography>
              </Box>
          </Box>

          <Stack spacing={3} p={3}>
            
            {/* MÉTRICAS FINANCIERAS Y DE SUSCRIPTORES */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <AttachMoney color="success" fontSize="small" />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">INVERSIÓN TOTAL</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={800}>{proyecto.moneda} {Number(proyecto.monto_inversion).toLocaleString('es-AR')}</Typography>
                  {isMensual && proyecto.plazo_inversion && (
                      <Typography variant="caption" color="text.secondary">Plazo: {proyecto.plazo_inversion} meses</Typography>
                  )}
              </Paper>

              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <PeopleAlt color="primary" fontSize="small" />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">SUSCRIPTORES</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={800}>{proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones}</Typography>
                  <Typography variant="caption" color={proyecto.suscripciones_actuales < (proyecto.suscripciones_minimas || 1) ? "error.main" : "text.secondary"}>
                      Mínimo requerido: {proyecto.suscripciones_minimas}
                  </Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <AccountBalance color="info" fontSize="small" />
                      <Typography variant="caption" fontWeight={700} color="info.main">DATOS LEGALES</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={700} noWrap>{proyecto.forma_juridica || 'No especificada'}</Typography>
                  {proyecto.latitud && proyecto.longitud ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <LocationOn sx={{ fontSize: 12 }} /> Georreferenciado
                      </Typography>
                  ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          Ubicación a coordinar
                      </Typography>
                  )}
              </Paper>
            </Box>

            {/* ESTADO DEL CONTRATO */}
            <Paper
              elevation={0}
              sx={{
                p: 2, borderRadius: 2, border: '1px solid',
                borderColor: plantillaAsignada ? 'success.light' : 'warning.light',
                bgcolor: plantillaAsignada ? alpha(theme.palette.success.main, 0.02) : alpha(theme.palette.warning.main, 0.02),
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <ContractIcon color={plantillaAsignada ? "success" : "warning"} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>CONTRATO MARCO VINCULADO</Typography>
                  {isLoadingContrato ? (
                    <CircularProgress size={12} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {plantillaAsignada ? `Plantilla activa: ${plantillaAsignada.nombre_archivo} (v${plantillaAsignada.version})` : "Es obligatorio vincular un contrato para operar."}
                    </Typography>
                  )}
                </Box>
              </Stack>
              
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                {plantillaAsignada ? (
                  <>
                    <Button 
                        size="small" 
                        variant="contained" 
                        color="success" 
                        startIcon={<VisibilityIcon />} 
                        onClick={(e) => {
                            e.currentTarget.blur();
                            setPreviewOpen(true);
                        }} 
                    >
                        Previsualizar
                    </Button>
                    <Button size="small" variant="outlined" color="primary" startIcon={<EditIcon />} onClick={handleGestionarContrato}>
                        Cambiar
                    </Button>
                  </>
                ) : (
                  <Button size="small" variant="outlined" color="warning" startIcon={<UploadIcon />} onClick={handleGestionarContrato}>
                    Vincular Contrato
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* VISTA RÁPIDA DE LOTES */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.divider, 0.4), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Map color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={800}>INVENTARIO ASIGNADO ({proyecto.lotes?.length || 0})</Typography>
                    </Stack>
                    <Button size="small" endIcon={<OpenInNew />} onClick={handleGestionarLotes} sx={{ fontWeight: 700 }}>
                        Gestionar Lotes
                    </Button>
                </Box>
                
                {lotesPreview.length > 0 ? (
                    <List disablePadding>
                        {lotesPreview.map((lote: LoteDto, index) => (
                            <React.Fragment key={lote.id}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: 12, fontWeight: 800 }}>
                                            {lote.nombre_lote?.charAt(0).toUpperCase() || lote.id}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={700}>{lote.nombre_lote}</Typography>}
                                        secondary={<Typography variant="caption">Precio Base: ${Number(lote.precio_base).toLocaleString('es-AR')}</Typography>}
                                    />
                                    <Chip 
                                        label={lote.estado_subasta.toUpperCase()} 
                                        size="small" 
                                        color={lote.estado_subasta === 'activa' ? 'success' : lote.estado_subasta === 'finalizada' ? 'primary' : 'default'} 
                                        sx={{ fontSize: '0.65rem', fontWeight: 700 }} 
                                    />
                                </ListItem>
                                {index < lotesPreview.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box p={3} textAlign="center">
                        <Typography variant="body2" color="text.secondary">No hay lotes asignados a este proyecto.</Typography>
                    </Box>
                )}
                
                {remainingLotesCount > 0 && (
                    <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={handleGestionarLotes}>
                            Ver {remainingLotesCount} lotes más...
                        </Typography>
                    </Box>
                )}
            </Paper>

          </Stack>
        </DialogContent>

        <Divider />

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', bgcolor: 'background.paper', borderRadius: '0 0 12px 12px' }}>
          <Button onClick={handleClose} variant="contained" sx={{ px: 4, borderRadius: 2 }}>
            Cerrar Ficha
          </Button>
        </Box>
      </Dialog>

      <PdfPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        idProyecto={proyecto.id} 
        nombreArchivo={`Contrato Marco - ${proyecto.nombre_proyecto}`}
      />
    </>
  );
};

export default ProjectLotesModal;