// src/shared/components/domain/modals/PdfPreviewModal/PdfPreviewModal.tsx

import {
  Close as CloseIcon,
  Description as FileIcon,
  OpenInNew,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState, useMemo } from 'react';

import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import httpService from '@/core/api/httpService';
import { env } from '@/core/config/env'; // 🆕 Importamos las variables de entorno

// ============================================================================
// PROPS
// ============================================================================

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  idProyecto?: number | null;
  urlDirecta?: string | null;
  nombreArchivo?: string;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  onClose,
  idProyecto,
  urlDirecta,
  nombreArchivo,
}) => {
  const theme = useTheme();

  // 1. Fetch de la plantilla
  const { data: plantilla, isLoading: loadingPlantilla, isError, error } = useQuery({
    queryKey: ['plantillaPreview', idProyecto],
    queryFn: async () => {
      const response = await ContratoPlantillaService.findByProject(idProyecto!);
      const activas = response.data.filter((p) => p.activo);
      if (activas.length === 0) return null;
      return activas.reduce((prev, curr) => (curr.version > prev.version ? curr : prev));
    },
    enabled: open && !!idProyecto && !urlDirecta,
    staleTime: 1000 * 60 * 5,
  });

  const pdfUrlRaw = urlDirecta ?? plantilla?.url_archivo ?? null;
  const displayName = nombreArchivo ?? plantilla?.nombre_archivo ?? 'Documento';
  const version = plantilla?.version;
  const integrityCompromised = plantilla?.integrity_compromised;

  // 🆕 2. CONSTRUCTOR DE URL ABSOLUTA (Apunta al Backend, no a Vite)
  // 2. CONSTRUCTOR DE URL ABSOLUTA (Apunta al Backend)
  const fullPdfUrl = useMemo(() => {
    if (!pdfUrlRaw) return null;
    if (pdfUrlRaw.startsWith('http')) return pdfUrlRaw; // Ya es absoluta
    
    // Quitamos el /api de la URL base para apuntar a la raíz del servidor
    const backendRoot = env.apiBaseUrl.replace(/\/api\/?$/, ''); 
    let cleanPath = pdfUrlRaw.startsWith('/') ? pdfUrlRaw : `/${pdfUrlRaw}`;
    
    // 🚨 CORRECCIÓN CLAVE: Si la base de datos no incluyó '/uploads', se lo agregamos manual
    // (Ajusta la palabra 'uploads' si tu backend usa otra carpeta, como 'public')
    if (!cleanPath.startsWith('/uploads')) {
      cleanPath = `/uploads${cleanPath}`;
    }
    
    return `${backendRoot}${cleanPath}`;
  }, [pdfUrlRaw]);
  // ESTADOS PARA EL BLOB
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState<boolean>(false);

  // 3. Efecto para descargar el PDF
  useEffect(() => {
    let isMounted = true;
    let localBlobUrl = '';

    const fetchSecurePdf = async () => {
      if (!fullPdfUrl || !open) return;
      
      setLoadingBlob(true);
      try {
        // Hacemos GET a la URL absoluta, y le decimos a Axios que NO sume el baseURL
        const response = await httpService.get(fullPdfUrl, {
          responseType: 'blob',
          baseURL: '' // 👈 CRÍTICO: Evita que Axios intente buscar en /api/uploads/...
        });

        if (isMounted) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          localBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(localBlobUrl);
        }
      } catch (err) {
        console.error("Error al descargar PDF con auth:", err);
        // Si falla, el fallback ahora usa la URL absoluta del Backend, no la de Vite
        if (isMounted) setBlobUrl(fullPdfUrl); 
      } finally {
        if (isMounted) setLoadingBlob(false);
      }
    };

    fetchSecurePdf();

    return () => {
      isMounted = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
      setBlobUrl(null);
    };
  }, [fullPdfUrl, open]);

  // Loader combinado
  const isCurrentlyLoading = loadingPlantilla || loadingBlob;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '88vh', borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pl: 3, bgcolor: alpha(theme.palette.background.paper, 0.98) }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <FileIcon color="primary" />
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                {displayName}
              </Typography>
              {version !== undefined && (
                <Chip label={`V${version}`} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
              )}
              {integrityCompromised && (
                <Chip label="HASH COMPROMETIDO" size="small" color="error" icon={<WarningIcon sx={{ fontSize: '0.75rem !important' }} />} sx={{ fontWeight: 700, fontSize: '0.6rem', height: 18 }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">Vista previa del documento</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          {blobUrl && (
            <Tooltip title="Abrir en nueva pestaña">
              <IconButton size="small" component="a" href={blobUrl} target="_blank" rel="noopener noreferrer">
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>

        {isCurrentlyLoading && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">Descargando documento seguro...</Typography>
          </Box>
        )}

        {isError && !isCurrentlyLoading && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} p={4}>
            <Alert severity="error" sx={{ maxWidth: 480 }}>
              <Typography variant="body2" fontWeight={700}>No se pudo cargar el contrato</Typography>
              <Typography variant="caption">{(error as Error)?.message || 'Error desconocido.'}</Typography>
            </Alert>
          </Box>
        )}

        {!isCurrentlyLoading && !isError && !blobUrl && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} p={4}>
            <FileIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="body1" color="text.secondary" textAlign="center" fontWeight={700}>Archivo no disponible</Typography>
          </Box>
        )}

        {!isCurrentlyLoading && blobUrl && (
          <>
            {integrityCompromised && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ borderRadius: 0, py: 0.5 }}>
                <Typography variant="caption" fontWeight={700}>El hash de este archivo no coincide. Podría haber sido modificado.</Typography>
              </Alert>
            )}

            <object
              data={blobUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{ border: 'none', display: 'block' }}
            >
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} p={4}>
                <FileIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  Tu navegador no soporta visualización nativa de PDF.
                </Typography>
                <Button variant="outlined" startIcon={<OpenInNew />} component="a" href={blobUrl} target="_blank" rel="noopener noreferrer">
                  Descargar o abrir en pestaña
                </Button>
              </Box>
            </object>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PdfPreviewModal;