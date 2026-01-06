// src/components/Admin/Contratos/Modals/ModalFirmaContrato.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, Typography, Box, TextField, Alert, CircularProgress, 
  Stepper, Step, StepLabel, Stack, Paper, Fade, useTheme, alpha
} from '@mui/material';
import { 
  GppGood, Clear, Save, LocationOn, VpnKey, CloudUpload, Draw
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PDFDocument } from 'pdf-lib';

// Componentes y Servicios
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import ContratoFirmadoService from '../../../../services/contrato-firmado.service';
import ContratoPlantillaService from '../../../../services/contrato-plantilla.service';
import ImagenService from '../../../../services/imagen.service';
import PDFViewerMejorado from './PDFViewerMejorado';

interface ModalFirmaContratoProps {
  open: boolean;
  onClose: () => void;
  idProyecto: number;
  idUsuario: number;
  onFirmaExitosa: () => void;
}

// ════════════════════════════════════════════════════════════
// SUB-COMPONENTE: CANVAS DE FIRMA
// ════════════════════════════════════════════════════════════
const SignatureCanvas: React.FC<{ onSave: (data: string) => void; disabled?: boolean }> = ({ onSave, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        context.strokeStyle = theme.palette.text.primary;
        context.lineWidth = 2.5;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        setCtx(context);
      }
    }
  }, [theme]);

  const startDrawing = (e: any) => {
    if (disabled || !ctx || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || disabled || !ctx || !canvasRef.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && ctx) {
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clear = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const save = () => {
    if (canvasRef.current) onSave(canvasRef.current.toDataURL('image/png'));
  };

  return (
    <Box>
      <Paper 
        variant="outlined" 
        sx={{ 
            mb: 2, overflow: 'hidden', touchAction: 'none',
            bgcolor: 'background.default', border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 2, position: 'relative'
        }}
      >
        {!isDrawing && (
            <Typography variant="caption" sx={{ position: 'absolute', top: 10, left: 10, color: 'text.disabled' }}>
                Firma aquí dentro
            </Typography>
        )}
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ width: '100%', height: '200px', cursor: disabled ? 'not-allowed' : 'crosshair' }}
        />
      </Paper>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button size="small" onClick={clear} startIcon={<Clear />} disabled={disabled} variant="outlined" color="error">
            Limpiar
        </Button>
        <Button size="small" variant="contained" onClick={save} startIcon={<Save />} disabled={disabled} sx={{ fontWeight: 700 }}>
            Guardar Firma
        </Button>
      </Stack>
    </Box>
  );
};

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

const steps = ['Revisión', 'Dibujar Firma', 'Colocar Firma', 'Seguridad', 'Confirmar'];

const ModalFirmaContrato: React.FC<ModalFirmaContratoProps> = ({ 
  open, onClose, idProyecto, idUsuario, onFirmaExitosa 
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number; page: number } | null>(null);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [location, setLocation] = useState<{lat: string, lng: string} | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: plantillas, isLoading: loadingPlantilla } = useQuery({
    queryKey: ['plantillaContrato', idProyecto],
    queryFn: async () => (await ContratoPlantillaService.findByProject(idProyecto)).data,
    enabled: open
  });

  const plantillaActual = plantillas && plantillas.length > 0 ? plantillas[0] : null;

  useEffect(() => {
    if (open && activeStep === 3) {
      ContratoFirmadoService.getCurrentPosition().then(pos => setLocation(pos));
    }
  }, [open, activeStep]);

  const firmaMutation = useMutation({
    mutationFn: async () => {
      if (!plantillaActual || !signatureDataUrl || !signaturePosition) throw new Error("Datos incompletos");

      const pdfUrl = ImagenService.resolveImageUrl(plantillaActual.url_archivo);
      const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
      
      const pageIndex = (signaturePosition.page || 1) - 1;
      const page = pdfDoc.getPages()[pageIndex];
      const { height } = page.getSize();
      
      page.drawImage(signatureImage, {
        x: signaturePosition.x,
        y: height - signaturePosition.y - 50, 
        width: 150,
        height: 50,
      });

      const signedPdfBytes = await pdfDoc.save();
      const signedFile = new File([signedPdfBytes as any], `firmado_${plantillaActual.nombre_archivo}`, { type: 'application/pdf' });

      return await ContratoFirmadoService.registrarFirma({
        file: signedFile,
        id_contrato_plantilla: plantillaActual.id,
        id_proyecto: idProyecto,
        id_usuario_firmante: idUsuario,
        codigo_2fa: codigo2FA,
        latitud_verificacion: location?.lat,
        longitud_verificacion: location?.lng
      });
    },
    onSuccess: (res) => {
      onFirmaExitosa();
      handleClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Error al firmar el contrato.");
      if (err.response?.data?.message?.includes("2FA")) setActiveStep(3);
    }
  });

  const handleNext = () => setActiveStep(p => p + 1);
  const handleBack = () => setActiveStep(p => p - 1);
  
  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setActiveStep(0);
        setSignatureDataUrl(null);
        setCodigo2FA('');
        setSignaturePosition(null);
        setErrorMsg(null);
    }, 200);
  };

  const renderStep = (step: number) => {
    if (!plantillaActual) return <Alert severity="warning">No hay plantilla disponible.</Alert>;
    
    switch (step) {
      case 0: // Revisión
        return (
          <Box height={400} bgcolor="grey.100" borderRadius={2} overflow="hidden" border={`1px solid ${theme.palette.divider}`}>
             <iframe 
                src={ImagenService.resolveImageUrl(plantillaActual.url_archivo)} 
                width="100%" height="100%" title="Vista previa" style={{ border: 'none' }}
             />
          </Box>
        );
      case 1: // Dibujar Firma
        return (
          <Stack spacing={3} mt={2}>
            <Alert severity="info" icon={<Draw />} sx={{ borderRadius: 2 }}>
                Dibuja tu firma en el recuadro. Intenta que sea clara y legible.
            </Alert>
            <SignatureCanvas onSave={setSignatureDataUrl} />
            <Fade in={!!signatureDataUrl}>
                <Box>
                    {signatureDataUrl && (
                        <Alert severity="success" variant="outlined" sx={{ boxShadow: 1, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold">¡Firma capturada!</Typography>
                            <Typography variant="caption">Pulsa "Siguiente" para ubicarla en el documento.</Typography>
                        </Alert>
                    )}
                </Box>
            </Fade>
          </Stack>
        );
      case 2: // Colocar Firma
        return (
          <Box height={450} borderRadius={2} overflow="hidden" border={`1px solid ${theme.palette.divider}`}>
              <PDFViewerMejorado 
                pdfUrl={ImagenService.resolveImageUrl(plantillaActual.url_archivo)}
                signatureDataUrl={signatureDataUrl}
                onSignaturePositionSet={setSignaturePosition}
              />
          </Box>
        );
      case 3: // Seguridad
        return (
            <Stack spacing={3} mt={2}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderColor: theme.palette.info.main }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <LocationOn color="info" />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700}>Geolocalización</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {location ? "Ubicación detectada para auditoría de firma." : "Detectando ubicación..."}
                            </Typography>
                        </Box>
                        {!location && <CircularProgress size={20} />}
                    </Stack>
                </Paper>
                
                <TextField 
                    label="Código Authenticator (2FA)"
                    value={codigo2FA}
                    onChange={(e) => setCodigo2FA(e.target.value)}
                    placeholder="000 000"
                    fullWidth
                    InputProps={{ 
                        startAdornment: <VpnKey color="action" sx={{ mr: 1 }}/>,
                        style: { fontSize: '1.2rem', letterSpacing: 2 }
                    }}
                />
            </Stack>
        );
      case 4: // Confirmar
        return (
            <Box textAlign="center" py={4}>
                <CloudUpload sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" fontWeight={700} gutterBottom>Todo Listo</Typography>
                <Typography color="text.secondary" paragraph>
                    Se generará un documento PDF firmado digitalmente con un hash SHA-256 inmutable.
                </Typography>
                {errorMsg && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{errorMsg}</Alert>}
            </Box>
        );
      default: return null;
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Proceso de Firma Digital"
      subtitle="Validación de identidad y firma de contrato"
      icon={<GppGood />}
      headerColor="success"
      maxWidth="md"
      isLoading={firmaMutation.isPending}
      // Usamos customActions para manejar el flujo del Stepper
      customActions={
        <>
            <Button 
                onClick={activeStep === 0 ? handleClose : handleBack} 
                color="inherit" 
                disabled={firmaMutation.isPending}
                sx={{ mr: 'auto', borderRadius: 2 }}
            >
                {activeStep === 0 ? 'Cancelar' : 'Atrás'}
            </Button>

            {activeStep < 4 ? (
                <Button 
                    variant="contained" 
                    onClick={handleNext} 
                    disabled={!plantillaActual || (activeStep === 1 && !signatureDataUrl)}
                    sx={{ px: 4, fontWeight: 700, borderRadius: 2 }}
                >
                    Siguiente
                </Button>
            ) : (
                <Button 
                    variant="contained" 
                    color="success" 
                    onClick={() => firmaMutation.mutate()} 
                    disabled={firmaMutation.isPending}
                    startIcon={firmaMutation.isPending && <CircularProgress size={20} color="inherit" />}
                    sx={{ px: 4, fontWeight: 700, borderRadius: 2 }}
                >
                    {firmaMutation.isPending ? 'Firmando...' : 'Finalizar Firma'}
                </Button>
            )}
        </>
      }
    >
      <Box sx={{ width: '100%', mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map(s => (
                <Step key={s}>
                    <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: 'success.main' }, '&.Mui-completed': { color: 'success.main' } } }}>
                        {s}
                    </StepLabel>
                </Step>
            ))}
        </Stepper>
      </Box>

      {loadingPlantilla ? (
          <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
      ) : renderStep(activeStep)}

    </BaseModal>
  );
};

export default ModalFirmaContrato;