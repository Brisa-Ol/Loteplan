// src/shared/components/domain/modals/PdfPreviewModal/PdfPreviewModal.tsx

import httpService from '@/core/api/httpService';
import ContratoPlantillaService from '@/core/api/services/contrato-plantilla.service';
import { env } from '@/core/config/env';
import { BaseModal } from '@/shared/components/domain';
import {
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
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';


// ============================================================================
// INTERFACES
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState<boolean>(false);

  // 1. Fetch de datos de la plantilla (si no hay URL directa)
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

  // 2. Lógica de resolución de URLs
  const pdfUrlRaw = urlDirecta ?? plantilla?.url_archivo ?? null;
  const displayName = nombreArchivo ?? plantilla?.nombre_archivo ?? 'Documento';
  const version = plantilla?.version;
  const integrityCompromised = plantilla?.integrity_compromised;

  const fullPdfUrl = useMemo(() => {
    if (!pdfUrlRaw) return null;
    if (pdfUrlRaw.startsWith('http')) return pdfUrlRaw;

    const backendRoot = env.apiBaseUrl.replace(/\/api\/?$/, '');
    let cleanPath = pdfUrlRaw.startsWith('/') ? pdfUrlRaw : `/${pdfUrlRaw}`;

    if (!cleanPath.startsWith('/uploads')) {
      cleanPath = `/uploads${cleanPath}`;
    }
    return `${backendRoot}${cleanPath}`;
  }, [pdfUrlRaw]);

  // 3. Efecto de descarga segura (Blob)
  useEffect(() => {
    let isMounted = true;
    let localBlobUrl = '';

    const fetchSecurePdf = async () => {
      if (!fullPdfUrl || !open) return;
      setLoadingBlob(true);
      try {
        const response = await httpService.get(fullPdfUrl, {
          responseType: 'blob',
          baseURL: ''
        });

        if (isMounted) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          localBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(localBlobUrl);
        }
      } catch (err) {
        console.error("Error al descargar PDF:", err);
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

  const isCurrentlyLoading = loadingPlantilla || loadingBlob;

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    viewerContainer: {
      height: '75vh', // Alto fijo para el visor
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      position: 'relative',
      overflow: 'hidden'
    },
    centerBox: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      p: 4
    }
  }), []);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={displayName}
      subtitle="Vista previa del documento legal"
      icon={<FileIcon />}
      headerColor={integrityCompromised ? 'error' : 'primary'}
      maxWidth="lg"
      scroll="paper"
      // Quitamos el padding por defecto de DialogContent para que el PDF llegue a los bordes
      PaperProps={{ sx: { '& .MuiDialogContent-root': { p: 0 } } }}
      headerExtra={
        <Stack direction="row" spacing={1} alignItems="center">
          {version !== undefined && (
            <Chip
              label={`V${version}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
            />
          )}
          {blobUrl && (
            <Tooltip title="Abrir en nueva pestaña">
              <IconButton
                size="small"
                component="a"
                href={blobUrl}
                target="_blank"
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}
              >
                <OpenInNew fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      }
    >
      <Box sx={styles.viewerContainer}>
        {/* Banner de Integridad Comprometida */}
        {integrityCompromised && !isCurrentlyLoading && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ borderRadius: 0, border: 'none', borderBottom: '1px solid', borderColor: 'warning.light' }}
          >
            <strong>Hash de Seguridad no coincide:</strong> Este documento podría haber sido modificado externamente.
          </Alert>
        )}

        {/* Estado: Cargando */}
        {isCurrentlyLoading && (
          <Box sx={styles.centerBox}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Descargando documento seguro...
            </Typography>
          </Box>
        )}

        {/* Estado: Error */}
        {isError && !isCurrentlyLoading && (
          <Box sx={styles.centerBox}>
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={700}>Error al cargar el PDF</Typography>
              <Typography variant="caption">{(error as Error)?.message || 'El servidor no respondió correctamente.'}</Typography>
            </Alert>
          </Box>
        )}

        {/* Visor PDF */}
        {!isCurrentlyLoading && !isError && blobUrl ? (
          <object
            data={blobUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          >
            <Box sx={styles.centerBox}>
              <FileIcon sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.5 }} />
              <Typography variant="body1" color="text.secondary" fontWeight={700}>
                Visualización no soportada
              </Typography>
              <Button
                variant="contained"
                startIcon={<OpenInNew />}
                href={blobUrl}
                target="_blank"
                sx={{ borderRadius: 2 }}
              >
                Descargar para ver
              </Button>
            </Box>
          </object>
        ) : (
          !isCurrentlyLoading && !isError && (
            <Box sx={styles.centerBox}>
              <FileIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="body1" color="text.secondary">Archivo no encontrado</Typography>
            </Box>
          )
        )}
      </Box>
    </BaseModal>
  );
};

export default PdfPreviewModal;