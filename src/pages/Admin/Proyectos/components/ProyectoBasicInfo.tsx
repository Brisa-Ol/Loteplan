// src/components/Admin/Proyectos/Components/ProyectoBasicInfo.tsx
import React from 'react';
import {
  Box, Paper, Typography, Button, Stack, Chip, Divider, 
  alpha, useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarMonthIcon,
  Description as DescriptionIcon,
  Gavel as LawIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';

interface ProyectoBasicInfoProps {
  proyecto: ProyectoDto;
  onEdit: () => void;
  onManageImages: () => void;
}

const ProyectoBasicInfo: React.FC<ProyectoBasicInfoProps> = ({
  proyecto,
  onEdit,
  onManageImages
}) => {
  const theme = useTheme();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Estilos reutilizables
  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'text.secondary',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    mb: 0.5,
    display: 'flex', 
    alignItems: 'center', 
    gap: 0.5
  };

  const valueStyle = {
    fontWeight: 500,
    color: 'text.primary',
    fontSize: '0.95rem'
  };

  const cardStyle = {
    p: 3, 
    height: '100%', 
    border: '1px solid', 
    borderColor: 'divider', 
    borderRadius: 3,
    bgcolor: 'background.paper'
  };

  return (
    <Box sx={{ px: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={1} alignItems="center">
            <InfoIcon color="primary" />
            <Typography variant="h6" fontWeight={800} color="text.primary">
                Información General
            </Typography>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={onManageImages}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Galería ({proyecto.imagenes?.length || 0})
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: theme.shadows[3] }}
          >
            Editar Datos
          </Button>
        </Stack>
      </Stack>

      {/* Layout Principal con Stack */}
      <Stack spacing={3}>
        
        {/* Fila 1: Dos Columnas (Datos y Finanzas) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
            
            {/* --- Columna Izquierda: Datos Básicos --- */}
            <Box flex={1}>
                <Paper elevation={0} sx={cardStyle}>
                    <Typography sx={{ ...labelStyle, mb: 2, color: 'primary.main' }}>
                        <DescriptionIcon fontSize="inherit" /> DATOS DEL PROYECTO
                    </Typography>

                    <Stack spacing={2.5}>
                        <Box>
                            <Typography sx={labelStyle}>Nombre</Typography>
                            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{proyecto.nombre_proyecto}</Typography>
                        </Box>

                        <Box>
                            <Typography sx={labelStyle}>Descripción</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {proyecto.descripcion || 'Sin descripción detallada.'}
                            </Typography>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed' }} />

                        <Stack direction="row" spacing={4}>
                            <Box>
                                <Typography sx={labelStyle}><LawIcon fontSize="inherit"/> Forma Jurídica</Typography>
                                <Typography sx={valueStyle}>{proyecto.forma_juridica || 'No especificada'}</Typography>
                            </Box>
                            <Box>
                                <Typography sx={labelStyle}>Modalidad</Typography>
                                <Chip
                                    label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro (Mensual)' : 'Inversión (Directo)'}
                                    size="small"
                                    sx={{ 
                                        fontWeight: 700, 
                                        borderRadius: 1,
                                        bgcolor: proyecto.tipo_inversion === 'mensual' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.secondary.main, 0.1),
                                        color: proyecto.tipo_inversion === 'mensual' ? 'primary.main' : 'secondary.main',
                                        border: '1px solid',
                                        borderColor: proyecto.tipo_inversion === 'mensual' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.secondary.main, 0.2)
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Stack>
                </Paper>
            </Box>

            {/* --- Columna Derecha: Datos Financieros --- */}
            <Box flex={1}>
                <Paper elevation={0} sx={cardStyle}>
                    <Typography sx={{ ...labelStyle, mb: 2, color: 'success.main' }}>
                        <MoneyIcon fontSize="inherit" /> DATOS FINANCIEROS Y TEMPORALES
                    </Typography>
                    
                    <Stack spacing={3}>
                        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography sx={labelStyle}>
                                {proyecto.tipo_inversion === 'mensual' ? 'Valor Cuota Mensual' : 'Capital Requerido'}
                            </Typography>
                            <Typography variant="h4" color="text.primary" fontWeight={800} sx={{ fontFamily: 'monospace', letterSpacing: -1 }}>
                                ${Number(proyecto.monto_inversion).toLocaleString()} <Typography component="span" variant="h6" color="text.secondary">{proyecto.moneda}</Typography>
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography sx={{ ...labelStyle, mb: 1 }}>
                                <CalendarMonthIcon fontSize="inherit" /> Ciclo de Vida
                            </Typography>
                            <Stack direction="row" spacing={4}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>INICIO</Typography>
                                    <Typography variant="body1" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                                        {new Date(proyecto.fecha_inicio).toLocaleDateString()}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>CIERRE ESTIMADO</Typography>
                                    <Typography variant="body1" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                                        {new Date(proyecto.fecha_cierre).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        </Stack>

        {/* Fila 2: Ubicación */}
        <Paper elevation={0} sx={cardStyle}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography sx={{ ...labelStyle, mb: 2, color: 'error.main' }}>
                        <LocationIcon fontSize="inherit" /> GEOLOCALIZACIÓN
                    </Typography>
                    
                    {proyecto.latitud && proyecto.longitud ? (
                        <Stack direction="row" spacing={4} mb={1}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">LATITUD</Typography>
                                <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{proyecto.latitud}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">LONGITUD</Typography>
                                <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{proyecto.longitud}</Typography>
                            </Box>
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No se han especificado coordenadas.
                        </Typography>
                    )}
                </Box>

                {proyecto.latitud && proyecto.longitud && (
                    <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        href={`https://www.google.com/maps/search/?api=1&query=${proyecto.latitud},${proyecto.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer" 
                        startIcon={<LocationIcon />}
                        sx={{ borderRadius: 2, borderColor: alpha(theme.palette.error.main, 0.3) }}
                    >
                        Ver en Mapa
                    </Button>
                )}
            </Stack>
        </Paper>

        {/* Fila 3: Galería (Layout Flexbox personalizado) */}
        <Paper elevation={0} sx={{ ...cardStyle, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography sx={{ ...labelStyle, mb: 0 }}>
                    <ImageIcon fontSize="inherit" /> VISTA PREVIA DE GALERÍA
                </Typography>
                <Button size="small" onClick={onManageImages}>Ver Todo</Button>
            </Stack>
            
            {proyecto.imagenes && proyecto.imagenes.length > 0 ? (
                // Contenedor Flex para reemplazar el Grid container
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {proyecto.imagenes.slice(0, 4).map((imagen) => (
                        // Item Flex para reemplazar Grid item
                        <Box 
                            key={imagen.id}
                            sx={{
                                width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' }, // Cálculo manual de ancho con gap
                                position: 'relative',
                                paddingTop: { xs: '56.25%', md: '18%' }, // Aspect Ratio responsive
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)', boxShadow: theme.shadows[2] }
                            }}
                        >
                            <Box
                                component="img"
                                src={`${API_BASE_URL}${imagen.url}`}
                                alt={imagen.descripcion || 'Proyecto'}
                                sx={{
                                    position: 'absolute',
                                    top: 0, left: 0,
                                    width: '100%', height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                    No hay imágenes para mostrar.
                </Typography>
            )}
        </Paper>

      </Stack>
    </Box>
  );
};

export default ProyectoBasicInfo;