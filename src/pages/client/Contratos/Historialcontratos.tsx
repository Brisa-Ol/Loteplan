import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  CircularProgress,
  Button,
  Avatar,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Description as PdfIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// Importaciones de tu arquitectura
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import type { ContratoFirmadoDto } from '../../../types/dto/contrato-firmado.dto';
import ContratoGeneralService from '../../../Services/contrato-general.service';

const Historialcontratos: React.FC = () => {
  // Estado local para mostrar spinner en el botón específico que se está descargando
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // 1. Obtener contratos del usuario
  const { data: contratos, isLoading, error } = useQuery<ContratoFirmadoDto[]>({
    queryKey: ['misContratos'],
    queryFn: async () => {
      const res = await ContratoGeneralService.findMyContracts();
      return res.data;
    }
  });

  // 2. Manejar Descarga
  const handleDownload = async (contrato: ContratoFirmadoDto) => {
    try {
      setDownloadingId(contrato.id);

      // Usamos el helper downloadAndSave del servicio
      await ContratoGeneralService.downloadAndSave(
        contrato.id,
        contrato.nombre_archivo || `documento-${contrato.id}.pdf`
      );

    } catch (error) {
      console.error("Error descargando:", error);
      alert("No se pudo descargar el archivo. Verifique su conexión.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <PageContainer maxWidth="md">
      {/* --- Encabezado --- */}
      <Box mb={4}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Mis Documentos
        </Typography>
        <Typography color="text.secondary">
          Accede al historial de tus contratos firmados y documentación legal.
        </Typography>
      </Box>

      <QueryHandler
        isLoading={isLoading}
        error={error as Error | null}
        loadingMessage="Buscando tus documentos..."
      >
        {contratos && contratos.length > 0 ? (
          <Stack spacing={2}>
            {contratos.map((contrato) => (
              <Paper
                key={contrato.id}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', boxShadow: 2 }
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={2}
                >

                  {/* Izquierda: Icono e Info */}
                  <Box display="flex" alignItems="center" gap={2} flex={1} minWidth={250}>
                    <Avatar
                      sx={{
                        bgcolor: 'error.lighter',
                        color: 'error.main',
                        width: 50,
                        height: 50
                      }}
                    >
                      <PdfIcon />
                    </Avatar>

                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {contrato.nombre_archivo}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Firmado el: {new Date(contrato.fecha_firma).toLocaleDateString()}
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ height: 12, alignSelf: 'center' }} />
                        <Typography variant="caption" color="text.secondary">
                          ID Proyecto: {contrato.id_proyecto}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>

                  {/* Centro: Estado */}
                  <Box>
                    {contrato.estado_firma === 'FIRMADO' && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Firmado Digitalmente"
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {contrato.estado_firma === 'REVOCADO' && (
                      <Chip label="Revocado" color="error" size="small" />
                    )}
                  </Box>

                  {/* Derecha: Botón Descarga */}
                  <Box>
                    <Tooltip title="Descargar PDF">
                      <span> {/* Span necesario para tooltip si el botón se deshabilita */}
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={downloadingId === contrato.id ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                          onClick={() => handleDownload(contrato)}
                          disabled={downloadingId === contrato.id || contrato.estado_firma !== 'FIRMADO'}
                        >
                          {downloadingId === contrato.id ? 'Bajando...' : 'Descargar'}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>

                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          // Estado Vacío
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px dashed',
              borderColor: 'text.disabled'
            }}
          >
            <FileIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes documentos firmados aún
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Los contratos aparecerán aquí automáticamente una vez que realices tu primera inversión.
            </Typography>
          </Paper>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default Historialcontratos;