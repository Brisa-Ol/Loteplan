import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, TextField, Alert, CircularProgress, 
  Stepper, Step, StepLabel, Stack, Paper,Fade
} from '@mui/material';
import { 
  GppGood, Clear, Undo, Save, Lock, LocationOn, VpnKey, CloudUpload, 
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PDFDocument } from 'pdf-lib';

// Importaciones de tus Servicios y DTOs
import ContratoFirmadoService from '../../../../Services/contrato-firmado.service';
import ContratoPlantillaService from '../../../../Services/contrato-plantilla.service';
import ImagenService from '../../../../Services/imagen.service';
import PDFViewerMejorado from './PDFViewerMejorado';

interface ModalFirmaContratoProps {
  open: boolean;
  onClose: () => void;
  idProyecto: number;
  idUsuario: number;
  onFirmaExitosa: () => void;
}

// Sub-componente Canvas para dibujar firma
const SignatureCanvas: React.FC<{ onSave: (data: string) => void; disabled?: boolean }> = ({ onSave, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        setCtx(context);
      }
    }
  }, []);

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
      <Paper variant="outlined" sx={{ mb: 1, overflow: 'hidden', touchAction: 'none' }}>
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
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button size="small" onClick={clear} startIcon={<Clear />} disabled={disabled}>Limpiar</Button>
        <Button size="small" variant="contained" onClick={save} startIcon={<Save />} disabled={disabled}>Guardar</Button>
      </Stack>
    </Box>
  );
};

const steps = ['Revisión', 'Dibujar Firma', 'Colocar Firma', 'Seguridad', 'Confirmar'];

const ModalFirmaContrato: React.FC<ModalFirmaContratoProps> = ({ 
  open, onClose, idProyecto, idUsuario, onFirmaExitosa 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number; page: number } | null>(null);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [location, setLocation] = useState<{lat: string, lng: string} | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Obtener la PLANTILLA usando ContratoPlantillaService
  const { data: plantillas, isLoading: loadingPlantilla } = useQuery({
    queryKey: ['plantillaContrato', idProyecto],
    queryFn: async () => (await ContratoPlantillaService.findByProject(idProyecto)).data,
    enabled: open
  });

  const plantillaActual = plantillas && plantillas.length > 0 ? plantillas[0] : null;

  // 2. Obtener Geolocation al llegar al paso de seguridad
  useEffect(() => {
    if (open && activeStep === 3) {
      ContratoFirmadoService.getCurrentPosition().then(pos => setLocation(pos));
    }
  }, [open, activeStep]);

  // 3. Mutación para FIRMAR usando ContratoFirmadoService
  const firmaMutation = useMutation({
    mutationFn: async () => {
      if (!plantillaActual || !signatureDataUrl || !signaturePosition) throw new Error("Datos incompletos");

      // A. Fusionar firma visual en el PDF (Cliente)
      const pdfUrl = ImagenService.resolveImageUrl(plantillaActual.url_archivo);
      const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
      
      const pageIndex = (signaturePosition.page || 1) - 1;
      const page = pdfDoc.getPages()[pageIndex];
      const { height } = page.getSize();
      
      page.drawImage(signatureImage, {
        x: signaturePosition.x,
        y: height - signaturePosition.y - 50, // Ajuste de coordenadas PDF vs Web
        width: 150,
        height: 50,
      });

      const signedPdfBytes = await pdfDoc.save();
      
      // ✅ CORRECCIÓN AQUÍ: Casting a 'any' o 'BlobPart'
      // Esto soluciona el error "Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'BlobPart'"
      const signedFile = new File(
        [signedPdfBytes as any], 
        `firmado_${plantillaActual.nombre_archivo}`, 
        { type: 'application/pdf' }
      );

      // B. Enviar al Backend (El backend calculará el Hash Final)
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
      alert(res.data.message);
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
    }, 200);
  };

  const renderStep = (step: number) => {
    if (!plantillaActual) return <Alert severity="warning">No hay plantilla disponible.</Alert>;
    
    switch (step) {
case 0: // Revisión
        return (
          <Box height={400} bgcolor="grey.100" borderRadius={1} overflow="hidden">
             {/* SOLUCIÓN AL VIOLATION WARNING:
                Agregamos 'allow="fullscreen"' para dar permiso explícito al visor PDF
             */}
             <iframe 
                src={ImagenService.resolveImageUrl(plantillaActual.url_archivo)} 
                width="100%" 
                height="100%" 
                title="Vista previa del contrato" 
                allow="fullscreen" 
                style={{ border: 'none' }}
             />
          </Box>
        );
      case 1: // Dibujar
       case 1: // Dibujar Firma
        return (
          <Stack spacing={2}>
            {/* Componente del Canvas */}
            <SignatureCanvas 
                onSave={(data) => {
                    setSignatureDataUrl(data);
                    // Opcional: Podrías hacer scroll automático si fuera móvil
                }} 
            />

            {/* ✅ AQUÍ ESTÁ EL CARTEL DE CONFIRMACIÓN */}
            <Fade in={!!signatureDataUrl}>
                <Box>
                    {signatureDataUrl && (
                        <Alert 
                            severity="success" 
                            variant="filled" 
                            sx={{ boxShadow: 2 }}
                        >
                            <Typography variant="subtitle2" fontWeight="bold">
                                ¡Firma guardada correctamente!
                            </Typography>
                            <Typography variant="caption">
                                Ahora pulsa el botón <b>"Siguiente"</b> para continuar.
                            </Typography>
                        </Alert>
                    )}
                </Box>
            </Fade>
          </Stack>
        );
        
      case 2: // Colocar
        return (
          <PDFViewerMejorado 
            pdfUrl={ImagenService.resolveImageUrl(plantillaActual.url_archivo)}
            signatureDataUrl={signatureDataUrl}
            onSignaturePositionSet={setSignaturePosition}
          />
        );
      case 3: // Seguridad
        return (
            <Stack spacing={3} mt={2}>
                <Alert severity="info" icon={<LocationOn />}>
                   {location ? "Ubicación detectada para auditoría." : "Detectando ubicación..."}
                </Alert>
                <TextField 
                    label="Código Authenticator (2FA)"
                    value={codigo2FA}
                    onChange={(e) => setCodigo2FA(e.target.value)}
                    placeholder="123456"
                    InputProps={{ startAdornment: <VpnKey color="action" sx={{ mr: 1 }}/> }}
                />
            </Stack>
        );
      case 4: // Confirmar
        return (
            <Box textAlign="center" py={3}>
                <CloudUpload sx={{ fontSize: 60, color: 'primary.main' }} />
                <Typography variant="h6">Todo listo</Typography>
                <Typography color="text.secondary">Se generará un hash SHA-256 inmutable.</Typography>
                {errorMsg && <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>}
            </Box>
        );
      default: return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle><GppGood /> Firma de Contrato</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
            {steps.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>
        {loadingPlantilla ? <CircularProgress /> : renderStep(activeStep)}
      </DialogContent>
      <DialogActions>
        <Button onClick={activeStep === 0 ? handleClose : handleBack}>Atrás</Button>
        {activeStep < 4 ? (
            <Button variant="contained" onClick={handleNext} disabled={!plantillaActual || (activeStep === 1 && !signatureDataUrl)}>
                Siguiente
            </Button>
        ) : (
            <Button variant="contained" color="success" onClick={() => firmaMutation.mutate()} disabled={firmaMutation.isPending}>
                {firmaMutation.isPending ? 'Firmando...' : 'Finalizar Firma'}
            </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalFirmaContrato;