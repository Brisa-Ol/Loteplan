import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, Typography, Button, Stack, Alert, CircularProgress, 
  Stepper, Step, StepLabel, AlertTitle 
} from '@mui/material';
import { VerifiedUser, GppBad, HourglassEmpty } from '@mui/icons-material';
import KycService from '../../../Services/kyc.service';
import type { SubmitKycDto } from '../../../types/dto/kyc.dto';
import { FileUploadCard } from '../../../components/FileUploadCard/FileUploadCard';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';


const VerificacionKYC: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Estados locales para los archivos
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Consultar Estado Actual
  const { data: kycStatus, isLoading, error } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: async () => (await KycService.getStatus()).data
  });

  // 2. Mutación de Subida
  const uploadMutation = useMutation({
    mutationFn: async (data: SubmitKycDto) => {
      await KycService.submit(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      window.scrollTo(0, 0);
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.error || 'Error al subir los documentos.');
    }
  });

  const handleSubmit = () => {
    if (!front || !back || !selfie || !video) {
      setUploadError("Por favor, carga todos los documentos requeridos.");
      return;
    }
    setUploadError(null);
    uploadMutation.mutate({
      documento_frente: front,
      documento_dorso: back,
      selfie_con_documento: selfie,
      video_verificacion: video
    });
  };

  // --- VISTAS SEGÚN ESTADO ---

  const renderContent = () => {
    const estado = kycStatus?.estado_verificacion || 'NO_INICIADO';

    // CASO 1: APROBADA ✅
    if (estado === 'APROBADA') {
      return (
        <Box textAlign="center" py={5}>
          <VerifiedUser sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>¡Identidad Verificada!</Typography>
          <Typography color="text.secondary">
            Tu cuenta está completamente validada. Ya puedes invertir y participar en subastas sin restricciones.
          </Typography>
        </Box>
      );
    }

    // CASO 2: PENDIENTE ⏳
    if (estado === 'PENDIENTE') {
      return (
        <Box textAlign="center" py={5}>
          <HourglassEmpty sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>Verificación en Proceso</Typography>
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
            Hemos recibido tus documentos y nuestro equipo los está revisando. 
            Este proceso suele tomar entre 24 y 48 horas. Te notificaremos por email.
          </Alert>
        </Box>
      );
    }

    // CASO 3: RECHAZADA o NO INICIADO (Mostrar Formulario)
    return (
      <Stack spacing={4}>
        {estado === 'RECHAZADA' && (
          <Alert severity="error">
            <AlertTitle>Verificación Rechazada</AlertTitle>
            Motivo: {kycStatus?.comentarios_rechazo || 'Documentos ilegibles o inválidos.'}
            <br /> Por favor, vuelve a subir la documentación corrigiendo el error.
          </Alert>
        )}

        <Box>
          <Typography variant="h5" gutterBottom>Carga de Documentación</Typography>
          <Typography color="text.secondary">
            Necesitamos validar tu identidad para cumplir con las regulaciones financieras.
            Tus datos están protegidos y encriptados.
          </Typography>
        </Box>

        {uploadError && <Alert severity="error">{uploadError}</Alert>}

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
          <FileUploadCard 
            title="DNI (Frente)" 
            description="Foto clara del frente de tu documento."
            accept="image/*"
            file={front}
            onFileSelect={setFront}
            onRemove={() => setFront(null)}
          />
          <FileUploadCard 
            title="DNI (Dorso)" 
            description="Foto clara del dorso de tu documento."
            accept="image/*"
            file={back}
            onFileSelect={setBack}
            onRemove={() => setBack(null)}
          />
          <FileUploadCard 
            title="Selfie con DNI" 
            description="Foto tuya sosteniendo tu DNI junto a tu rostro."
            accept="image/*"
            file={selfie}
            onFileSelect={setSelfie}
            onRemove={() => setSelfie(null)}
          />
          <FileUploadCard 
            title="Video de Prueba de Vida" 
            description="Video corto (5s) diciendo tu nombre y fecha de hoy."
            accept="video/*"
            file={video}
            onFileSelect={setVideo}
            onRemove={() => setVideo(null)}
          />
        </Box>

        <Box textAlign="center" mt={2}>
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleSubmit}
            disabled={uploadMutation.isPending}
            sx={{ minWidth: 200 }}
          >
            {uploadMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Enviar a Revisión'}
          </Button>
        </Box>
      </Stack>
    );
  };

  return (
    <PageContainer maxWidth="md">
      <QueryHandler isLoading={isLoading} error={error as Error} loadingMessage="Verificando estado...">
        {renderContent()}
      </QueryHandler>
    </PageContainer>
  );
};

export default VerificacionKYC;