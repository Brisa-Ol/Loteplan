import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  Box, Paper, Stack, IconButton, 
  Alert, Chip, Slider, CircularProgress, Tooltip, useTheme, alpha, Typography
} from '@mui/material';
import { 
  ZoomIn, ZoomOut, FitScreen, Delete, TouchApp
} from '@mui/icons-material';

// Configuración del Worker para Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SignatureStamp {
  x: number;
  y: number;
  page: number;
}

interface PDFViewerMejoradoProps {
  pdfUrl: string;
  signatureDataUrl: string | null;
  onSignaturePositionSet: (pos: SignatureStamp) => void;
  readOnlyMode?: boolean;
}

const PDFViewerMejorado: React.FC<PDFViewerMejoradoProps> = ({ 
  pdfUrl, 
  signatureDataUrl, 
  onSignaturePositionSet,
  readOnlyMode = false
}) => {
  const theme = useTheme();
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [signature, setSignature] = useState<SignatureStamp | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver para que el PDF sea responsive al ancho del contenedor
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.offsetWidth - 48); // Margen para el scrollbar
      }
    };
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (readOnlyMode || !signatureDataUrl) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newSignature = { x, y, page: pageNum };
    setSignature(newSignature);
    onSignaturePositionSet(newSignature);
  };

  return (
    <Box ref={containerRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 🛠 BARRA DE HERRAMIENTAS */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1, mb: 1, borderRadius: 2, border: `1px solid ${theme.palette.divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: 'background.paper', zIndex: 2
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip 
            label={`${numPages} Páginas`} 
            size="small" 
            variant="outlined" 
            sx={{ fontWeight: 700 }} 
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Reducir"><IconButton onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} size="small"><ZoomOut fontSize="small" /></IconButton></Tooltip>
          <Box sx={{ width: 100, mx: 1 }}>
            <Slider value={scale} min={0.5} max={2.0} step={0.1} onChange={(_, v) => setScale(v as number)} size="small" />
          </Box>
          <Tooltip title="Aumentar"><IconButton onClick={() => setScale(s => Math.min(s + 0.1, 2.0))} size="small"><ZoomIn fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Restablecer"><IconButton onClick={() => setScale(1.0)} size="small"><FitScreen fontSize="small" /></IconButton></Tooltip>
        </Stack>
      </Paper>

      {/* 📄 ÁREA DEL DOCUMENTO (SCROLL CONTINUO) */}
      <Box 
        sx={{ 
          flex: 1, overflowY: 'auto', bgcolor: 'grey.200', borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`, p: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => setLoadError("No se pudo cargar el PDF")}
          loading={<CircularProgress sx={{ mt: 10 }} />}
        >
          <Stack spacing={3}>
            {Array.from(new Array(numPages), (_, i) => {
              const pageNum = i + 1;
              return (
                <Box 
                  key={`page_${pageNum}`}
                  onClick={(e) => handlePageClick(e, pageNum)}
                  sx={{ 
                    position: 'relative', 
                    boxShadow: theme.shadows[6],
                    cursor: (signatureDataUrl && !readOnlyMode) ? 'crosshair' : 'default',
                    lineHeight: 0 // Elimina espacios fantasma bajo el canvas
                  }}
                >
                  <Page
                    pageNumber={pageNum}
                    scale={scale}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />

                  {/* ✍️ ESTAMPA DE FIRMA */}
                  {signature && signature.page === pageNum && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: signature.x * scale,
                        top: signature.y * scale,
                        width: 150 * scale,
                        height: 60 * scale,
                        border: `2px dashed ${theme.palette.primary.main}`,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10, pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)' // Centra la firma donde haces clic
                      }}
                    >
                      <Box component="img" src={signatureDataUrl!} sx={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                      <IconButton 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); setSignature(null); }}
                        sx={{ 
                          position: 'absolute', top: -12, right: -12, bgcolor: 'error.main', color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }, pointerEvents: 'auto', width: 24, height: 24
                        }}
                      >
                        <Delete sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Document>

        {loadError && <Alert severity="error" sx={{ mt: 5 }}>{loadError}</Alert>}
      </Box>

      {/* ℹ️ FEEDBACK */}
      {!readOnlyMode && signatureDataUrl && (
        <Box sx={{ py: 1, textAlign: 'center' }}>
          {!signature ? (
            <Chip icon={<TouchApp />} label="Haz clic en el documento para posicionar tu firma" color="primary" variant="outlined" />
          ) : (
            <Typography variant="caption" color="success.main" fontWeight={700}>✓ Firma posicionada en Pág. {signature.page}</Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PDFViewerMejorado;