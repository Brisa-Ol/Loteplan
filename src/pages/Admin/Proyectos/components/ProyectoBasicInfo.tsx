// src/components/Admin/Proyectos/Components/ProyectoBasicInfo.tsx
import React from 'react';
import {
  Box, Paper, Typography, Button, Stack, Chip, Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

import type { ProyectoDTO } from '../../../../types/dto/proyecto.dto';

interface ProyectoBasicInfoProps {
  proyecto: ProyectoDTO;
  onEdit: () => void;
  onManageImages: () => void;
}

// Función helper para formatear fechas DATEONLY (ej: "2025-11-17") sin errores de zona horaria
const formatSafeDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  // Añadir T00:00:00 previene que new Date() interprete la fecha como UTC
  // y la mueva un día atrás por la zona horaria.
  return new Date(dateString + 'T00:00:00').toLocaleDateString();
};

const ProyectoBasicInfo: React.FC<ProyectoBasicInfoProps> = ({
  proyecto,
  onEdit,
  onManageImages
}) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  return (
    <Box sx={{ px: 3 }}>
      {/* El header se mantiene igual, ya usaba Stack */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">Información del Proyecto</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={onManageImages}
          >
            Gestionar Imágenes ({proyecto.imagenes?.length || 0})
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={onEdit}
          >
            Editar Información
          </Button>
        </Stack>
      </Stack>

      {/* ALTERNATIVA A GRID: 
        Usamos un <Stack> vertical principal para apilar las secciones.
        La primera sección es un <Stack> horizontal anidado para las dos columnas.
      */}
      <Stack spacing={3}>
        
        {/* Sección 1: Dos Columnas (reemplaza Grid container con 2 Grid items md={6}) */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
          
          {/* Columna Izquierda: Datos Básicos */}
          <Paper 
            variant="outlined" 
            sx={{ p: 3, width: { xs: '100%', md: '50%' } }}
          >
            <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
              DATOS GENERALES
            </Typography>

            <Stack spacing={2} mt={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre del Proyecto</Typography>
                <Typography variant="body1" fontWeight={500}>{proyecto.nombre_proyecto}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Descripción</Typography>
                <Typography variant="body2">
                  {proyecto.descripcion || 'Sin descripción'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">Forma Jurídica</Typography>
                <Typography variant="body1">{proyecto.forma_juridica || 'No especificada'}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Tipo de Inversión</Typography>
                <Chip
                  label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro (Mensual)' : 'Inversión (Directo)'}
                  color={proyecto.tipo_inversion === 'mensual' ? 'primary' : 'secondary'}
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Estado del Proyecto</Typography>
                <Chip
                  label={proyecto.estado_proyecto}
                  color={
                    proyecto.estado_proyecto === 'En Espera' ? 'warning' :
                    proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'
                  }
                  size="small"
                />
              </Box>
            </Stack>
          </Paper>

          {/* Columna Derecha: Datos Financieros y Temporales */}
          <Paper 
            variant="outlined" 
            sx={{ p: 3, width: { xs: '100%', md: '50%' } }}
          >
            <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
              DATOS FINANCIEROS Y TEMPORALES
            </Typography>

            <Stack spacing={2} mt={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {proyecto.tipo_inversion === 'mensual' ? 'Monto Cuota Mensual' : 'Monto de Inversión'}
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {/* ❗ CORRECCIÓN: Convertir a número antes de formatear */}
                  ${Number(proyecto.monto_inversion).toLocaleString()} {proyecto.moneda}
                </Typography>
              </Box>

              {proyecto.tipo_inversion === 'mensual' && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Plazo de Inversión</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {proyecto.plazo_inversion} meses
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">Suscripciones</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones}
                      {proyecto.suscripciones_minimas && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          (mínimo: {proyecto.suscripciones_minimas})
                        </Typography>
                      )}
                    </Typography>
                  </Box>

                  {proyecto.estado_proyecto === 'En proceso' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Meses Restantes</Typography>
                      <Typography variant="body1" fontWeight={500} color="warning.main">
                        {proyecto.meses_restantes} de {proyecto.plazo_inversion}
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              <Divider />

              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">Fechas del Proyecto</Typography>
                </Stack>
                <Typography variant="body2">
                  {/* ❗ CORRECCIÓN: Usar helper para formato seguro de fecha */}
                  <strong>Inicio:</strong> {formatSafeDate(proyecto.fecha_inicio)}
                </Typography>
                <Typography variant="body2">
                  <strong>Cierre:</strong> {formatSafeDate(proyecto.fecha_cierre)}
                </Typography>
                {proyecto.fecha_inicio_proceso && (
                  <Typography variant="body2" color="success.main">
                    <strong>Inicio Proceso:</strong> {formatSafeDate(proyecto.fecha_inicio_proceso)}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        </Stack> {/* Fin del Stack de 2 columnas */}

        {/* Fila Completa: Ubicación Geográfica (reemplaza Grid item xs={12}) */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <LocationIcon color="primary" />
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              UBICACIÓN GEOGRÁFICA
            </Typography>
          </Stack>

          {proyecto.latitud && proyecto.longitud ? (
            // Alternativa a Grid: Stack vertical
            <Stack spacing={2}>
              {/* Stack anidado para las coordenadas */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="caption" color="text.secondary">Latitud</Typography>
                  <Typography variant="body1" fontWeight={500}>{proyecto.latitud}</Typography>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="caption" color="text.secondary">Longitud</Typography>
                  <Typography variant="body1" fontWeight={500}>{proyecto.longitud}</Typography>
                </Box>
              </Stack>
              
              {/* Botón */}
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  // ❗ CORRECCIÓN: URL de Google Maps
                  href={`https://www.google.com/maps/search/?api=1&query=${proyecto.latitud},${proyecto.longitud}`}
                  target="_blank"
                  startIcon={<LocationIcon />}
                >
                  Ver en Google Maps
                </Button>
              </Box>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No se han especificado coordenadas geográficas para este proyecto.
            </Typography>
          )}
        </Paper>

        {/* Fila Completa: Galería de Imágenes (reemplaza Grid item xs={12}) */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              GALERÍA DE IMÁGENES ({proyecto.imagenes?.length || 0})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ImageIcon />}
              onClick={onManageImages}
            >
              Gestionar
            </Button>
          </Stack>

          {proyecto.imagenes && proyecto.imagenes.length > 0 ? (
            /* ALTERNATIVA A GRID: 
              Usamos <Box display="grid"> (CSS Grid) que es ideal para galerías.
              Esto reemplaza a <Grid container> y <Grid item xs={6} sm={4} md={3}>
            */
            <Box sx={{
              display: 'grid',
              gap: 2, // 16px (equivale a spacing={2} de Grid)
              // Define las columnas responsivas
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)', // 2 columnas en xs
                sm: 'repeat(3, 1fr)', // 3 columnas en sm
                md: 'repeat(4, 1fr)', // 4 columnas en md
              }
            }}>
              {proyecto.imagenes.map((imagen) => (
                <Box
                  key={imagen.id}
                  component="img"
                  src={`${API_BASE_URL}${imagen.url}`} // Asume que la URL necesita el prefijo
                  alt={imagen.descripcion || 'Imagen del proyecto'}
                  sx={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay imágenes asociadas a este proyecto.
            </Typography>
          )}
        </Paper>
      </Stack>
    </Box>
  );
};

export default ProyectoBasicInfo;