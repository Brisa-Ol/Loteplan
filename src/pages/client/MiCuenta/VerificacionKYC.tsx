// src/pages/Client/Kyc/VerificacionKYC.tsx

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Alert, CircularProgress,
  Stepper, Step, StepLabel, TextField, MenuItem,
  AlertTitle, Card, CardContent, Avatar, alpha, useTheme, Divider
} from '@mui/material';
import {
  VerifiedUser, HourglassEmpty, NavigateNext, Send,
  Person, UploadFile, Assignment, ArrowBack, ErrorOutline,
  RadioButtonUnchecked
} from '@mui/icons-material';


import type { TipoDocumento } from '../../../types/dto/kyc.dto';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { FileUploadCard } from './components/FileUploadCard';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import kycService from '../../../services/kyc.service';

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
      // Invalida para que la UI cambie a "PENDIENTE" automáticamente
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      setActiveStep(0);
      setUploadError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      // Manejo inteligente de errores del backend
      const errorData = err.response?.data;
      
      // Si el error es porque ya existe una solicitud, recargamos el estado
      if (errorData?.tipo === 'SOLICITUD_PENDIENTE' || errorData?.tipo === 'YA_VERIFICADO') {
         queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
         return;
      }

      const errorMsg = errorData?.mensaje || err.message || 'Error al enviar documentación';
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
            p: 6, textAlign: 'center', 
            bgcolor: alpha(theme.palette.success.main, 0.05), 
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            borderRadius: 4
          }}
        >
          <Avatar 
            sx={{ 
              width: 96, height: 96, mx: 'auto', mb: 3,
              bgcolor: alpha(theme.palette.success.main, 0.15),
              color: 'success.main'
            }}
          >
            <VerifiedUser sx={{ fontSize: 48 }} />
          </Avatar>
          <Typography variant="h3" fontWeight="bold" color="success.dark" gutterBottom>
            ¡Identidad Verificada!
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={600} mx="auto">
            Tu cuenta está operativa al 100%. Ya puedes acceder a todas las funciones de inversión y subasta.
          </Typography>
          <Button 
            variant="contained" 
            color="success" 
            size="large" 
            sx={{ mt: 4, px: 4, borderRadius: 2 }}
            onClick={() => window.location.href = '/client/dashboard'}
          >
            Ir al Dashboard
          </Button>
        </Card>
      );
    }

    // ESTADO: PENDIENTE
    if (estado === 'PENDIENTE') {
      return (
        <Card 
          elevation={0} 
          sx={{ 
            p: 6, textAlign: 'center', 
            bgcolor: alpha(theme.palette.warning.main, 0.05), 
            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            borderRadius: 4
          }}
        >
          <Avatar 
            sx={{ 
              width: 96, height: 96, mx: 'auto', mb: 3,
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              color: 'warning.main'
            }}
          >
            <HourglassEmpty sx={{ fontSize: 48 }} />
          </Avatar>
          <Typography variant="h3" fontWeight="bold" color="warning.dark" gutterBottom>
            Verificación en Proceso
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={500} mx="auto">
            Tus documentos están siendo analizados por nuestro equipo de compliance. Recibirás una notificación en cuanto termine el proceso (usualmente 24-48hs).
          </Typography>
        </Card>
      );
    }

    // ESTADO: FORMULARIO (Inicio o Rechazo)
    // Mostramos el form si es 'NO_INICIADO' O si 'puede_enviar' es true (caso rechazo)
    if (estado === 'NO_INICIADO' || puedeEnviar) {
      return (
        <Stack spacing={4}>
          
          {/* Mensaje de Rechazo */}
          {estado === 'RECHAZADA' && (
            <Alert 
              severity="error" 
              variant="filled"
              icon={<ErrorOutline fontSize="inherit" />}
              sx={{ borderRadius: 2, fontWeight: 500 }}
            >
              <AlertTitle fontWeight={700}>Solicitud Rechazada</AlertTitle>
              {kycStatus?.motivo_rechazo || 'Documentación inválida.'} — Por favor, corrige los errores indicados y envía nuevamente.
            </Alert>
          )}

          {/* Error de Subida */}
          {uploadError && (
            <Alert severity="error" onClose={() => setUploadError(null)} sx={{ borderRadius: 2 }}>
              {uploadError}
            </Alert>
          )}

          {/* Stepper */}
          <Box sx={{ width: '100%', px: { xs: 0, md: 4 } }}>
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
                    <Typography variant="caption" fontWeight={activeStep === index ? 700 : 400}>
                        {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Contenedor Principal del Formulario */}
          <Card 
            elevation={0} 
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              borderRadius: 3,
              overflow: 'visible'
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              
              {/* PASO 1: DATOS PERSONALES */}
              {activeStep === 0 && (
                <Stack spacing={4}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Información Básica</Typography>
                        <Typography variant="body2" color="text.secondary">Ingresa tus datos tal cual figuran en tu documento.</Typography>
                    </Box>
                  </Box>
                  
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        <TextField 
                            select fullWidth label="Tipo Documento" required
                            value={tipoDocumento} 
                            onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                        >
                            {TIPOS_DOCUMENTO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </TextField>

                        <TextField 
                            fullWidth label="Número Documento" required
                            value={numeroDocumento} 
                            onChange={(e) => setNumeroDocumento(e.target.value)} 
                        />

                        <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                            <TextField 
                                fullWidth label="Nombre Completo" required
                                helperText="Como aparece en tu DNI/Pasaporte"
                                value={nombreCompleto} 
                                onChange={(e) => setNombreCompleto(e.target.value)} 
                            />
                        </Box>

                        <TextField 
                            fullWidth type="date" label="Fecha Nacimiento" 
                            value={fechaNacimiento} 
                            onChange={(e) => setFechaNacimiento(e.target.value)} 
                            InputLabelProps={{ shrink: true }} 
                        />
                  </Box>
                </Stack>
              )}

              {/* PASO 2: DOCUMENTOS */}
              {activeStep === 1 && (
                <Stack spacing={4}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        <UploadFile />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Carga de Documentos</Typography>
                            <Typography variant="body2" color="text.secondary">Sube fotos claras, sin flash y sobre fondo liso.</Typography>
                        </Box>
                    </Box>
                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, borderColor: theme.palette.divider }}>
                        Formatos aceptados: JPG, PNG. Tamaño máximo: 5MB.
                    </Alert>
                  </Box>
                  
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                      <FileUploadCard
                        title="Frente DNI *"
                        description="Foto frontal legible"
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
                <Stack spacing={4} alignItems="center">
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <Assignment />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Resumen de Envío</Typography>
                        <Typography variant="body2" color="text.secondary">Revisa que toda la información sea correcta antes de enviar.</Typography>
                    </Box>
                  </Box>

                  <Card 
                    elevation={0} 
                    sx={{ 
                      width: '100%', 
                      bgcolor: alpha(theme.palette.secondary.main, 0.05), 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
                          <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>NOMBRE COMPLETO</Typography>
                              <Typography variant="body1">{nombreCompleto}</Typography>
                          </Box>
                          <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>DOCUMENTO</Typography>
                              <Typography variant="body1">{tipoDocumento} - {numeroDocumento}</Typography>
                          </Box>
                          
                          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                              <Divider sx={{ my: 1 }} />
                          </Box>

                          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>ARCHIVOS ADJUNTOS</Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  {[
                                      { label: 'Frente', file: documentoFrente },
                                      { label: 'Dorso', file: documentoDorso },
                                      { label: 'Selfie', file: selfie },
                                      { label: 'Video', file: video }
                                  ].filter(item => item.file).map((item) => (
                                      <Box 
                                        key={item.label}
                                        sx={{ 
                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                            px: 1.5, py: 0.5, borderRadius: 10,
                                            bgcolor: 'background.paper',
                                            border: `1px solid ${theme.palette.divider}`,
                                            fontSize: '0.875rem'
                                        }}
                                      >
                                          <RadioButtonUnchecked fontSize="inherit" color="success" /> {item.label}
                                      </Box>
                                  ))}
                              </Stack>
                          </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Alert 
                    severity="warning" 
                    icon={<RadioButtonUnchecked fontSize="inherit" />}
                    sx={{ width: '100%', borderRadius: 2 }}
                  >
                    <Typography variant="body2">
                        Al enviar, declaras bajo juramento que los datos proporcionados son reales, actuales y te pertenecen.
                    </Typography>
                  </Alert>
                </Stack>
              )}

              {/* BOTONES DE NAVEGACIÓN */}
              <Box mt={6}>
                  <Divider sx={{ mb: 3 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Button 
                        onClick={handleBack} 
                        disabled={activeStep === 0 || uploadMutation.isPending}
                        startIcon={<ArrowBack />}
                        color="inherit"
                        sx={{ color: 'text.secondary' }}
                    >
                        Atrás
                    </Button>
                    
                    {activeStep === 2 ? (
                        <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleSubmit} 
                        disabled={uploadMutation.isPending} 
                        startIcon={uploadMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                        size="large"
                        disableElevation
                        sx={{ px: 4, fontWeight: 700 }}
                        >
                        {uploadMutation.isPending ? 'Enviando...' : 'Confirmar y Enviar'}
                        </Button>
                    ) : (
                        <Button 
                            variant="contained" 
                            onClick={handleNext} 
                            endIcon={<NavigateNext />}
                            size="large"
                            disableElevation
                        >
                        Siguiente
                        </Button>
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