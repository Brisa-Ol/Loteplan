import React, { useEffect, useState } from 'react';
import { 
  Assignment, CheckCircle, Videocam, Person, 
  Badge, Event, InsertDriveFile 
} from '@mui/icons-material';
import { 
  Avatar, Box, Card, CardContent, Divider, 
  Stack, Typography, alpha, useTheme 
} from '@mui/material';

interface StepConfirmProps {
  data: {
    nombre_completo: string;
    tipo_documento: string;
    numero_documento: string;
    fecha_nacimiento?: string;
  };
  files: {
    frente: File | null;
    dorso: File | null;
    selfie: File | null;
    video: File | null;
  };
}

const fileLabels: Record<string, string> = {
  frente: 'Frente DNI',
  dorso: 'Dorso DNI',
  selfie: 'Selfie con DNI',
  video: 'Video de Seguridad',
};

// ─── Componente Preview ──────────────────────────────────────────────────────
const FilePreview = ({ label, file }: { label: string; file: File }) => {
  const theme = useTheme();
  const [url, setUrl] = useState<string>('');
  const isVideo = file.type.startsWith('video/');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2, // Aprovecha el shape: { borderRadius: 8 } de tu tema
        border: `1px solid ${theme.palette.secondary.main}`, // Usa tu gris secundario
        bgcolor: 'background.default',
        transition: theme.transitions.create(['border-color', 'box-shadow', 'transform']),
        '&:hover': {
          borderColor: theme.palette.primary.main, // Tu color naranja CC6333
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
          transform: 'translateY(-4px)' // Animación alineada a tus botones
        }
      }}
    >
      {isVideo ? (
        <Box
          sx={{
            width: '100%',
            aspectRatio: '4/3',
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: 'primary.main',
          }}
        >
          <Videocam sx={{ fontSize: 40 }} />
          <Typography variant="caption" noWrap sx={{ px: 2, maxWidth: '100%' }}>
            {file.name}
          </Typography>
        </Box>
      ) : (
        <Box
          component="img"
          src={url}
          alt={label}
          sx={{
            width: '100%',
            aspectRatio: '4/3',
            objectFit: 'cover',
            borderRadius: 1.5,
            display: 'block',
            bgcolor: theme.palette.secondary.light, // Fondo gris claro mientras carga
          }}
        />
      )}

      <Stack direction="row" alignItems="center" spacing={1} px={0.5}>
        <CheckCircle color="success" sx={{ fontSize: 16 }} />
        <Typography variant="caption" fontWeight={600} color="text.primary">
          {label}
        </Typography>
      </Stack>
    </Box>
  );
};

// ─── Componente Principal ────────────────────────────────────────────────────
export const StepConfirm = ({ data, files }: StepConfirmProps) => {
  const theme = useTheme();
  const uploadedFiles = Object.entries(files).filter(([_, f]) => f !== null) as [string, File][];

  // InfoBox usando la variante `overline` definida en tu tema
const InfoBox = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <Box 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        bgcolor: theme.palette.secondary.light, 
        border: `1px solid ${theme.palette.secondary.main}` 
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
        {/* Envolvemos el ícono y le aplicamos el estilo al SVG hijo */}
        <Box sx={{ display: 'flex', color: 'primary.main', '& > svg': { fontSize: 18 } }}>
          {icon}
        </Box>
        <Typography variant="overline" color="text.secondary" lineHeight={1}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="body1" fontWeight={600} color="text.primary">
        {value}
      </Typography>
    </Box>
  );

  return (
    <Stack spacing={4}>
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <Assignment />
          </Avatar>
          <Typography variant="h5">Resumen de Envío</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Revisa que toda tu información sea correcta antes de enviar la solicitud.
        </Typography>
      </Box>

      {/* Eliminamos bordes manuales y elevation={0} para que tome la sombra y radio de tu MuiCard en el theme */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          
          {/* SECCIÓN 1: Datos Personales */}
          <Typography variant="overline" color="primary" mb={2} display="block">
            Datos Personales
          </Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2} mb={4}>
            <InfoBox 
              icon={<Person />} 
              label="Nombre Completo" // Se volverá mayúscula por tu overline
              value={data.nombre_completo || '—'} 
            />
            <InfoBox 
              icon={<Badge />} 
              label="Documento" 
              value={`${data.tipo_documento} — ${data.numero_documento || '—'}`} 
            />
            {data.fecha_nacimiento && (
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                <InfoBox 
                  icon={<Event />} 
                  label="Fecha de Nacimiento" 
                  value={new Date(data.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR')} 
                />
              </Box>
            )}
          </Box>

          {/* SECCIÓN 2: Archivos */}
          {uploadedFiles.length > 0 && (
            <>
              <Divider sx={{ my: 3, borderColor: 'secondary.main' }} />
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <InsertDriveFile color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="overline" color="primary">
                  Documentos Adjuntos
                </Typography>
              </Box>

              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }}
                gap={2}
              >
                {uploadedFiles.map(([key, file]) => (
                  <FilePreview
                    key={key}
                    label={fileLabels[key] ?? key.toUpperCase()}
                    file={file}
                  />
                ))}
              </Box>
            </>
          )}

        </CardContent>
      </Card>
    </Stack>
  );
};