// src/components/Admin/KYC/KYCDetailsModal.tsx
// (Versión 2, Sin Grid y con componentes helper)

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  IconButton,
  Alert,
  Chip,
  Card,
  CardMedia,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Wifi as WifiIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import type { KycDTO, RejectKycDTO } from '../../../../types/dto/kyc.dto';

// ════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════

interface KYCDetailsModalProps {
  open: boolean;
  onClose: () => void;
  kyc: KycDTO | null;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, data: RejectKycDTO) => Promise<void>;
  isLoading?: boolean;
}

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

const KYCDetailsModal: React.FC<KYCDetailsModalProps> = ({
  open,
  onClose,
  kyc,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (!kyc) return;
    try {
      await onApprove(kyc.id_usuario);
      onClose();
    } catch (error) {
      console.error('Error al aprobar KYC:', error);
    }
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
    setRejectReason('');
    setRejectError('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      setRejectError('El motivo del rechazo es obligatorio');
      return;
    }
    if (rejectReason.length < 10) {
      setRejectError('El motivo debe tener al menos 10 caracteres');
      return;
    }
    if (!kyc) return;

    try {
      await onReject(kyc.id_usuario, { motivo_rechazo: rejectReason });
      setShowRejectDialog(false);
      onClose();
    } catch (error) {
      console.error('Error al rechazar KYC:', error);
    }
  };

  const handleImageClick = (url: string | null) => {
    if (url) {
      setSelectedImage(url);
    }
  };

  // ──────────────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ──────────────────────────────────────────────────────────

  const getStatusColor = (
    status: string
  ): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'APROBADA':
        return 'success';
      case 'RECHAZADA':
        return 'error';
      case 'PENDIENTE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    // Sumamos 1 día para corregir UTC (común en DATEONLY de BD)
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  if (!kyc) return null;

  const isPending = kyc.estado_verificacion === 'PENDIENTE';

  // Componente reutilizable para mostrar info
  const InfoItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
  }> = ({ icon, label, value }) => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box color="action.active" sx={{ display: 'flex' }}>
        {icon}
      </Box>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          lineHeight={1.2}
        >
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {value}
        </Typography>
      </Box>
    </Stack>
  );

  // Componente reutilizable para mostrar imagen
  const ImageCard: React.FC<{
    url: string | null | undefined; // Acepta undefined también
    title: string;
    icon: React.ReactNode;
  }> = ({ url, title, icon }) => {
    if (!url) return null; // No renderiza nada si la URL no existe
    return (
      <Box sx={{ width: { xs: '100%', sm: '33.33%' }, p: 1 }}>
        {' '}
        {/* Simula Grid item xs=12 sm=4 */}
        <Card
          elevation={3}
          sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
          onClick={() => handleImageClick(url)}
        >
          <CardMedia
            component="img"
            height="200"
            image={url}
            alt={title}
            sx={{ objectFit: 'cover' }}
          />
          <Box sx={{ p: 1, bgcolor: 'background.paper' }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {icon}
              <Typography variant="caption" fontWeight="medium">
                {title}
              </Typography>
            </Stack>
          </Box>
        </Card>
      </Box>
    );
  };

  return (
    <>
      {/* MODAL PRINCIPAL */}
      <Dialog
        open={open}
        onClose={isLoading ? undefined : onClose}
        maxWidth="lg"
        fullWidth
      >
        {/* HEADER */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BadgeIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Detalles de Verificación KYC
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* ESTADO Y INFO BÁSICA */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={kyc.estado_verificacion}
                color={getStatusColor(kyc.estado_verificacion)}
                size="medium"
              />
              <Typography variant="body2" color="text.secondary">
                Solicitud #{kyc.id} (Usuario ID: {kyc.id_usuario})
              </Typography>
            </Stack>

            {/* INFORMACIÓN DEL SOLICITANTE (SIN GRID) */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Información del Solicitante
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <InfoItem
                    icon={<PersonIcon fontSize="small" />}
                    label="Nombre Completo"
                    value={kyc.nombre_completo || 'N/A'}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <InfoItem
                    icon={<BadgeIcon fontSize="small" />}
                    label="Tipo y Número de Documento"
                    value={`${kyc.tipo_documento} - ${kyc.numero_documento}`}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <InfoItem
                    icon={<CalendarIcon fontSize="small" />}
                    label="Fecha de Nacimiento"
                    value={formatDateOnly(kyc.fecha_nacimiento)}
                  />
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* DOCUMENTOS E IMÁGENES (SIN GRID) */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Documentos Presentados
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  flexWrap: 'wrap',
                  mx: -1,
                }}
              >
                <ImageCard
                  url={kyc.url_foto_documento_frente}
                  title="Frente del Documento"
                  icon={<ImageIcon fontSize="small" color="action" />}
                />
                <ImageCard
                  url={kyc.url_foto_documento_dorso}
                  title="Dorso del Documento"
                  icon={<ImageIcon fontSize="small" color="action" />}
                />
                <ImageCard
                  url={kyc.url_foto_selfie_con_documento}
                  title="Selfie con Documento"
                  icon={<PersonIcon fontSize="small" color="action" />}
                />
              </Box>
              {kyc.url_video_verificacion && (
                <Alert icon={<VideoIcon />} severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Video de Verificación:</strong>{' '}
                    <a
                      href={kyc.url_video_verificacion}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver Video
                    </a>
                  </Typography>
                </Alert>
              )}
            </Box>

            <Divider />

            {/* METADATA (SIN GRID) */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Información Técnica
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                {kyc.ip_verificacion && (
                  <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                    <InfoItem
                      icon={<WifiIcon fontSize="small" />}
                      label="Dirección IP"
                      value={kyc.ip_verificacion}
                    />
                  </Box>
                )}
                {kyc.latitud_verificacion && kyc.longitud_verificacion && (
                  <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                    <InfoItem
                      icon={<LocationIcon fontSize="small" />}
                      label="Geolocalización"
                      value={`${kyc.latitud_verificacion}, ${kyc.longitud_verificacion}`}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            {/* ESTADO DE VERIFICACIÓN */}
            {!isPending && (
              <>
                <Divider />
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Estado de Verificación
                  </Typography>
                  <Alert
                    severity={
                      kyc.estado_verificacion === 'APROBADA' ? 'success' : 'error'
                    }
                  >
                    <Typography variant="body2">
                      <strong>Estado:</strong> {kyc.estado_verificacion}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Fecha:</strong>{' '}
                      {formatDate(kyc.fecha_verificacion)}
                    </Typography>
                    {kyc.motivo_rechazo && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Motivo del rechazo:</strong>{' '}
                        {kyc.motivo_rechazo}
                      </Typography>
                    )}
                  </Alert>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>

        {/* ACCIONES */}
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={isLoading}
          >
            Cerrar
          </Button>

          {isPending && (
            <>
              <Button
                onClick={handleRejectClick}
                variant="outlined"
                color="error"
                disabled={isLoading}
                startIcon={<CancelIcon />}
              >
                Rechazar
              </Button>
              <Button
                onClick={handleApprove}
                variant="contained"
                color="success"
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              >
                {isLoading ? 'Aprobando...' : 'Aprobar Verificación'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* MODAL DE RECHAZO */}
      <Dialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Rechazar Verificación KYC
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Esta acción notificará al usuario y deberá volver a iniciar el
              proceso.
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Motivo del Rechazo"
              placeholder="Explica detalladamente por qué se rechaza la verificación..."
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setRejectError('');
              }}
              error={!!rejectError}
              helperText={rejectError || 'Mínimo 10 caracteres'}
              required
              disabled={isLoading}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setShowRejectDialog(false)}
            variant="outlined"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CancelIcon />
              )
            }
          >
            {isLoading ? 'Rechazando...' : 'Confirmar Rechazo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE IMAGEN AMPLIADA */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Imagen Ampliada</Typography>
            <IconButton onClick={() => setSelectedImage(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={selectedImage}
                alt="Imagen ampliada"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KYCDetailsModal;