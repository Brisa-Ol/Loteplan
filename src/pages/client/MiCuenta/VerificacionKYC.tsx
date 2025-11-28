// src/pages/client/MiCuenta/VerificacionKYC.tsx
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Alert, 
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  TextField,
  MenuItem,
  AlertTitle,
  Divider,
} from '@mui/material';
import { 
  VerifiedUser, 
  GppBad, 
  HourglassEmpty,
  NavigateNext,
  Send,
} from '@mui/icons-material';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import KycService from '../../../Services/kyc.service';
import type { TipoDocumento } from '../../../types/dto/kyc.dto';
import { FileUploadCard } from './components/FileUploadCard';

const TIPOS_DOCUMENTO: TipoDocumento[] = ['DNI', 'PASAPORTE', 'LICENCIA'];

const VerificacionKYC: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Estados para el formulario
  const [activeStep, setActiveStep] = useState(0);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  
  // Estados para archivos
  const [documentoFrente, setDocumentoFrente] = useState<File | null>(null);
  const [documentoDorso, setDocumentoDorso] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Query para obtener estado actual
  const { data: kycStatus, isLoading, error } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: KycService.getStatus,
    retry: false,
  });

  // Mutación de envío
  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Validaciones
      if (!tipoDocumento || !numeroDocumento || !nombreCompleto) {
        throw new Error('Completa todos los campos obligatorios');
      }
      if (!documentoFrente || !selfie) {
        throw new Error('Debes subir el documento (frente) y la selfie');
      }

      return await KycService.submit({
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        nombre_completo: nombreCompleto,
        fecha_nacimiento: fechaNacimiento || undefined,
        documento_frente: documentoFrente,
        documento_dorso: documentoDorso || undefined,
        selfie_con_documento: selfie,
        video_verificacion: video || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      setActiveStep(0); // Reset form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.message || err.message || 'Error al enviar documentos';
      setUploadError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const handleNext = () => {
    setUploadError(null);
    
    if (activeStep === 0) {
      // Validar paso 1: Datos personales
      if (!tipoDocumento || !numeroDocumento || !nombreCompleto) {
        setUploadError('Completa todos los campos obligatorios');
        return;
      }
    } else if (activeStep === 1) {
      // Validar paso 2: Documentos
      if (!documentoFrente || !selfie) {
        setUploadError('Debes subir al menos el documento (frente) y la selfie');
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

  // ─────────────────────────────────────────────────────────
  // RENDERIZADO SEGÚN ESTADO
  // ─────────────────────────────────────────────────────────

  const renderStatusView = () => {
    const estado = kycStatus?.estado_verificacion || 'NO_INICIADO';

    // ✅ APROBADA
    if (estado === 'APROBADA') {
      return (
        <Paper elevation={2} sx={{ p: 5, textAlign: 'center' }}>
          <VerifiedUser sx={{ fontSize: 100, color: 'success.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            ¡Identidad Verificada!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Tu cuenta está completamente validada. Ya puedes invertir y participar en subastas sin restricciones.
          </Typography>
        </Paper>
      );
    }

    // ⏳ PENDIENTE
    if (estado === 'PENDIENTE') {
      return (
        <Paper elevation={2} sx={{ p: 5, textAlign: 'center' }}>
          <HourglassEmpty sx={{ fontSize: 100, color: 'warning.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Verificación en Proceso
          </Typography>
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mt: 3, textAlign: 'left' }}>
            <AlertTitle>Tu solicitud está siendo revisada</AlertTitle>
            Hemos recibido tus documentos y nuestro equipo los está revisando. 
            Este proceso suele tomar entre <strong>24 y 48 horas</strong>. 
            Te notificaremos por email cuando la revisión esté completa.
          </Alert>
        </Paper>
      );
    }

    // ❌ RECHAZADA - Mostrar formulario con alerta
    if (estado === 'RECHAZADA') {
      return renderFormView(true);
    }

    // 🆕 NO INICIADO - Mostrar formulario
    return renderFormView(false);
  };

  const renderFormView = (isRejected: boolean) => {
    const steps = ['Datos Personales', 'Documentos', 'Confirmación'];

    return (
      <Stack spacing={4}>
        {isRejected && (
          <Alert severity="error">
            <AlertTitle>Verificación Rechazada</AlertTitle>
            <strong>Motivo:</strong> {kycStatus?.motivo_rechazo || 'Documentos no válidos'}
            <br />
            Por favor, vuelve a subir la documentación corrigiendo los errores indicados.
          </Alert>
        )}

        {!isRejected && (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Verificación de Identidad (KYC)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Para cumplir con las regulaciones financieras, necesitamos validar tu identidad.
              Tus datos están protegidos y encriptados según normas de seguridad internacionales.
            </Typography>
          </Box>
        )}

        {uploadError && (
          <Alert severity="error" onClose={() => setUploadError(null)}>
            {uploadError}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={2} sx={{ p: 4 }}>
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Typography variant="h6" gutterBottom>
                Paso 1: Información Personal
              </Typography>
              <Divider />
              
              <TextField
                select
                fullWidth
                label="Tipo de Documento"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                required
              >
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Número de Documento"
                placeholder="Ej: 12345678"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                required
              />

              <TextField
                fullWidth
                label="Nombre Completo"
                placeholder="Tal como aparece en tu documento"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required
              />

              <TextField
                fullWidth
                type="date"
                label="Fecha de Nacimiento"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Opcional, pero ayuda en la verificación"
              />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6" gutterBottom>
                Paso 2: Documentación
              </Typography>
              <Divider />
              
              <Alert severity="info" icon={false}>
                <AlertTitle>Requisitos de las fotos:</AlertTitle>
                • Las imágenes deben ser claras y legibles<br />
                • Evita reflejos y sombras<br />
                • Asegúrate de que todos los datos sean visibles<br />
                • El video debe durar entre 3 y 10 segundos
              </Alert>

              <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                <FileUploadCard 
                  title="Documento (Frente) *" 
                  description="Foto clara del frente de tu documento"
                  accept="image/*"
                  file={documentoFrente}
                  onFileSelect={setDocumentoFrente}
                  onRemove={() => setDocumentoFrente(null)}
                />
                
                <FileUploadCard 
                  title="Documento (Dorso)" 
                  description="Foto clara del dorso (opcional si es DNI)"
                  accept="image/*"
                  file={documentoDorso}
                  onFileSelect={setDocumentoDorso}
                  onRemove={() => setDocumentoDorso(null)}
                />
                
                <FileUploadCard 
                  title="Selfie con Documento *" 
                  description="Foto tuya sosteniendo tu documento junto a tu rostro"
                  accept="image/*"
                  file={selfie}
                  onFileSelect={setSelfie}
                  onRemove={() => setSelfie(null)}
                />
                
                <FileUploadCard 
                  title="Video de Prueba de Vida" 
                  description="Video corto (5s) diciendo tu nombre y fecha de hoy"
                  accept="video/*"
                  file={video}
                  onFileSelect={setVideo}
                  onRemove={() => setVideo(null)}
                />
              </Box>
            </Stack>
          )}

          {activeStep === 2 && (
            <Stack spacing={3}>
              <Typography variant="h6" gutterBottom>
                Paso 3: Confirmar y Enviar
              </Typography>
              <Divider />

              <Alert severity="warning">
                <AlertTitle>Antes de enviar, verifica:</AlertTitle>
                • Todos los datos son correctos<br />
                • Las fotos son nítidas y legibles<br />
                • La selfie muestra claramente tu rostro y el documento<br />
                • No olvides que este proceso puede tomar hasta 48 horas
              </Alert>

              <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Resumen de tu solicitud:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Documento:</strong> {tipoDocumento} - {numeroDocumento}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nombre:</strong> {nombreCompleto}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Archivos subidos:</strong> {
                      [documentoFrente, documentoDorso, selfie, video]
                        .filter(Boolean).length
                    } / 4
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button 
              onClick={handleBack} 
              disabled={activeStep === 0 || uploadMutation.isPending}
            >
              Atrás
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={uploadMutation.isPending}
                startIcon={uploadMutation.isPending ? <CircularProgress size={20} /> : <Send />}
              >
                {uploadMutation.isPending ? 'Enviando...' : 'Enviar a Revisión'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NavigateNext />}
              >
                Siguiente
              </Button>
            )}
          </Stack>
        </Paper>
      </Stack>
    );
  };

  return (
    <PageContainer maxWidth="md">
      <QueryHandler 
        isLoading={isLoading} 
        error={error as Error} 
        loadingMessage="Verificando estado de KYC..."
      >
        {renderStatusView()}
      </QueryHandler>
    </PageContainer>
  );
};

export default VerificacionKYC;