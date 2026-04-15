import React from 'react';
import { Box, Stepper, Step, StepLabel, Card, CardContent, Button, Stack, Divider, Alert, CircularProgress } from '@mui/material';
import { ArrowBack, NavigateNext, Send } from '@mui/icons-material';
import { PageContainer, PageHeader, QueryHandler } from '@/shared';
import AlertBanner from '@/shared/components/ui/Alertbanner';

import { useKYCLogic } from './hooks/useKYCLogic';
import { ApprovedView, PendingView, KycInfoCard } from './components/StatusViews';
import { StepData } from './components/StepData';
import { StepFiles } from './components/StepFiles';
import { StepConfirm } from './components/StepConfirm';
import type { KycStatusWithRecord } from '@/core/types/kyc.dto';

const VerificacionKYC: React.FC = () => {
  const {
    kycStatus, isLoading, error, activeStep, personalData, setPersonalData,
    files, setFiles, formError, setFormError, uploadMutation, handleNext, handleBack, stepDataRef 
  } = useKYCLogic();

  const renderStep = () => {
    const commonFileProps = {
      files,
      onFileChange: (key: string, val: File | null) =>
        setFiles(prev => ({ ...prev, [key]: val })),
    };

    switch (activeStep) {
      case 0:
        return (
          <StepData
            ref={stepDataRef}
            data={personalData}
            onChange={setPersonalData}
          />
        );
      case 1: return <StepFiles {...commonFileProps} />;
      case 2: return <StepConfirm data={personalData} files={files} />;
      default: return null;
    }
  };

  const renderMainContent = () => {
    const estado = kycStatus?.estado_verificacion || 'NO_INICIADO';

    if (estado === 'APROBADA') return <ApprovedView />;
    if (estado === 'PENDIENTE') return <PendingView />;

    const recordRechazado = kycStatus as KycStatusWithRecord;

    return (
      // 👇 Todo vuelve a estar apilado verticalmente
      <Stack spacing={4}>
        
        {/* 1. Alerta de rechazo (Se muestra SOLO si está rechazada) */}
        {estado === 'RECHAZADA' && (
          <AlertBanner
            severity="error"
            title="Solicitud Rechazada"
            message={recordRechazado?.motivo_rechazo || 'Documentación inválida.'}
          />
        )}

        {/* 2. Tarjeta Informativa KYC (Se muestra SIEMPRE) */}
        <KycInfoCard />

        {/* 3. Stepper y Formulario */}
        <Box>
          {formError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setFormError(null)}>{formError}</Alert>}

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {['Datos', 'Documentos', 'Confirmar'].map(label => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              {renderStep()}

              <Box mt={6}>
                <Divider sx={{ mb: 3 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Button
                    onClick={handleBack}
                    disabled={activeStep === 0 || uploadMutation.isPending}
                    startIcon={<ArrowBack />}
                  >
                    Atrás
                  </Button>

                  <Button
                    variant="contained"
                    onClick={activeStep === 2 ? () => uploadMutation.mutate() : handleNext}
                    disabled={uploadMutation.isPending}
                    endIcon={activeStep === 2 ? (uploadMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />) : <NavigateNext />}
                  >
                    {activeStep === 2 ? 'Confirmar y Enviar' : 'Siguiente'}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    );
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader title="Verificación KYC" subtitle="Completa tu perfil para invertir." />
      <QueryHandler isLoading={isLoading} error={error as Error}>
        {renderMainContent()}
      </QueryHandler>
    </PageContainer>
  );
};

export default VerificacionKYC;