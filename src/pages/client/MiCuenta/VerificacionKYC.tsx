import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Alert, CircularProgress,
  Stepper, Step, StepLabel, TextField, MenuItem,
  AlertTitle, Card, CardContent, Avatar, alpha, useTheme, Divider
} from '@mui/material';
import {
  VerifiedUser, HourglassEmpty, NavigateNext, Send,
  Person, UploadFile, Assignment, ArrowBack, ErrorOutline
} from '@mui/icons-material';

// Servicios y Tipos
import kycService from '../../../Services/kyc.service';
import type { TipoDocumento } from '../../../types/dto/kyc.dto';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { FileUploadCard } from './components/FileUploadCard';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

const TIPOS_DOCUMENTO: TipoDocumento[] = ['DNI', 'PASAPORTE', 'LICENCIA'];

const VerificacionKYC: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();

  // Estados Formulario
  const [activeStep, setActiveStep] = useState(0);
  
  // Datos
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  // Archivos
  const [documentoFrente, setDocumentoFrente] = useState<File | null>(null);
  const [documentoDorso, setDocumentoDorso] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Obtener estado actual
  const { data: kycStatus, isLoading, error } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus,
    retry: false,
  });

  // 2. Pre-llenar si fue rechazado
  useEffect(() => {
    if (kycStatus && kycStatus.estado_verificacion === 'RECHAZADA') {
      if (kycStatus.tipo_documento) setTipoDocumento(kycStatus.tipo_documento);
      setNumeroDocumento(kycStatus.numero_documento || '');
      setNombreCompleto(kycStatus.nombre_completo || '');
      if (kycStatus.fecha_nacimiento) {
        setFechaNacimiento(kycStatus.fecha_nacimiento.toString().split('T')[0]);
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
      setActiveStep(0);
      setUploadError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.mensaje || err.message || 'Error al enviar documentación';
      setUploadError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Navegación
  const handleNext = () => {
    setUploadError(null);
    if (activeStep === 0) {
      if (!tipoDocumento || !numeroDocumento || !nombreCompleto) {
        setUploadError('Completa los campos obligatorios (*).');
        return;
      }
    } else if (activeStep === 1) {
      if (!documentoFrente || !selfie) {
        setUploadError('Debes subir al menos el frente del DNI y la selfie.');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setUploadError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    setUploadError(null);
    uploadMutation.mutate();
  };

  // --- RENDER CONTENT ---

  const renderContent = () => {
    const estado = kycStatus?.estado_verificacion || 'NO_INICIADO';
    const puedeEnviar = kycStatus?.puede_enviar ?? true;

    // ESTADO: APROBADO
    if (estado === 'APROBADA') {
      return (
        <Card 
          elevation={0} 
          sx={{ 
            p: 5, textAlign: 'center', 
            bgcolor: alpha(theme.palette.success.main, 0.05), 
            border: `1px solid ${theme.palette.success.main}`,
            borderRadius: 3
          }}
        >
          <Avatar 
            sx={{ 
              width: 80, height: 80, mx: 'auto', mb: 2,
              bgcolor: alpha(theme.palette.success.main, 0.15),
              color: 'success.main'
            }}
          >
            <VerifiedUser sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight="bold" color="success.dark">¡Identidad Verificada!</Typography>
          <Typography color="text.secondary" mt={1}>Tu cuenta está operativa al 100%.</Typography>
        </Card>
      );
    }

    // ESTADO: PENDIENTE
    if (estado === 'PENDIENTE') {
      return (
        <Card 
          elevation={0} 
          sx={{ 
            p: 5, textAlign: 'center', 
            bgcolor: alpha(theme.palette.warning.main, 0.05), 
            border: `1px solid ${theme.palette.warning.main}`,
            borderRadius: 3
          }}
        >
          <Avatar 
            sx={{ 
              width: 80, height: 80, mx: 'auto', mb: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              color: 'warning.main'
            }}
          >
            <HourglassEmpty sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight="bold" color="warning.dark">En Revisión</Typography>
          <Typography color="text.secondary" mt={2} maxWidth={500} mx="auto">
            Tus documentos están siendo analizados por nuestro equipo de compliance. Recibirás una notificación en cuanto termine el proceso.
          </Typography>
        </Card>
      );
    }

    // ESTADO: FORMULARIO (Inicio o Rechazo)
    if (estado === 'NO_INICIADO' || (estado === 'RECHAZADA' && puedeEnviar)) {
      return (
        <Stack spacing={4}>
          {estado === 'RECHAZADA' && (
            <Alert 
              severity="error" 
              variant="outlined" 
              icon={<ErrorOutline fontSize="inherit" />}
              sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px solid ${theme.palette.error.main}` }}
            >
              <AlertTitle fontWeight={700}>Solicitud Rechazada</AlertTitle>
              {kycStatus?.motivo_rechazo || 'Documentación inválida.'} — Por favor, corrige los errores y envía nuevamente.
            </Alert>
          )}

          {uploadError && <Alert severity="error" onClose={() => setUploadError(null)}>{uploadError}</Alert>}

          {/* Stepper Personalizado */}
          <Box sx={{ width: '100%' }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {['Datos Personales', 'Documentos', 'Confirmar'].map((label, index) => (
                <Step key={label}>
                  <StepLabel 
                    StepIconProps={{
                      sx: { 
                        '&.Mui-active': { color: 'primary.main' },
                        '&.Mui-completed': { color: 'success.main' },
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Card 
            elevation={0} 
            sx={{ 
              border: `1px solid ${theme.palette.secondary.dark}`,
              bgcolor: 'background.default',
              borderRadius: 3
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              
              {/* PASO 1: DATOS */}
              {activeStep === 0 && (
                <Stack spacing={3}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>Información Básica</Typography>
                  </Box>
                  <Divider />
                  
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                    <TextField 
                      select fullWidth label="Tipo Documento *" 
                      value={tipoDocumento} 
                      onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                    >
                      {TIPOS_DOCUMENTO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                    <TextField fullWidth label="Número Documento *" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
                    <TextField fullWidth label="Nombre Completo *" helperText="Tal cual figura en el documento" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
                    <TextField fullWidth type="date" label="Fecha Nacimiento" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Box>
                </Stack>
              )}

              {/* PASO 2: ARCHIVOS */}
              {activeStep === 1 && (
                <Stack spacing={3}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <UploadFile />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>Carga de Documentos</Typography>
                  </Box>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>Asegúrate de que el texto sea legible, sin reflejos y el documento esté vigente.</Alert>
                  
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                    <FileUploadCard
                      title="Frente DNI *"
                      description="Foto frontal clara"
                      accept="image/*"
                      file={documentoFrente}
                      onFileSelect={setDocumentoFrente}
                      onRemove={() => setDocumentoFrente(null)}
                    />
                    <FileUploadCard
                      title="Dorso DNI"
                      description="Reverso del documento"
                      accept="image/*"
                      file={documentoDorso}
                      onFileSelect={setDocumentoDorso}
                      onRemove={() => setDocumentoDorso(null)}
                    />
                    <FileUploadCard
                      title="Selfie con DNI *"
                      description="Sostén el DNI junto a tu rostro"
                      accept="image/*"
                      file={selfie}
                      onFileSelect={setSelfie}
                      onRemove={() => setSelfie(null)}
                    />
                    <FileUploadCard
                      title="Video (Opcional)"
                      description="Prueba de vida (max 10s)"
                      accept="video/*"
                      file={video}
                      onFileSelect={setVideo}
                      onRemove={() => setVideo(null)}
                    />
                  </Box>
                </Stack>
              )}

              {/* PASO 3: CONFIRMACIÓN */}
              {activeStep === 2 && (
                <Stack spacing={3} alignItems="center" py={2}>
                  <Box display="flex" alignItems="center" gap={2} mb={1} width="100%">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <Assignment />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>Resumen de Envío</Typography>
                  </Box>

                  <Card 
                    elevation={0} 
                    sx={{ 
                      p: 3, width: '100%', 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                      border: `1px solid ${theme.palette.divider}` 
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">NOMBRE COMPLETO</Typography>
                      <Typography variant="body1" fontWeight={600}>{nombreCompleto}</Typography>
                      <Divider sx={{ my: 1 }} />
                      
                      <Typography variant="body2" color="text.secondary">DOCUMENTO</Typography>
                      <Typography variant="body1" fontWeight={600}>{tipoDocumento} - {numeroDocumento}</Typography>
                      <Divider sx={{ my: 1 }} />

                      <Typography variant="body2" color="text.secondary">ADJUNTOS</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {[documentoFrente, documentoDorso, selfie, video].filter(Boolean).length} archivos listos para subir
                      </Typography>
                    </Stack>
                  </Card>

                  <Alert severity="warning" sx={{ width: '100%', borderRadius: 2 }}>
                    Declaras bajo juramento que los datos proporcionados son reales, actuales y te pertenecen.
                  </Alert>
                </Stack>
              )}

              {/* BOTONES */}
              <Stack direction="row" justifyContent="space-between" mt={5}>
                <Button 
                  onClick={handleBack} 
                  disabled={activeStep === 0 || uploadMutation.isPending}
                  startIcon={<ArrowBack />}
                  color="inherit"
                >
                  Atrás
                </Button>
                
                {activeStep === 2 ? (
                  <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={uploadMutation.isPending} 
                    startIcon={uploadMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    sx={{ px: 4 }}
                  >
                    {uploadMutation.isPending ? 'Enviando...' : 'Confirmar y Enviar'}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext} endIcon={<NavigateNext />}>
                    Siguiente
                  </Button>
                )}
              </Stack>

            </CardContent>
          </Card>
        </Stack>
      );
    }

    return null;
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader 
        title="Verificación de Identidad" 
        subtitle="Completa el proceso KYC para validar tu cuenta y operar con seguridad."
      />
      
      <QueryHandler isLoading={isLoading} error={error as Error}>
        {renderContent()}
      </QueryHandler>
    </PageContainer>
  );
};

export default VerificacionKYC;