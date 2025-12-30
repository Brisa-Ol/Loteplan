// src/components/Admin/Contratos/Modals/PDFViewerMejorado.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  Box, Paper, Stack, Button, Typography, IconButton, 
  Alert, Chip, Slider, CircularProgress, Tooltip, useTheme, alpha
} from '@mui/material';
import { 
  ZoomIn, ZoomOut, NavigateBefore, NavigateNext, 
  FitScreen, Delete, TouchApp
} from '@mui/icons-material';

// ====================================================
// 🔧 CONFIGURACIÓN DEL WORKER
// ====================================================
// Forzamos la versión exacta del worker para coincidir con la librería instalada
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const theme = useTheme();
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [signature, setSignature] = useState<SignatureStamp | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Ajuste automático al ancho del contenedor
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Restamos padding para evitar scroll horizontal innecesario
        setPageWidth(containerRef.current.offsetWidth - 32);
      }
    };
    
    // Observer es más eficiente que window.resize
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(null);
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnlyMode) return;
    
    if (!signatureDataUrl) {
      // Feedback visual si intenta firmar sin haber dibujado
      return; 
    }

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    
    // Calculamos coordenadas relativas al PDF original (sin importar el zoom actual)
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newSignature: SignatureStamp = { x, y, page: currentPage };

    setSignature(newSignature);
    onSignaturePositionSet(newSignature);
  };

  const changePage = (offset: number) => {
    setCurrentPage(prev => Math.max(1, Math.min(prev + offset, numPages)));
  };

  const zoomInOut = (value: number) => {
    setScale(prev => Math.min(Math.max(prev + value, 0.5), 2.5));
  };

  return (
    <Box ref={containerRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* BARRA DE HERRAMIENTAS */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 1, mb: 1, borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            bgcolor: 'background.paper', zIndex: 2
        }}
      >
        {/* Paginación */}
        <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => changePage(-1)} disabled={currentPage <= 1} size="small">
                <NavigateBefore />
            </IconButton>
            <Chip 
                label={`Pág ${currentPage} de ${numPages || '-'}`} 
                size="small" 
                variant="outlined" 
                sx={{ fontWeight: 600, minWidth: 80 }}
            />
            <IconButton onClick={() => changePage(1)} disabled={currentPage >= numPages} size="small">
                <NavigateNext />
            </IconButton>
        </Stack>

        {/* Zoom */}
        <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Reducir">
                <IconButton onClick={() => zoomInOut(-0.1)} size="small" disabled={scale <= 0.5}>
                    <ZoomOut fontSize="small" />
                </IconButton>
            </Tooltip>
            
            <Box sx={{ width: 80, mx: 1 }}>
                <Slider
                    value={scale}
                    min={0.5} max={2.5} step={0.1}
                    onChange={(_, val) => setScale(val as number)}
                    size="small"
                    aria-label="Zoom"
                />
            </Box>

            <Tooltip title="Aumentar">
                <IconButton onClick={() => zoomInOut(0.1)} size="small" disabled={scale >= 2.5}>
                    <ZoomIn fontSize="small" />
                </IconButton>
            </Tooltip>
            
            <Tooltip title="Restablecer">
                <IconButton onClick={() => setScale(1.0)} size="small">
                    <FitScreen fontSize="small" />
                </IconButton>
            </Tooltip>
        </Stack>
      </Paper>

      {/* ÁREA DE DOCUMENTO CON SCROLL */}
      <Box 
        sx={{ 
            flex: 1, 
            overflow: 'auto', 
            bgcolor: 'grey.100', 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            p: 2
        }}
      >
        {!loadError ? (
            <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={() => setLoadError("No se pudo cargar el documento.")}
                loading={
                    <Stack alignItems="center" mt={5} spacing={2}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary">Cargando PDF...</Typography>
                    </Stack>
                }
                error={
                    <Alert severity="error" sx={{ mt: 5 }}>Error al cargar el archivo PDF.</Alert>
                }
            >
                {/* Renderizado Condicional de la Página */}
                {numPages > 0 && (
                    <Box
                        onClick={handlePageClick}
                        sx={{
                            position: 'relative',
                            boxShadow: theme.shadows[4],
                            cursor: (signatureDataUrl && !readOnlyMode) ? 'crosshair' : 'default',
                            transition: 'cursor 0.2s',
                            '&:hover': (signatureDataUrl && !readOnlyMode) ? {
                                outline: `2px dashed ${theme.palette.primary.main}`,
                                outlineOffset: '4px'
                            } : {}
                        }}
                    >
                        <Page
                            pageNumber={currentPage}
                            scale={scale}
                            width={pageWidth}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                        />

                        {/* ESTAMPA DE FIRMA SOBRE EL PDF */}
                        {signatureDataUrl && signature && signature.page === currentPage && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: signature.x * scale,
                                    top: signature.y * scale,
                                    width: 150 * scale,
                                    height: 50 * scale,
                                    border: `2px dashed ${theme.palette.success.main}`,
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                    pointerEvents: 'none' // Para permitir clicks a través si fuera necesario
                                }}
                            >
                                <Box 
                                    component="img"
                                    src={signatureDataUrl}
                                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                                {/* Botón eliminar firma (flotante) */}
                                <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSignature(null);
                                    }}
                                    sx={{ 
                                        position: 'absolute', top: -15, right: -15, 
                                        bgcolor: 'error.main', color: 'white',
                                        '&:hover': { bgcolor: 'error.dark' },
                                        pointerEvents: 'auto',
                                        width: 24, height: 24
                                    }}
                                >
                                    <Delete fontSize="small" sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        )}
                    </Box>
                )}
            </Document>
        ) : (
            <Alert severity="error" sx={{ mt: 5 }}>{loadError}</Alert>
        )}
      </Box>

      {/* FEEDBACK INFERIOR */}
      <Box mt={1} textAlign="center">
         {!signature && signatureDataUrl && (
             <Chip 
                icon={<TouchApp />} 
                label="Haz clic sobre el documento para estampar tu firma" 
                color="primary" 
                variant="outlined" 
                sx={{ animation: 'pulse 2s infinite' }}
             />
         )}
         {signature && (
             <Typography variant="caption" color="success.main" fontWeight={700}>
                 ✓ Firma colocada en página {signature.page}
             </Typography>
         )}
      </Box>
    </Box>
  );
};

export default PDFViewerMejorado;