import {
  AccountBalance,
  ArrowBack,
  Assignment,
  Badge,
  CheckCircle,
  Gavel,
  HourglassEmpty,
  Info,
  NavigateNext,
  Person,
  RadioButtonUnchecked,
  Security,
  Send,
  UploadFile,
  VerifiedUser
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card, CardContent,
  CircularProgress,
  Divider,
  List, ListItem, ListItemIcon, ListItemText,
  MenuItem,
  Stack,
  Step, StepLabel,
  Stepper,
  TextField,
  Typography,
  alpha, useTheme
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';

// --- Imports de Arquitectura ---
import useSnackbar from '@/shared/hooks/useSnackbar';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';

// --- Servicios y DTOs ---
import kycService from '@/core/api/services/kyc.service';
import { env } from '@/core/config/env';
import type { KycStatusWithRecord, TipoDocumento } from '@/core/types/dto/kyc.dto';

// --- Componentes Locales ---
import AlertBanner from '@/shared/components/admin/Alertbanner';
import { FileUploadCard } from './components/FileUploadCard';

const TIPOS_DOCUMENTO: TipoDocumento[] = ['DNI', 'PASAPORTE', 'LICENCIA'];


const ApprovedView = () => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`, borderRadius: 4 }}>
      <Avatar sx={{ width: 96, height: 96, mx: 'auto', mb: 3, bgcolor: alpha(theme.palette.success.main, 0.15), color: 'success.main' }}>
        <VerifiedUser sx={{ fontSize: 48 }} />
      </Avatar>
      <Typography variant="h3" fontWeight="bold" color="success.dark" gutterBottom>¡Identidad Verificada!</Typography>
      <Typography variant="body1" color="text.secondary" maxWidth={600} mx="auto">Tu cuenta está operativa al 100%. Ya puedes acceder a todas las funciones de inversión y subasta.</Typography>
      <Button variant="contained" color="success" size="large" sx={{ mt: 4, px: 4, borderRadius: 2, fontWeight: 700 }} onClick={() => window.location.href = '/client/dashboard'} startIcon={<AccountBalance />}>Ir al Dashboard</Button>
    </Card>
  );
};

const PendingView = () => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`, borderRadius: 4 }}>
      <Avatar sx={{ width: 96, height: 96, mx: 'auto', mb: 3, bgcolor: alpha(theme.palette.warning.main, 0.15), color: 'warning.main' }}>
        <HourglassEmpty sx={{ fontSize: 48 }} />
      </Avatar>
      <Typography variant="h3" fontWeight="bold" color="warning.dark" gutterBottom>Verificación en Proceso</Typography>
      <Typography variant="body1" color="text.secondary" maxWidth={500} mx="auto">Tus documentos están siendo analizados por nuestro equipo de compliance. Recibirás una notificación en cuanto termine el proceso.</Typography>
    </Card>
  );
};

const KycInfoCard = () => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6 }}>
          <Box>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Info color="primary" />
                <Typography variant="h6" fontWeight={700}>¿Qué es KYC?</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph><strong>Know Your Customer</strong> es un proceso obligatorio para cumplir con regulaciones.</Typography>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <List dense>
                  <ListItem disablePadding sx={{ mb: 1 }}><ListItemIcon sx={{ minWidth: 32 }}><Security color="success" fontSize="small" /></ListItemIcon><ListItemText primary="Seguridad" secondary="Evita la suplantación de identidad." /></ListItem>
                  <ListItem disablePadding><ListItemIcon sx={{ minWidth: 32 }}><Gavel color="warning" fontSize="small" /></ListItemIcon><ListItemText primary="Legalidad" secondary="Requerido por normativas financieras." /></ListItem>
                </List>
              </Box>
            </Stack>
          </Box>
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CheckCircle color="primary" />
              <Typography variant="h6" fontWeight={700}>Proceso Simple</Typography>
            </Box>
            <List dense sx={{ bgcolor: 'background.default', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              {['Datos Personales', 'Documentación (Fotos)', 'Prueba de Vida (Selfie)'].map((step, idx) => (
                <ListItem key={idx} sx={{ py: 1.5 }}><ListItemIcon sx={{ minWidth: 40 }}><Typography variant="h6" fontWeight={800} color="primary.main">{idx + 1}</Typography></ListItemIcon><ListItemText primary={step} primaryTypographyProps={{ fontWeight: 600 }} /></ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const VerificacionKYC: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { showSuccess, showError } = useSnackbar();

  // Estados Formulario
  const [activeStep, setActiveStep] = useState(0);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  // Archivos
  const [documentoFrente, setDocumentoFrente] = useState<File | null>(null);
  const [documentoDorso, setDocumentoDorso] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  // 1. Obtener estado actual
  const { data: kycStatus, isLoading, error } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus,
    retry: false,
  });

  // 2. Pre-llenar si fue rechazado
  useEffect(() => {
    // ✅ MEJORA: Verificación de tipo segura sin 'as any'
    if (kycStatus && kycStatus.estado_verificacion === 'RECHAZADA') {
      // TypeScript infiere automáticamente que es KycStatusWithRecord por el estado
      // pero para estar 100% seguros y acceder a propiedades, hacemos el cast seguro
      const record = kycStatus as KycStatusWithRecord;

      if (record.tipo_documento) setTipoDocumento(record.tipo_documento);
      setNumeroDocumento(record.numero_documento || '');
      setNombreCompleto(record.nombre_completo || '');
      if (record.fecha_nacimiento) {
        setFechaNacimiento(record.fecha_nacimiento.toString().split('T')[0]);
      }
    }
  }, [kycStatus]);

  // 3. Mutación
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!tipoDocumento || !numeroDocumento || !nombreCompleto) throw new Error('Completa los datos personales.');
      if (!documentoFrente || !selfie) throw new Error('Falta foto del documento o selfie.');

      let lat, lng;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (e) {
        console.warn('Ubicación no disponible.');
      }

      return await kycService.submit({
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        nombre_completo: nombreCompleto,
        fecha_nacimiento: fechaNacimiento || undefined,
        documento_frente: documentoFrente,
        documento_dorso: documentoDorso || undefined,
        selfie_con_documento: selfie,
        video_verificacion: video || undefined,
        latitud_verificacion: lat,
        longitud_verificacion: lng,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      // También invalidamos al usuario para actualizar el Navbar
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      setActiveStep(0);
      setFormError(null);
      showSuccess('Solicitud enviada correctamente. Estará en revisión.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      const errorData = err.response?.data;
      if (errorData?.tipo === 'SOLICITUD_PENDIENTE' || errorData?.tipo === 'YA_VERIFICADO') {
        queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
        return;
      }
      const errorMsg = errorData?.mensaje || err.message || 'Error al enviar documentación';
      setFormError(errorMsg);
      showError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const validateFile = useCallback((file: File, type: 'image' | 'video' = 'image'): boolean => {
    if (file.size > env.maxFileSize) {
      showError(`El archivo excede el tamaño máximo permitido.`);
      return false;
    }
    if (type === 'image' && !file.type.startsWith('image/')) {
      showError('Formato de imagen no válido.');
      return false;
    }
    return true;
  }, [showError]);

  const handleSetFile = (setter: React.Dispatch<React.SetStateAction<File | null>>, file: File | null) => {
    if (file && !validateFile(file)) return;
    setter(file);
    setFormError(null);
  };

  const handleNext = () => {
    setFormError(null);
    if (activeStep === 0) {
      if (!tipoDocumento || !numeroDocumento || !nombreCompleto) {
        setFormError('Completa los campos obligatorios (*).');
        return;
      }
    } else if (activeStep === 1) {
      if (!documentoFrente || !selfie) {
        setFormError('Debes subir al menos el frente del DNI y la selfie.');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setFormError(null);
    setActiveStep((prev) => prev - 1);
  };

  const renderContent = () => {
    const estado = kycStatus?.estado_verificacion || 'NO_INICIADO';

    // ✅ MEJORA: Acceso seguro a puede_enviar sin 'as any'
    // KycStatusDTO es un Union Type, y ambas partes tienen 'puede_enviar'
    const puedeEnviar = kycStatus?.puede_enviar ?? true;

    if (estado === 'APROBADA') return <ApprovedView />;
    if (estado === 'PENDIENTE') return <PendingView />;

    if (estado === 'NO_INICIADO' || puedeEnviar) {
      return (
        <Stack spacing={4}>
          {estado !== 'RECHAZADA' && <KycInfoCard />}

          {estado === 'RECHAZADA' && (
            <AlertBanner
              severity="error"
              title="Solicitud Rechazada"
              // Casteo seguro porque sabemos que es RECHAZADA
              message={`${(kycStatus as KycStatusWithRecord).motivo_rechazo || 'Documentación inválida.'} — Por favor, corrige los errores y envía nuevamente.`}
            />
          )}

          {formError && (
            <Alert severity="error" onClose={() => setFormError(null)} sx={{ borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          <Box sx={{ width: '100%', px: { xs: 0, md: 4 } }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {['Datos Personales', 'Documentos', 'Confirmar'].map((label, index) => (
                <Step key={label}>
                  <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: 'primary.main' }, '&.Mui-completed': { color: 'success.main' } } }}>
                    <Typography variant="caption" fontWeight={activeStep === index ? 700 : 400}>{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'visible' }}>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              {/* PASO 1: DATOS */}
              {activeStep === 0 && (
                <Stack spacing={4}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Person /></Avatar>
                    <Box><Typography variant="h6" fontWeight={700}>Información Básica</Typography><Typography variant="body2" color="text.secondary">Ingresa tus datos tal cual figuran en tu documento.</Typography></Box>
                  </Box>
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                    <TextField select fullWidth label="Tipo Documento" required value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}>
                      {TIPOS_DOCUMENTO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                    <TextField fullWidth label="Número Documento" required value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
                    <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                      <TextField fullWidth label="Nombre Completo" required helperText="Como aparece en tu DNI/Pasaporte" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
                    </Box>
                    <TextField fullWidth type="date" label="Fecha Nacimiento" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Box>
                </Stack>
              )}

              {/* PASO 2: DOCUMENTOS */}
              {activeStep === 1 && (
                <Stack spacing={4}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><UploadFile /></Avatar>
                      <Box><Typography variant="h6" fontWeight={700}>Carga de Documentos</Typography><Typography variant="body2" color="text.secondary">Sube fotos claras, sin flash y sobre fondo liso.</Typography></Box>
                    </Box>
                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>Formatos aceptados: JPG, PNG.</Alert>
                  </Box>
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                    <FileUploadCard title="Frente DNI *" description="Foto frontal legible" accept="image/*" file={documentoFrente} onFileSelect={(f) => handleSetFile(setDocumentoFrente, f)} onRemove={() => setDocumentoFrente(null)} />
                    <FileUploadCard title="Dorso DNI" description="Reverso del documento" accept="image/*" file={documentoDorso} onFileSelect={(f) => handleSetFile(setDocumentoDorso, f)} onRemove={() => setDocumentoDorso(null)} />
                    <FileUploadCard title="Selfie con DNI *" description="Sostén el DNI junto a tu rostro" accept="image/*" file={selfie} onFileSelect={(f) => handleSetFile(setSelfie, f)} onRemove={() => setSelfie(null)} />
                    <FileUploadCard title="Video (Opcional)" description="Prueba de vida (max 10s)" accept="video/*" file={video} onFileSelect={(f) => handleSetFile(setVideo, f)} onRemove={() => setVideo(null)} />
                  </Box>
                </Stack>
              )}

              {/* PASO 3: CONFIRMACIÓN */}
              {activeStep === 2 && (
                <Stack spacing={4} alignItems="center">
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Assignment /></Avatar>
                    <Box><Typography variant="h6" fontWeight={700}>Resumen de Envío</Typography><Typography variant="body2" color="text.secondary">Revisa que toda la información sea correcta antes de enviar.</Typography></Box>
                  </Box>
                  <Card elevation={0} sx={{ width: '100%', bgcolor: alpha(theme.palette.secondary.main, 0.05), border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
                        <Box><Typography variant="caption" color="text.secondary" fontWeight={700}>NOMBRE COMPLETO</Typography><Typography variant="body1">{nombreCompleto}</Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary" fontWeight={700}>DOCUMENTO</Typography><Typography variant="body1">{tipoDocumento} - {numeroDocumento}</Typography></Box>
                        <Box sx={{ gridColumn: { sm: '1 / -1' } }}><Divider sx={{ my: 1 }} /></Box>
                        <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>ARCHIVOS ADJUNTOS</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {[{ label: 'Frente', file: documentoFrente }, { label: 'Dorso', file: documentoDorso }, { label: 'Selfie', file: selfie }, { label: 'Video', file: video }].filter(item => item.file).map((item) => (
                              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: 10, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}`, fontSize: '0.875rem' }}><RadioButtonUnchecked fontSize="inherit" color="success" /> {item.label}</Box>
                            ))}
                          </Stack>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  <Alert severity="warning" icon={<Badge fontSize="inherit" />} sx={{ width: '100%', borderRadius: 2 }}><Typography variant="body2">Al enviar, declaras bajo juramento que los datos son reales.</Typography></Alert>
                </Stack>
              )}

              <Box mt={6}>
                <Divider sx={{ mb: 3 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Button onClick={handleBack} disabled={activeStep === 0 || uploadMutation.isPending} startIcon={<ArrowBack />} color="inherit" sx={{ color: 'text.secondary', visibility: activeStep === 0 ? 'hidden' : 'visible' }}>Atrás</Button>
                  {activeStep === 2 ? (
                    <Button variant="contained" color="primary" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending} startIcon={uploadMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />} size="large" disableElevation sx={{ px: 4, fontWeight: 700 }}>{uploadMutation.isPending ? 'Enviando...' : 'Confirmar y Enviar'}</Button>
                  ) : (
                    <Button variant="contained" onClick={handleNext} endIcon={<NavigateNext />} size="large" disableElevation>Siguiente</Button>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      );
    }
    return null;
  };

  return (
    <PageContainer maxWidth="md" sx={{ py: 3 }}>
      <PageHeader title="Verificación de Identidad" subtitle="Completa tu perfil para desbloquear todas las funciones de inversión." />
      <QueryHandler isLoading={isLoading} error={error as Error}>
        {renderContent()}
      </QueryHandler>
    </PageContainer>
  );
};

export default VerificacionKYC;