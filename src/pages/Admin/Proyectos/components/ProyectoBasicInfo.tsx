// src/components/Admin/Proyectos/Components/ProyectoBasicInfo.tsx
import React from 'react';
import {
  Box, Paper, Typography, Button, Stack, Chip, Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarMonthIcon
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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  return (
    <Box sx={{ px: 3 }}>
      {/* Header */}
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

      {/* Layout Principal */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 3 
      }}>
        
        {/* --- Columna Izquierda: Datos Básicos --- */}
        <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
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
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {proyecto.descripcion || 'Sin descripción'}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="caption" color="text.secondary">Forma Jurídica</Typography>
              <Typography variant="body1">{proyecto.forma_juridica || 'No especificada'}</Typography>
            </Box>

            <Box>
                {/* ... Resto de los campos igual ... */}
                {/* Asegúrate de que las propiedades coincidan con tu DTO */}
                <Typography variant="caption" color="text.secondary">Tipo de Inversión</Typography>
                 <Chip
                label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro (Mensual)' : 'Inversión (Directo)'}
                color={proyecto.tipo_inversion === 'mensual' ? 'primary' : 'secondary'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
             {/* ... Estado del proyecto igual ... */}
          </Stack>
        </Paper>

        {/* --- Columna Derecha: Datos Financieros --- */}
        <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
           {/* ... Contenido igual al original ... */}
             <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
            DATOS FINANCIEROS Y TEMPORALES
          </Typography>
           <Stack spacing={2} mt={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {proyecto.tipo_inversion === 'mensual' ? 'Monto Cuota Mensual' : 'Monto de Inversión'}
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                ${proyecto.monto_inversion?.toLocaleString()} {proyecto.moneda}
              </Typography>
            </Box>
            {/* ... Resto de lógica financiera igual ... */}
             <Divider />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                
                <CalendarMonthIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">Fechas del Proyecto</Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>Inicio:</strong> {new Date(proyecto.fecha_inicio).toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                <strong>Cierre:</strong> {new Date(proyecto.fecha_cierre).toLocaleDateString()}
              </Typography>
            </Box>
           </Stack>
        </Paper>

        {/* --- Fila Completa: Ubicación Geográfica --- */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <LocationIcon color="primary" />
              <Typography variant="subtitle2" color="primary" fontWeight="bold">
                UBICACIÓN GEOGRÁFICA
              </Typography>
            </Stack>

            {proyecto.latitud && proyecto.longitud ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Latitud</Typography>
                  <Typography variant="body1" fontWeight={500}>{proyecto.latitud}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Longitud</Typography>
                  <Typography variant="body1" fontWeight={500}>{proyecto.longitud}</Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  {/* CORRECCIÓN PRINCIPAL AQUÍ: URL VÁLIDA DE GOOGLE MAPS */}
                  <Button
                    variant="outlined"
                    size="small"
                    href={`https://www.google.com/maps/search/?api=1&query=${proyecto.latitud},${proyecto.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer" 
                    startIcon={<LocationIcon />}
                  >
                    Ver en Google Maps
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No se han especificado coordenadas geográficas.
              </Typography>
            )}
          </Paper>
        </Box>

        {/* --- Fila Completa: Galería --- */}
        {/* ... El código de la galería estaba bien ... */}
        <Box sx={{ gridColumn: '1 / -1' }}>
             <Paper variant="outlined" sx={{ p: 3 }}>
             <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold">
                GALERÍA DE IMÁGENES ({proyecto.imagenes?.length || 0})
              </Typography>
              <Button variant="outlined" size="small" startIcon={<ImageIcon />} onClick={onManageImages}>
                Gestionar
              </Button>
            </Stack>
             {proyecto.imagenes && proyecto.imagenes.length > 0 ? (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
                gap: 2 
              }}>
                {proyecto.imagenes.map((imagen) => (
                  <Box key={imagen.id}>
                    <Box
                      component="img"
                      src={`${API_BASE_URL}${imagen.url}`}
                      alt={imagen.descripcion || 'Imagen del proyecto'}
                      sx={{
                        width: '100%', height: 180, objectFit: 'cover',
                        borderRadius: 1, border: '1px solid', borderColor: 'divider'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No hay imágenes asociadas.</Typography>
            )}
             </Paper>
        </Box>

      </Box>
    </Box>
  );
};

export default ProyectoBasicInfo;