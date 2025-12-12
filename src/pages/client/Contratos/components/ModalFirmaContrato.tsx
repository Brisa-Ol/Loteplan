// src/pages/client/Contratos/components/ModalFirmaContrato.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, TextField, Alert, CircularProgress, 
  Stepper, Step, StepLabel, Stack, Paper, IconButton
} from '@mui/material';
import { 
  GppGood, Description, LocationOn, VpnKey, CloudUpload, Lock,
  Clear, Undo, Save, ZoomIn, ZoomOut
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PDFDocument } from 'pdf-lib';

// Servicios
import ContratoFirmadoService from '../../../../Services/contrato-firmado.service';
import ContratoPlantillaService from '../../../../Services/contrato-plantilla.service';
import ImagenService from '../../../../Services/imagen.service';

// Utils
import { useAuth } from '../../../../context/AuthContext';

interface ModalFirmaContratoProps {
  open: boolean;
  onClose: () => void;
  idProyecto: number;
  idUsuario: number;
  onFirmaExitosa: () => void;
}

// ====================================
// SUB-COMPONENTE: Canvas de Firma
// ====================================
interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    setCtx(context);
    setHistory([context.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !ctx) return;
    // e.preventDefault(); 
    
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || !ctx) return;
    e.preventDefault(); 
    
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !ctx || !canvasRef.current) return;
    
    setIsDrawing(false);
    ctx.closePath();
    
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory(prev => [...prev, imageData]);
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory([ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)]);
  };

  const undo = () => {
    if (history.length <= 1 || !ctx || !canvasRef.current) return;
    
    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);
    
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <Box>
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 2, 
          border: '3px dashed',
          borderColor: disabled ? 'grey.300' : 'primary.main',
          borderRadius: 2,
          overflow: 'hidden',
          touchAction: 'none'
        }}
      >
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
          style={{
            display: 'block',
            width: '100%',
            height: '200px',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            backgroundColor: 'white'
          }}
        />
      </Paper>
      
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button size="small" startIcon={<Clear />} onClick={clearCanvas} disabled={disabled}>
          Limpiar
        </Button>
        <Button size="small" startIcon={<Undo />} onClick={undo} disabled={disabled || history.length <= 1}>
          Deshacer
        </Button>
        <Button size="small" variant="contained" startIcon={<Save />} onClick={saveSignature} disabled={disabled}>
          Guardar Firma
        </Button>
      </Stack>
    </Box>
  );
};

// ====================================
// SUB-COMPONENTE: Visor PDF + Firma
// ====================================
interface PDFViewerProps {
  pdfUrl: string;
  signatureDataUrl: string | null;
  onSignaturePositionSet: (pos: { x: number; y: number; page: number }) => void;
}

const PDFViewerWithSignature: React.FC<PDFViewerProps> = ({ 
  pdfUrl, 
  signatureDataUrl, 
  onSignaturePositionSet 
}) => {
  const [zoom, setZoom] = useState(1);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number } | null>(null);

  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signatureDataUrl) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSignaturePosition({ x, y });
    
    // Enviamos al padre la posición (asumiendo página 1 por defecto con iframe simple)
    onSignaturePositionSet({ x, y, page: 1 });
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} justifyContent="center" mb={2}>
        <IconButton onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} size="small">
          <ZoomOut />
        </IconButton>
        <Typography variant="body2" sx={{ alignSelf: 'center' }}>
          {Math.round(zoom * 100)}%
        </Typography>
        <IconButton onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} size="small">
          <ZoomIn />
        </IconButton>
      </Stack>

      <Paper 
        elevation={3}
        sx={{ 
          position: 'relative',
          maxHeight: 500,
          overflow: 'auto',
          cursor: signatureDataUrl ? 'crosshair' : 'default',
          border: '1px solid #ddd'
        }}
        onClick={handlePdfClick}
      >
        <Box
          component="iframe"
          src={pdfUrl}
          sx={{
            width: '100%',
            height: '500px',
            border: 'none',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            pointerEvents: 'none' 
          }}
        />
        
        {/* Capa transparente para clicks */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }} />
        
        {signatureDataUrl && signaturePosition && (
          <Box
            component="img"
            src={signatureDataUrl}
            alt="Firma"
            sx={{
              position: 'absolute',
              left: signaturePosition.x,
              top: signaturePosition.y,
              width: 150,
              height: 50,
              objectFit: 'contain',
              pointerEvents: 'none',
              border: '2px dashed red',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: 1,
              zIndex: 20
            }}
          />
        )}
      </Paper>
      
      {signatureDataUrl && !signaturePosition && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Haz clic sobre el documento para estampar tu firma.
        </Alert>
      )}
    </Box>
  );
};

// ====================================
// COMPONENTE PRINCIPAL
// ====================================
const steps = [
  'Revisión del Documento',
  'Dibujar Firma',
  'Colocar Firma',
  'Validación de Seguridad',
  'Confirmar Firma'
];

const ModalFirmaContrato: React.FC<ModalFirmaContratoProps> = ({ 
  open, onClose, idProyecto, idUsuario, onFirmaExitosa 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number; page: number } | null>(null);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [location, setLocation] = useState<{lat: string, lng: string} | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Query: Obtener plantilla
  const { data: plantillas, isLoading: loadingPlantilla } = useQuery({
    queryKey: ['plantillaContrato', idProyecto],
    queryFn: async () => (await ContratoPlantillaService.findByProject(idProyecto)).data,
    enabled: open
  });

  const plantillaActual = plantillas && plantillas.length > 0 ? plantillas[0] : null;

  // Capturar geolocalización al llegar al paso 3
  useEffect(() => {
    if (open && activeStep === 3) {
      ContratoFirmadoService.getCurrentPosition().then(pos => setLocation(pos));
    }
  }, [open, activeStep]);

  // Mutation: Firmar (CON LÓGICA DE PDF-LIB)
  const firmaMutation = useMutation({
    mutationFn: async () => {
      if (!plantillaActual || !signatureDataUrl || !signaturePosition) {
        throw new Error("Faltan datos para completar la firma");
      }

      // 1. Obtener URL absoluta del PDF
      const pdfUrl = ImagenService.resolveImageUrl(plantillaActual.url_archivo);
      
      // 2. Descargar el PDF original como ArrayBuffer
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) throw new Error("No se pudo descargar la plantilla del contrato.");
      const pdfBytes = await pdfResponse.arrayBuffer();
      
      // 3. Cargar el documento con pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // 4. Incrustar la imagen de la firma (PNG)
      const signatureImageResponse = await fetch(signatureDataUrl);
      const signatureImageBytes = await signatureImageResponse.arrayBuffer();
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

      // 5. Obtener la página y dibujar la firma
      const pages = pdfDoc.getPages();
      const pageIndex = (signaturePosition.page || 1) - 1;
      const pageToSign = pages[pageIndex] || pages[0];
      
      const { height } = pageToSign.getSize();
      
      pageToSign.drawImage(signatureImage, {
        x: signaturePosition.x,
        y: height - signaturePosition.y - 50, 
        width: 150,
        height: 50,
      });

      // 6. Guardar el nuevo PDF firmado
      const signedPdfBytes = await pdfDoc.save();
      
      // ✅ CORRECCIÓN AQUÍ: Casting a 'BlobPart' o 'any' para evitar error de TS
      const signedPdfFile = new File(
        [signedPdfBytes as any], 
        `firmado_${plantillaActual.nombre_archivo}`, 
        { type: 'application/pdf' }
      );

      // 7. Enviar al Backend
      return await ContratoFirmadoService.registrarFirma({
        file: signedPdfFile, 
        id_contrato_plantilla: plantillaActual.id,
        id_proyecto: idProyecto,
        id_usuario_firmante: idUsuario,
        codigo_2fa: codigo2FA,
        latitud_verificacion: location?.lat,
        longitud_verificacion: location?.lng
      });
    },
    onSuccess: (res) => {
      alert(res.data.message || "Firma registrada exitosamente.");
      onFirmaExitosa();
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Error desconocido";
      setGeneralError(msg);
      if (msg.includes("2FA") || msg.includes("Código")) {
          setActiveStep(3);
      }
    }
  });

  const handleNext = () => {
    if (activeStep === 1 && !signatureDataUrl) {
      alert('⚠️ Dibuja tu firma antes de continuar');
      return;
    }
    if (activeStep === 2 && !signaturePosition) {
      alert('⚠️ Coloca tu firma en el documento');
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setGeneralError(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setActiveStep(0);
        setSignatureDataUrl(null);
        setSignaturePosition(null);
        setCodigo2FA('');
        setGeneralError(null);
    }, 200);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Revisión
        return (
          <Box mt={2}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Lee cuidadosamente el contrato antes de continuar.
            </Alert>
            {loadingPlantilla ? <CircularProgress /> : plantillaActual ? (
              <Paper elevation={2} sx={{ height: 400, overflow: 'hidden' }}>
                <Box
                  component="iframe"
                  src={ImagenService.resolveImageUrl(plantillaActual.url_archivo)}
                  sx={{ width: '100%', height: '100%', border: 'none' }}
                />
              </Paper>
            ) : (
              <Alert severity="error">No hay plantilla disponible para este proyecto.</Alert>
            )}
          </Box>
        );

      case 1: // Dibujar Firma
        return (
          <Box mt={2}>
            <Typography variant="h6" gutterBottom>✍️ Dibuja tu firma</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Usa el ratón o tu dedo para firmar en el recuadro.
            </Alert>
            <SignatureCanvas onSave={setSignatureDataUrl} />
            {signatureDataUrl && (
              <Alert severity="success" sx={{ mt: 2 }}>✓ Firma guardada</Alert>
            )}
          </Box>
        );

      case 2: // Colocar Firma
        return (
          <Box mt={2}>
            <Typography variant="h6" gutterBottom>📍 Coloca tu firma</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                Haz clic sobre el documento donde quieres que aparezca tu firma.
            </Alert>
            {plantillaActual && (
              <PDFViewerWithSignature
                pdfUrl={ImagenService.resolveImageUrl(plantillaActual.url_archivo)}
                signatureDataUrl={signatureDataUrl}
                onSignaturePositionSet={setSignaturePosition}
              />
            )}
          </Box>
        );

      case 3: // Seguridad
        return (
          <Box mt={2}>
            <Alert severity="warning" icon={<Lock />} sx={{ mb: 3 }}>
              Validación de identidad requerida para la firma legal.
            </Alert>
            <Stack spacing={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <LocationOn color={location ? "success" : "disabled"} />
                <Box>
                  <Typography variant="subtitle2">Geolocalización</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {location ? "✓ Ubicación registrada" : "Detectando..."}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <VpnKey color="primary" fontSize="small"/>
                  <Typography variant="subtitle2">Código 2FA</Typography>
                </Box>
                <TextField 
                  fullWidth 
                  placeholder="000 000"
                  value={codigo2FA}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    if (v.length <= 6) setCodigo2FA(v);
                  }}
                  inputProps={{ 
                    style: { textAlign: 'center', letterSpacing: 5, fontSize: '1.2rem' } 
                  }}
                  helperText="Ingresa el código de Google Authenticator"
                />
              </Box>
            </Stack>
          </Box>
        );

      case 4: // Confirmación
        return (
          <Box mt={4} textAlign="center">
            <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6">Listo para firmar</Typography>
            <Typography variant="body2" color="text.secondary" mb={3} paragraph>
              Se fusionará tu firma con el documento y se generará un Hash SHA-256 inmutable.
            </Typography>
            
            {signatureDataUrl && (
              <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                  <Typography variant="caption" mb={1}>Tu firma:</Typography>
                  <Box component="img" src={signatureDataUrl} sx={{ width: 150, border: '1px solid #ccc' }} />
              </Box>
            )}

            {generalError && <Alert severity="error">{generalError}</Alert>}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle display="flex" alignItems="center" gap={1}>
        <GppGood color="primary" /> Firma Digital de Contrato
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 1, mb: 3 }}>
          {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={activeStep === 0 ? handleClose : handleBack} disabled={firmaMutation.isPending}>
          {activeStep === 0 ? 'Cancelar' : 'Atrás'}
        </Button>
        
        {activeStep < 4 ? (
          <Button 
            variant="contained" 
            onClick={handleNext} 
            disabled={
              !plantillaActual ||
              (activeStep === 1 && !signatureDataUrl) ||
              (activeStep === 2 && !signaturePosition) ||
              (activeStep === 3 && codigo2FA.length < 6)
            }
          >
            Continuar
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="success" 
            onClick={() => firmaMutation.mutate()} 
            disabled={firmaMutation.isPending}
            startIcon={firmaMutation.isPending ? <CircularProgress size={20} /> : <GppGood />}
          >
            {firmaMutation.isPending ? 'Procesando...' : 'Firmar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalFirmaContrato;