// src/components/Admin/Proyectos/Components/modals/DetalleProyectoModal.tsx

import {
  AccountBalance, AttachMoney,
  Description as ContractIcon,
  Edit as EditIcon,
  Inventory2 as InventoryIcon,
  LocationOn,
  Map,
  ArrowForwardIos as NextIcon,
  OpenInNew,
  PeopleAlt,
  ArrowBackIosNew as PrevIcon,
  UploadFile as UploadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  Avatar, Box, Button,
  CardMedia,
  Chip,
  Divider, IconButton,
  List, ListItem,
  ListItemAvatar,
  ListItemText,
  Paper, Stack, Typography, alpha, useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { env } from '@/core/config/env'; // 👈 1. Importamos la configuración global
import PdfPreviewModal from '@/features/admin/pages/Contrato/modals/PdfPreviewModal';
import { BaseModal } from '@/shared/components/domain';
import ContratoPlantillaService from '../../../../../core/api/services/contrato-plantilla.service';
import ImagenService from '../../../../../core/api/services/imagen.service';
import type { LoteDto } from '../../../../../core/types/lote.dto';
import type { ProyectoDto } from '../../../../../core/types/proyecto.dto';

interface DetalleProyectoModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
}

const DetalleProyectoModal: React.FC<DetalleProyectoModalProps> = ({ open, onClose, proyecto }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // --- Estados de UI ---
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Queries ---
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
    staleTime: env.queryStaleTime || 30000, // 👈 2. Aplicamos la variable global
  });

  // --- Memos de Lógica ---
  const lotesPreview = useMemo(() => proyecto?.lotes?.slice(0, 5) || [], [proyecto?.lotes]);
  const remainingLotesCount = useMemo(() => Math.max(0, (proyecto?.lotes?.length || 0) - 5), [proyecto?.lotes]);
  const isMensual = proyecto?.tipo_inversion === 'mensual';
  const hasImages = proyecto?.imagenes && proyecto.imagenes.length > 0;

  const currentImageUrl = useMemo(() => {
    if (!proyecto || !hasImages) return '/assets/placeholder-project.jpg';
    return ImagenService.resolveImageUrl(proyecto.imagenes![currentImageIndex].url);
  }, [proyecto, hasImages, currentImageIndex]);

  if (!proyecto) return null;

  // --- Handlers ---
  const handleGestionarContrato = () => { navigate(`/admin/plantillas?proyecto=${proyecto.id}`); onClose(); };
  const handleGestionarLotes = () => { navigate(`/admin/lotes?proyecto=${proyecto.id}`); onClose(); };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? proyecto.imagenes!.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === proyecto.imagenes!.length - 1 ? 0 : prev + 1));
  };

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    heroBox: {
      position: 'relative',
      height: { xs: 220, md: 300 },
      bgcolor: 'grey.900',
      mx: { xs: -3, md: -4 },
      mt: { xs: -3, md: -4 },
      mb: 3,
      overflow: 'hidden'
    },
    statCard: {
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: theme.palette.divider,
      bgcolor: alpha(theme.palette.background.paper, 0.5)
    },
    navButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      bgcolor: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(4px)',
      color: 'white',
      '&:hover': { bgcolor: 'primary.main' },
      zIndex: 2
    }
  }), [theme]);

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        title={proyecto.nombre_proyecto}
        subtitle="Expediente técnico y gestión integral"
        icon={<InventoryIcon />}
        maxWidth="md"
        headerExtra={
          <Stack direction="row" spacing={1}>
            <Chip
              label={isMensual ? 'Plan de Ahorro' : 'Inversión Directa'}
              size="small"
              color={isMensual ? "primary" : "secondary"}
              sx={{ fontWeight: 800, fontSize: '0.6rem' }}
            />
            <Chip
              label={proyecto.estado_proyecto.toUpperCase()}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 800, fontSize: '0.6rem' }}
            />
          </Stack>
        }
      >
        <Stack spacing={0}>
          {/* 📸 HERO / CARRUSEL */}
          <Box sx={styles.heroBox}>
            <CardMedia
              component="img"
              height="100%"
              image={currentImageUrl}
              sx={{ objectFit: 'cover', transition: 'all 0.5s ease' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-project.jpg'; }}
            />

            {hasImages && proyecto.imagenes!.length > 1 && (
              <>
                <IconButton onClick={handlePrevImage} sx={{ ...styles.navButton, left: 16 }}>
                  <PrevIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={handleNextImage} sx={{ ...styles.navButton, right: 16 }}>
                  <NextIcon fontSize="small" />
                </IconButton>
                <Chip
                  label={`${currentImageIndex + 1} / ${proyecto.imagenes!.length}`}
                  size="small"
                  sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', fontWeight: 800 }}
                />
              </>
            )}

            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: 20, left: 32, right: 32, pointerEvents: 'none' }}>
              <Typography variant="body2" color="white" fontWeight={500} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {proyecto.descripcion}
              </Typography>
            </Box>
          </Box>

          <Stack spacing={3}>
            {/* 📊 MÉTRICAS RÁPIDAS */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Paper elevation={0} sx={styles.statCard}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <AttachMoney color="success" sx={{ fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={900} color="text.secondary">INVERSIÓN TOTAL</Typography>
                </Stack>
                {/* 👈 3. Aplicamos el Locale Global */}
                <Typography variant="h6" fontWeight={900}>{proyecto.moneda} {Number(proyecto.monto_inversion).toLocaleString(env.defaultLocale)}</Typography>
              </Paper>

              <Paper elevation={0} sx={styles.statCard}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <PeopleAlt color="primary" sx={{ fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={900} color="text.secondary">CAPACIDAD</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={900}>{proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones}</Typography>
              </Paper>

              <Paper elevation={0} sx={{ ...styles.statCard, bgcolor: alpha(theme.palette.info.main, 0.03) }}>
                <Stack direction="row" spacing={1} mb={1}>
                  <AccountBalance color="info" sx={{ fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={900} color="info.main">DATOS LEGALES</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={800} noWrap>{proyecto.forma_juridica || 'Fideicomiso'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn sx={{ fontSize: 12 }} /> {proyecto.latitud ? 'Georreferenciado' : 'Ubicación Pendiente'}
                </Typography>
              </Paper>
            </Box>

            {/* 📜 VINCULACIÓN DE CONTRATO */}
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: 2.5, borderRadius: 3,
                borderColor: plantillaAsignada ? 'success.light' : 'warning.light',
                bgcolor: plantillaAsignada ? alpha(theme.palette.success.main, 0.02) : alpha(theme.palette.warning.main, 0.02),
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar variant="rounded" sx={{ bgcolor: plantillaAsignada ? 'success.main' : 'warning.main', width: 40, height: 40 }}>
                  <ContractIcon sx={{ color: 'white' }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={900} letterSpacing={0.5}>CONTRATO MARCO OPERATIVO</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {isLoadingContrato ? 'Verificando firmas...' : plantillaAsignada ? `Plantilla: ${plantillaAsignada.nombre_archivo} (v${plantillaAsignada.version})` : "Requiere vinculación de documento legal para permitir suscripciones."}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                {plantillaAsignada && (
                  <Button size="small" variant="contained" color="success" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)} sx={{ fontWeight: 800 }}>
                    Ver
                  </Button>
                )}
                <Button size="small" variant="outlined" startIcon={plantillaAsignada ? <EditIcon /> : <UploadIcon />} onClick={handleGestionarContrato} sx={{ fontWeight: 800 }}>
                  {plantillaAsignada ? 'Cambiar' : 'Asociar'}
                </Button>
              </Stack>
            </Paper>

            {/* 📦 SECCIÓN DE INVENTARIO */}
            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, px: 2.5, bgcolor: alpha(theme.palette.divider, 0.2), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Map color="action" />
                  <Typography variant="subtitle2" fontWeight={900}>INVENTARIO DISPONIBLE ({proyecto.lotes?.length || 0})</Typography>
                </Stack>
                <Button size="small" endIcon={<OpenInNew />} onClick={handleGestionarLotes} sx={{ fontWeight: 800 }}>
                  Gestionar Todos
                </Button>
              </Box>

              {lotesPreview.length > 0 ? (
                <List disablePadding>
                  {lotesPreview.map((lote: LoteDto, index) => (
                    <React.Fragment key={lote.id}>
                      <ListItem sx={{ py: 1.5, px: 2.5, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: 14, fontWeight: 900 }}>
                            {lote.nombre_lote?.charAt(0) || 'L'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={800}>{lote.nombre_lote}</Typography>}

                          secondary={<Typography variant="caption" fontWeight={600}>Base: ${Number(lote.precio_base).toLocaleString(env.defaultLocale)}</Typography>}
                        />
                        <Chip
                          label={lote.estado_subasta.toUpperCase()}
                          size="small"
                          variant={lote.estado_subasta === 'activa' ? 'filled' : 'outlined'}
                          color={lote.estado_subasta === 'activa' ? 'success' : 'default'}
                          sx={{ fontSize: '0.6rem', fontWeight: 900, borderRadius: 1 }}
                        />
                      </ListItem>
                      {index < lotesPreview.length - 1 && <Divider component="li" sx={{ mx: 2 }} />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box p={4} textAlign="center">
                  <InventoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2" color="text.disabled" fontWeight={700}>No se han dado de alta unidades funcionales.</Typography>
                </Box>
              )}

              {remainingLotesCount > 0 && (
                <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="primary.main" fontWeight={900} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={handleGestionarLotes}>
                    + Mostrar {remainingLotesCount} lotes adicionales en el panel de gestión
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Stack>
      </BaseModal>

      {/* MODAL DE PREVIEW PDF */}
      <PdfPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        idProyecto={proyecto.id}
        nombreArchivo={`Contrato Marco - ${proyecto.nombre_proyecto}`}
      />
    </>
  );
};

export default DetalleProyectoModal;