import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Button, Stack, Chip, LinearProgress, 
  Paper, Divider, Tabs, Tab, Skeleton, Alert 
} from '@mui/material';
import { 
  AccessTime, 
  MonetizationOn, 
  LocationOn, 
  Business, 
  Savings 
} from '@mui/icons-material';

// Servicios y DTOs
import ProyectoService from '../../../Services/proyecto.service';
import SuscripcionService from '../../../Services/suscripcion.service';
import ImagenService from '../../../Services/imagen.service';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// Componentes Específicos (Las piezas que ya creamos)

import { useAuth } from '../../../context/AuthContext';
import { ListaLotesProyecto } from './ListaLotesProyecto';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DetalleProyecto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // 1. Obtener datos del proyecto
  const { data: proyecto, isLoading, error } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => {
      if (!id) throw new Error('ID inválido');
      const res = await ProyectoService.getByIdActive(Number(id));
      return res.data;
    },
    retry: false
  });

  // 2. Mutación para Suscripción (Solo Proyectos Mensuales)
  const subMutation = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("El proyecto no está cargado."); // 👈 Mejor lanzar error que retornar undefined
      const res = await SuscripcionService.iniciar({ id_proyecto: proyecto.id });
      return res.data;
    },
    onSuccess: (data) => {
      // ✅ Verificamos que data exista antes de leer sus propiedades
      if (!data) return;

      if (data.is2FARequired) {
        alert('Se requiere verificación 2FA para continuar.'); 
        // Aquí podrías abrir el modal de 2FA global o local
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Error al iniciar suscripción');
    }
  });
  // Helpers visuales
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Imagen de portada
  const coverImage = proyecto?.imagenes?.[0]
    ? ImagenService.resolveImageUrl(proyecto.imagenes[0].url)
    : '/images/placeholder-project.jpg'; // Asegúrate de tener esta imagen en public

  // Porcentaje de fondeo (Solo mensual)
  const porcentaje = (proyecto?.tipo_inversion === 'mensual' && proyecto?.obj_suscripciones > 0)
    ? (proyecto.suscripciones_actuales / proyecto.obj_suscripciones) * 100
    : 0;

  if (isLoading) return (
    <PageContainer>
       <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
       <Box mt={2}><Skeleton width="60%" /></Box>
    </PageContainer>
  );

  if (error || !proyecto) return (
    <PageContainer>
      <Alert severity="error">Proyecto no encontrado o no disponible.</Alert>
      <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Volver</Button>
    </PageContainer>
  );

  return (
    <PageContainer maxWidth="xl">
      
      {/* --- HERO SECTION (Imagen Principal) --- */}
      <Box 
        sx={{ 
          position: 'relative',
          height: { xs: 300, md: 450 },
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          mb: 4,
          boxShadow: 3
        }}
      >
        <Box 
          component="img"
          src={coverImage}
          alt={proyecto.nombre_proyecto}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box 
          sx={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            p: { xs: 3, md: 5 },
            color: 'white'
          }}
        >
          <Stack direction="row" spacing={1} mb={1}>
            <Chip 
              label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro' : 'Inversión Directa'} 
              color="primary" 
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              label={proyecto.estado_proyecto} 
              color={proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'} 
            />
          </Stack>
          <Typography variant="h3" fontWeight={700} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {proyecto.nombre_proyecto}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={1} sx={{ opacity: 0.9 }}>
            <LocationOn fontSize="small" />
            <Typography variant="subtitle1">{proyecto.forma_juridica || 'Ubicación no especificada'}</Typography>
          </Box>
        </Box>
      </Box>

      {/* --- CONTENIDO PRINCIPAL (Flexbox Layout) --- */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        
        {/* COLUMNA IZQUIERDA: Información Detallada */}
        <Box sx={{ flex: 1, minWidth: 0 }}> {/* minWidth 0 evita overflow en flex items */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Descripción" />
              <Tab label="Galería" />
              {/* Si es Directo, mostramos la pestaña de Lotes */}
              {proyecto.tipo_inversion === 'directo' && <Tab label="Lotes & Subasta" />}
            </Tabs>
          </Box>

          {/* Tab 0: Descripción */}
          <CustomTabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Sobre este proyecto</Typography>
            <Typography paragraph color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {proyecto.descripcion || "No hay descripción disponible para este proyecto."}
            </Typography>
            
            <Box mt={4} p={3} bgcolor="grey.50" borderRadius={2}>
              <Typography variant="subtitle2" gutterBottom>Características Principales</Typography>
              <Stack direction="row" spacing={4} mt={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">TIPO</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {proyecto.tipo_inversion === 'mensual' ? <Savings color="primary"/> : <Business color="primary"/>}
                    <Typography fontWeight="bold">
                      {proyecto.tipo_inversion === 'mensual' ? 'Plan de Ahorro' : 'Compra Directa'}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                   <Typography variant="caption" color="text.secondary">ESTADO</Typography>
                   <Typography fontWeight="bold">{proyecto.estado_proyecto}</Typography>
                </Box>
              </Stack>
            </Box>
          </CustomTabPanel>

          {/* Tab 1: Galería */}
          <CustomTabPanel value={tabValue} index={1}>
             <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2}>
                {proyecto.imagenes?.map((img, index) => (
                  <Box 
                    key={img.id} 
                    component="img" 
                    src={ImagenService.resolveImageUrl(img.url)} 
                    alt={`Galería ${index}`}
                    sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 2, cursor: 'pointer' }}
                  />
                ))}
                {(!proyecto.imagenes || proyecto.imagenes.length === 0) && (
                  <Typography color="text.secondary">No hay imágenes adicionales.</Typography>
                )}
             </Box>
          </CustomTabPanel>

          {/* Tab 2: Lotes (SOLO DIRECTO) */}
          {proyecto.tipo_inversion === 'directo' && (
            <CustomTabPanel value={tabValue} index={2}>
              {/* 🚨 AQUÍ INTEGRAMOS EL COMPONENTE QUE CREAMOS ANTES */}
              <ListaLotesProyecto idProyecto={proyecto.id} />
            </CustomTabPanel>
          )}
        </Box>

        {/* COLUMNA DERECHA: Sticky Sidebar de Inversión */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 3, 
              position: { lg: 'sticky' }, 
              top: 100 
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Resumen de Inversión
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                  <MonetizationOn /> 
                  <Typography>{proyecto.tipo_inversion === 'mensual' ? 'Cuota Mensual' : 'Inversión Base'}</Typography>
                </Box>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {proyecto.moneda} {Number(proyecto.monto_inversion).toLocaleString()}
                </Typography>
              </Box>

              {/* Lógica específica para Ahorristas (Mensual) */}
              {proyecto.tipo_inversion === 'mensual' && (
                <>
                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                      <AccessTime />
                      <Typography>Plazo Total</Typography>
                    </Box>
                    <Typography fontWeight="bold">{proyecto.plazo_inversion} Meses</Typography>
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" fontWeight="bold">Progreso de Fondeo</Typography>
                      <Typography variant="caption" fontWeight="bold">{porcentaje.toFixed(0)}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={porcentaje} 
                      sx={{ height: 10, borderRadius: 5 }} 
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                      {proyecto.suscripciones_actuales} de {proyecto.obj_suscripciones} suscriptores
                    </Typography>
                  </Box>

                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    disabled={subMutation.isPending}
                    onClick={() => {
                       if (!user) return navigate('/login', { state: { from: window.location.pathname }});
                       if (window.confirm(`¿Confirmas la suscripción por ${proyecto.moneda} ${proyecto.monto_inversion} mensuales?`)) {
                         subMutation.mutate();
                       }
                    }}
                    sx={{ py: 1.5, fontSize: '1.1rem' }}
                  >
                    {subMutation.isPending ? 'Procesando...' : 'Suscribirme al Plan'}
                  </Button>
                </>
              )}

              {/* Lógica específica para Inversionistas (Directo) */}
              {proyecto.tipo_inversion === 'directo' && (
                <Box bgcolor="grey.100" p={2} borderRadius={2} textAlign="center">
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Para invertir en este proyecto, debes seleccionar un lote específico y realizar una puja o compra directa.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    onClick={() => setTabValue(2)} // Mover a la tab de Lotes
                  >
                    Ver Lotes Disponibles
                  </Button>
                </Box>
              )}
            </Stack>

            {!user && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Inicia sesión para poder invertir.
              </Alert>
            )}
          </Paper>
        </Box>

      </Box>
    </PageContainer>
  );
};

export default DetalleProyecto;