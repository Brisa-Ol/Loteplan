import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Stack, Alert, CircularProgress,
  Stepper, Step, StepLabel, Paper, TextField, MenuItem,
  AlertTitle, Divider,
} from '@mui/material';
import {
  VerifiedUser, HourglassEmpty, NavigateNext, Send,
} from '@mui/icons-material';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';


import type { TipoDocumento } from '../../../types/dto/kyc.dto';
import kycService from '../../../Services/kyc.service';
import { FileUploadCard } from './components/FileUploadCard';

const TIPOS_DOCUMENTO: TipoDocumento[] = ['DNI', 'PASAPORTE', 'LICENCIA'];

const VerificacionKYC: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados Formulario
  const [activeStep, setActiveStep] = useState(0);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  // Estados Archivos
  const [documentoFrente, setDocumentoFrente] = useState<File | null>(null);
  const [documentoDorso, setDocumentoDorso] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Obtener estado
  const { data: kycStatus, isLoading, error } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus,
    retry: false, // Si falla la autenticación, no reintentar infinitamente
  });

  // 2. Rellenar si fue rechazado
  useEffect(() => {
    if (kycStatus && kycStatus.estado_verificacion === 'RECHAZADA') {
      setTipoDocumento(kycStatus.tipo_documento || 'DNI');
      setNumeroDocumento(kycStatus.numero_documento || '');
      setNombreCompleto(kycStatus.nombre_completo || '');
      // Corrección de Fecha: Asegurar formato YYYY-MM-DD para el input type="date"
      if (kycStatus.fecha_nacimiento) {
        setFechaNacimiento(kycStatus.fecha_nacimiento.split('T')[0]);
      }
    }
  }, [kycStatus]);

  // 3. Mutación de envío (Con Geo)
  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Validaciones
      if (!tipoDocumento || !numeroDocumento || !nombreCompleto) throw new Error('Completa los datos personales.');
      if (!documentoFrente || !selfie) throw new Error('Falta foto del documento o selfie.');

      // 🌍 Intentar obtener ubicación (Silenciosamente)
      let lat, lng;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (e) {
        console.warn('No se pudo obtener ubicación, enviando sin geo.');
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
        latitud_verificacion: lat,   // ✅ Se envía al backend
        longitud_verificacion: lng,  // ✅ Se envía al backend
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

  // Handlers de navegación
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

  // --- RENDERERS ---

  // Vista condicional según estado
  const renderContent = () => {
    const estado = kycStatus?.estado_verificacion || 'NO_INICIADO';
    const puedeEnviar = kycStatus?.puede_enviar ?? true;

    if (estado === 'APROBADA') {
      return (
        <Paper elevation={0} variant="outlined" sx={{ p: 5, textAlign: 'center', bgcolor: 'success.lighter', borderColor: 'success.light' }}>
          <VerifiedUser sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" color="success.dark">¡Identidad Verificada!</Typography>
          <Typography color="text.secondary" mt={1}>Tu cuenta está operativa al 100%.</Typography>
        </Paper>
      );
    }

    if (estado === 'PENDIENTE') {
      return (
        <Paper elevation={0} variant="outlined" sx={{ p: 5, textAlign: 'center', bgcolor: 'warning.lighter', borderColor: 'warning.light' }}>
          <HourglassEmpty sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" color="warning.dark">En Revisión</Typography>
          <Alert severity="warning" sx={{ mt: 3, mx: 'auto', maxWidth: 500 }}>
            Tus documentos están siendo analizados por nuestro equipo.
          </Alert>
        </Paper>
      );
    }

    // Caso: NO_INICIADO o RECHAZADA (si puede reintentar)
    if (estado === 'NO_INICIADO' || (estado === 'RECHAZADA' && puedeEnviar)) {
      return renderForm(estado === 'RECHAZADA');
    }

    return null; // Fallback seguro
  };

  const renderForm = (isRejected: boolean) => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>Verificación de Identidad</Typography>
        <Typography color="text.secondary">Completa los pasos para validar tu cuenta.</Typography>
      </Box>

      {isRejected && (
        <Alert severity="error" variant="filled">
          <AlertTitle>Solicitud Rechazada</AlertTitle>
          {kycStatus?.motivo_rechazo || 'Documentación inválida.'} — Por favor, corrige y reenvía.
        </Alert>
      )}

      {uploadError && <Alert severity="error" onClose={() => setUploadError(null)}>{uploadError}</Alert>}

      <Stepper activeStep={activeStep} alternativeLabel>
        {['Datos Personales', 'Documentos', 'Confirmar'].map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
      </Stepper>

      <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, md: 4 } }}>
        {activeStep === 0 && (
          <Stack spacing={3}>
            <TextField select fullWidth label="Tipo Documento *" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as any)}>
              {TIPOS_DOCUMENTO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Número Documento *" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
            <TextField fullWidth label="Nombre Completo *" helperText="Tal cual figura en el DNI" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
            <TextField fullWidth type="date" label="Fecha Nacimiento" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={3}>
            <Alert severity="info">Asegúrate de que el texto sea legible y no haya reflejos.</Alert>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
              <FileUploadCard
                title="Frente DNI *"
                description="Foto frontal clara"
                accept="image/*"  // ✅ AGREGADO
                file={documentoFrente}
                onFileSelect={setDocumentoFrente}
                onRemove={() => setDocumentoFrente(null)}
              />
              <FileUploadCard
                title="Dorso DNI"
                description="Reverso del documento"
                accept="image/*"  // ✅ AGREGADO
                file={documentoDorso}
                onFileSelect={setDocumentoDorso}
                onRemove={() => setDocumentoDorso(null)}
              />
              <FileUploadCard
                title="Selfie con DNI *"
                description="Sostén el DNI junto a tu rostro"
                accept="image/*"  // ✅ AGREGADO
                file={selfie}
                onFileSelect={setSelfie}
                onRemove={() => setSelfie(null)}
              />
              {/* El video ya lo tenía bien */}
              <FileUploadCard
                title="Video (Opcional)"
                description="Prueba de vida corta"
                accept="video/*"
                file={video}
                onFileSelect={setVideo}
                onRemove={() => setVideo(null)}
              />
            </Box>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={2} alignItems="center" py={2}>
            <Typography variant="h6">Resumen de envío</Typography>
            <Paper sx={{ p: 2, width: '100%', bgcolor: 'grey.50' }}>
              <Typography variant="body2"><strong>Usuario:</strong> {nombreCompleto}</Typography>
              <Typography variant="body2"><strong>Doc:</strong> {tipoDocumento} - {numeroDocumento}</Typography>
              <Typography variant="body2"><strong>Archivos:</strong> {[documentoFrente, documentoDorso, selfie, video].filter(Boolean).length} adjuntos</Typography>
            </Paper>
            <Alert severity="warning" sx={{ width: '100%' }}>Declaras bajo juramento que los datos son reales.</Alert>
          </Stack>
        )}

        <Stack direction="row" justifyContent="space-between" mt={4}>
          <Button onClick={handleBack} disabled={activeStep === 0 || uploadMutation.isPending}>Atrás</Button>
          {activeStep === 2 ? (
            <Button variant="contained" onClick={handleSubmit} disabled={uploadMutation.isPending} startIcon={uploadMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}>
              {uploadMutation.isPending ? 'Enviando...' : 'Confirmar y Enviar'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext} endIcon={<NavigateNext />}>Siguiente</Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <PageContainer maxWidth="md">
      <QueryHandler isLoading={isLoading} error={error as Error}>
        {renderContent()}
      </QueryHandler>
    </PageContainer>
  );
};

export default VerificacionKYC;