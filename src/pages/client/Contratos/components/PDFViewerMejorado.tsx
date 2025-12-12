import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  Box, Paper, Stack, Button, Typography, IconButton, 
  Alert, Chip, Slider
} from '@mui/material';
import { 
  ZoomIn, ZoomOut, NavigateBefore, NavigateNext, 
  FitScreen, Delete
} from '@mui/icons-material';

// ====================================================
// 🔧 CONFIGURACIÓN DEL WORKER (SOLUCIÓN DEFINITIVA)
// ====================================================
// Usamos un CDN dinámico. La clave es `${pdfjs.version}`.
// Esto obliga a que si tu librería es la 5.4.296, baje el worker 5.4.296.
// Nunca más tendrás el error de "Version mismatch".

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ====================================================

interface PDFViewerMejoradoProps {
  pdfUrl: string;
  signatureDataUrl: string | null;
  onSignaturePositionSet: (pos: { x: number; y: number; page: number }) => void;
  readOnlyMode?: boolean;
}

interface SignatureStamp {
  x: number;
  y: number;
  page: number;
}

const PDFViewerMejorado: React.FC<PDFViewerMejoradoProps> = ({ 
  pdfUrl, 
  signatureDataUrl, 
  onSignaturePositionSet,
  readOnlyMode = false
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [signature, setSignature] = useState<SignatureStamp | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error cargando PDF:', error);
    // Mensaje amigable para el usuario
    setLoadError('No se pudo cargar la vista previa del documento.');
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnlyMode) return;
    
    if (!signatureDataUrl) {
      alert('⚠️ Primero debes dibujar tu firma en el paso anterior');
      return;
    }

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newSignature: SignatureStamp = {
      x,
      y,
      page: currentPage
    };

    setSignature(newSignature);
    onSignaturePositionSet(newSignature);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, numPages)));
  };

  const goToLastPage = () => {
    setCurrentPage(numPages);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);

  const removeSignature = () => {
    setSignature(null);
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(Math.min(containerRef.current.offsetWidth - 40, 800));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <Box ref={containerRef}>
      {/* Barra de Controles Superior */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack spacing={2}>
          
          {/* Navegación de Páginas */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} size="small">
                <NavigateBefore />
              </IconButton>
              
              <Chip 
                label={`${currentPage} / ${numPages || '...'}`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              
              <IconButton onClick={() => goToPage(currentPage + 1)} disabled={currentPage === numPages} size="small">
                <NavigateNext />
              </IconButton>

              <Button 
                size="small" 
                variant="outlined" 
                onClick={goToLastPage}
                disabled={!numPages}
                sx={{ ml: 1 }}
              >
                Ir al Final
              </Button>
            </Stack>

            {/* Zoom */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={zoomOut} size="small" disabled={scale <= 0.5}>
                <ZoomOut />
              </IconButton>
              
              <Box sx={{ minWidth: 120 }}>
                <Slider
                  value={scale}
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  onChange={(_, val) => setScale(val as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(val) => `${Math.round(val * 100)}%`}
                  size="small"
                />
              </Box>
              
              <IconButton onClick={zoomIn} size="small" disabled={scale >= 2.5}>
                <ZoomIn />
              </IconButton>
              
              <IconButton onClick={resetZoom} size="small" title="Restablecer zoom">
                <FitScreen />
              </IconButton>
            </Stack>
          </Stack>

          {/* Indicador de Firma */}
          {signature && (
            <Alert 
              severity="success" 
              action={
                <IconButton size="small" onClick={removeSignature}>
                  <Delete />
                </IconButton>
              }
            >
              ✓ Firma colocada en página {signature.page}
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Instrucción */}
      {signatureDataUrl && !signature && !readOnlyMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          👆 Haz clic donde quieras colocar tu firma (recomendado: última página)
        </Alert>
      )}

      {/* Error de Carga */}
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

      {/* Visor del PDF */}
      <Paper 
        elevation={3}
        sx={{ 
          position: 'relative',
          display: 'inline-block',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          minHeight: '200px', // Evita colapso si falla carga
          minWidth: '300px'
        }}
      >
        <Box
          onClick={handlePageClick}
          sx={{
            cursor: (signatureDataUrl && !readOnlyMode) ? 'crosshair' : 'default',
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <Box p={4} textAlign="center">
                <CircularProgress size={30} />
                <Typography variant="caption" display="block" mt={1}>Procesando PDF...</Typography>
              </Box>
            }
            error={
              <Box p={4} textAlign="center" color="error.main">
                 <Typography>Error visualizando el documento.</Typography>
              </Box>
            }
          >
            {/* Renderizamos página solo si cargó correctamente */}
            {numPages > 0 && (
                <Page
                pageNumber={currentPage}
                scale={scale}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                />
            )}
          </Document>

          {/* Estampa de Firma */}
          {signatureDataUrl && signature && signature.page === currentPage && (
            <Box
              component="img"
              src={signatureDataUrl}
              alt="Firma"
              sx={{
                position: 'absolute',
                left: signature.x * scale,
                top: signature.y * scale,
                width: 150 * scale,
                height: 50 * scale,
                objectFit: 'contain',
                pointerEvents: 'none',
                border: '2px dashed #1976d2',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 10
              }}
            />
          )}
        </Box>
      </Paper>

      <Box mt={2} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          💡 Tip: Navega hasta la última página y coloca tu firma al final del documento
        </Typography>
      </Box>
    </Box>
  );
};

// Necesario importar CircularProgress si no estaba
import { CircularProgress } from '@mui/material';

export default PDFViewerMejorado;