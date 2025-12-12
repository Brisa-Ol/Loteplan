// src/pages/Proyectos/DetalleProyecto.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, Typography, Button, Stack, Chip, LinearProgress, 
  Paper, Divider, Tabs, Tab, Skeleton, Alert, Tooltip 
} from '@mui/material';
import { 
  AccessTime, MonetizationOn, LocationOn, Business, 
  Savings, GppGood
} from '@mui/icons-material';

// Servicios
import ProyectoService from '../../../Services/proyecto.service';
import SuscripcionService from '../../../Services/suscripcion.service';
import InversionService from '../../../Services/inversion.service'; // ✅ Servicio de Inversiones
import ImagenService from '../../../Services/imagen.service';

// Componentes y Contexto
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { useAuth } from '../../../context/AuthContext';
import ModalFirmaContrato from '../Contratos/components/ModalFirmaContrato';
import { VerContratoModal } from '../Contratos/components/VerContratoModal';
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel({ children, value, index, ...other }: TabPanelProps) {
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
  
  // Estados Locales
  const [tabValue, setTabValue] = useState(0);
  const [showFirma, setShowFirma] = useState(false);
  const [showContrato, setShowContrato] = useState(false);

  // 1. QUERY: Obtener datos del proyecto
  const { data: proyecto, isLoading, error } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => {
      if (!id) throw new Error('ID inválido');
      const res = await ProyectoService.getByIdActive(Number(id));
      return res.data;
    },
    retry: false
  });

  // 2. MUTATION UNIFICADA: Maneja Suscripción (Ahorro) e Inversión Directa
  const handleInversion = useMutation({
    mutationFn: async () => {
      if (!proyecto) throw new Error("Proyecto no cargado.");

      // CASO A: Plan de Ahorro (Suscripción Mensual)
      if (proyecto.tipo_inversion === 'mensual') {
         const res = await SuscripcionService.iniciar({ id_proyecto: proyecto.id });
         return { type: 'suscripcion', data: res.data };
      } 
      
      // CASO B: Inversión Directa (Pago único)
      const res = await InversionService.iniciar({ id_proyecto: proyecto.id });
      return { type: 'inversion', data: res.data };
    },
    onSuccess: ({ type, data }: any) => {
      if (!data) return;

      // A. Manejo de Seguridad (2FA requerido por el backend)
      if (data.is2FARequired) {
        alert('Se requiere verificación 2FA para continuar con el pago. Revisa tu correo o app.'); 
        // Aquí podrías redirigir a una pantalla de validación si la tuvieras
      
      // B. Redirección Directa a Pasarela (MercadoPago URL)
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      
      // C. URL Sugerida (Puede ser externa o interna) - ✅ CORRECCIÓN APLICADA
      } else if (data.url_pago_sugerida) {
         if (data.url_pago_sugerida.startsWith('http')) {
             window.location.href = data.url_pago_sugerida; // Es externa (MP)
         } else {
             navigate(data.url_pago_sugerida); // Es interna (ruta de la app)
         }

      // D. Éxito sin redirección (Queda pendiente en "Mis Pagos")
      } else {
        if (type === 'suscripcion') {
           // Oferta de firma inmediata para suscripciones
           if(window.confirm("Suscripción registrada correctamente. ¿Deseas firmar el contrato ahora?")) {
              handleClickFirmar();
           } else {
              navigate('/client/MiCuenta/MisPagos');
           }
        } else {
           // Inversión creada
           alert('Inversión registrada. Por favor procede al pago desde tu panel.');
           navigate('/client/MiCuenta/MisPagos');
        }
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Error al procesar la solicitud';
      alert(`Error: ${msg}`);
    }
  });

  // HANDLERS
  const handleClickFirmar = () => {
    if (!user) return;
    // Validación previa de 2FA
    if (!user.is_2fa_enabled) {
      if (window.confirm("⚠️ Seguridad Requerida\n\nEs obligatorio tener 2FA activado para firmar contratos.\n\n¿Ir a configurarlo ahora?")) {
        navigate('/client/MiCuenta/SecuritySettings'); 
      }
      return;
    }
    setShowFirma(true);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // HELPERS VISUALES
  const coverImage = proyecto?.imagenes?.[0]
    ? ImagenService.resolveImageUrl(proyecto.imagenes[0].url)
    : '/assets/placeholder-project.jpg'; 

  const porcentaje = (proyecto?.tipo_inversion === 'mensual' && proyecto?.obj_suscripciones > 0)
    ? (proyecto.suscripciones_actuales / proyecto.obj_suscripciones) * 100
    : 0;

  const mostrarTabLotes = proyecto?.tipo_inversion === 'directo' || 
                          (proyecto?.lotes && proyecto.lotes.length > 0);

  // RENDERIZADO DE CARGA / ERROR
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
      
      {/* ========== HERO SECTION ========== */}
      <Box sx={{ position: 'relative', height: { xs: 300, md: 450 }, width: '100%', borderRadius: 4, overflow: 'hidden', mb: 4, boxShadow: 3 }}>
        <Box component="img" src={coverImage} alt={proyecto.nombre_proyecto} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', p: { xs: 3, md: 5 }, color: 'white' }}>
          <Stack direction="row" spacing={1} mb={1}>
            <Chip label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro' : 'Inversión Directa'} color="primary" sx={{ fontWeight: 'bold' }} />
            <Chip label={proyecto.estado_proyecto} color={proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'} />
          </Stack>
          <Typography variant="h3" fontWeight={700} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{proyecto.nombre_proyecto}</Typography>
          <Box display="flex" alignItems="center" gap={1} mt={1} sx={{ opacity: 0.9 }}>
            <LocationOn fontSize="small" />
            <Typography variant="subtitle1">{proyecto.forma_juridica || 'Ubicación no especificada'}</Typography>
          </Box>
        </Box>
      </Box>

      {/* ========== CONTENIDO PRINCIPAL ========== */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        
        {/* COLUMNA IZQUIERDA: TABS */}
        <Box sx={{ flex: 1, minWidth: 0 }}> 
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Descripción" />
              <Tab label="Galería" />
              {mostrarTabLotes && <Tab label="Lotes Disponibles" />}
            </Tabs>
          </Box>

          {/* TAB 0: DESCRIPCIÓN */}
          <CustomTabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Sobre este proyecto</Typography>
            <Typography paragraph color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {proyecto.descripcion || "No hay descripción disponible."}
            </Typography>
            
            <Box mt={4} p={3} bgcolor="grey.50" borderRadius={2}>
              <Typography variant="subtitle2" gutterBottom>Características Principales</Typography>
              <Stack direction="row" spacing={4} mt={2} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" color="text.secondary">TIPO</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {proyecto.tipo_inversion === 'mensual' ? <Savings color="primary"/> : <Business color="primary"/>}
                    <Typography fontWeight="bold">{proyecto.tipo_inversion === 'mensual' ? 'Plan de Ahorro' : 'Compra Directa'}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ESTADO</Typography>
                  <Typography fontWeight="bold">{proyecto.estado_proyecto}</Typography>
                </Box>
                {mostrarTabLotes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">LOTES</Typography>
                    <Typography fontWeight="bold">{proyecto.lotes?.length || 0} Disponibles</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </CustomTabPanel>

          {/* TAB 1: GALERÍA */}
          <CustomTabPanel value={tabValue} index={1}>
             <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2}>
                {proyecto.imagenes?.map((img, index) => (
                  <Box key={img.id} component="img" src={ImagenService.resolveImageUrl(img.url)} alt={`Galería ${index}`} 
                    sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 2, cursor: 'pointer' }} 
                  />
                ))}
                {(!proyecto.imagenes || proyecto.imagenes.length === 0) && <Typography color="text.secondary">No hay imágenes.</Typography>}
             </Box>
          </CustomTabPanel>

          {/* TAB 2: LOTES */}
          {mostrarTabLotes && (
            <CustomTabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {proyecto.tipo_inversion === 'directo' ? 'Lotes en Subasta' : 'Lotes del Proyecto'}
              </Typography>
              
              {proyecto.tipo_inversion === 'directo' && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Para invertir en este proyecto, selecciona un lote y participa en la subasta o compra directa.
                </Alert>
              )}

              {/* Listado de Lotes con funcionalidad de Favoritos integrada */}
              <ListaLotesProyecto idProyecto={Number(id)} />
              
            </CustomTabPanel>
          )}
        </Box>

        {/* COLUMNA DERECHA: SIDEBAR DE INVERSIÓN */}
        <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, position: { lg: 'sticky' }, top: 100 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Resumen de Inversión</Typography>
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

              {/* Info extra para Planes Mensuales */}
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
                    <LinearProgress variant="determinate" value={porcentaje} sx={{ height: 10, borderRadius: 5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                      {proyecto.suscripciones_actuales} de {proyecto.obj_suscripciones} suscriptores
                    </Typography>
                  </Box>
                </>
              )}

              {/* 🟢 BOTÓN PRINCIPAL DE ACCIÓN */}
              <Button 
                variant="contained" size="large" fullWidth 
                disabled={handleInversion.isPending}
                onClick={() => {
                    if (!user) return navigate('/login', { state: { from: window.location.pathname }});
                    // Confirmación visual antes de mutar
                    if (window.confirm(`¿Confirmas la operación para ${proyecto.nombre_proyecto}?`)) {
                        handleInversion.mutate();
                    }
                }}
                sx={{ py: 1.5, fontSize: '1.1rem' }}
              >
                {handleInversion.isPending ? 'Procesando...' : 
                  proyecto.tipo_inversion === 'mensual' ? 'Suscribirme al Plan' : 'Invertir Ahora'}
              </Button>

              {/* Botones de Contrato (Solo si está logueado y es mensual) */}
              {user && proyecto.tipo_inversion === 'mensual' && (
                <>
                  <Tooltip title="Firma tu contrato aquí.">
                    <Button variant="outlined" color="success" startIcon={<GppGood />} fullWidth onClick={handleClickFirmar} sx={{ mt: 1 }}>
                      Firmar Contrato Digital
                    </Button>
                  </Tooltip>
                  <Button variant="text" fullWidth onClick={() => setShowContrato(true)} sx={{ mt: 1, fontSize: '0.875rem' }}>
                    Ver Plantilla del Contrato
                  </Button>
                </>
              )}

              {/* Panel Informativo para Inversión Directa */}
              {proyecto.tipo_inversion === 'directo' && (
                <Box bgcolor="grey.100" p={2} borderRadius={2} textAlign="center">
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {mostrarTabLotes ? `${proyecto.lotes?.length || 0} lotes disponibles` : 'Selecciona un lote.'}
                  </Typography>
                  <Button variant="outlined" fullWidth onClick={() => setTabValue(2)} disabled={!mostrarTabLotes}>
                    {mostrarTabLotes ? 'Ver Lotes' : 'Sin lotes disponibles'}
                  </Button>
                </Box>
              )}
            </Stack>
            {!user && <Alert severity="info" sx={{ mt: 3 }}>Inicia sesión para invertir.</Alert>}
          </Paper>
        </Box>
      </Box>

      {/* MODALES CONECTADOS */}
      {user && (
        <>
          <ModalFirmaContrato 
            open={showFirma} 
            onClose={() => setShowFirma(false)} 
            idProyecto={Number(id)} 
            idUsuario={user.id} 
            onFirmaExitosa={() => navigate('/client/MiCuenta/Contratos')} // Redirige al historial de contratos
          />
          <VerContratoModal 
            open={showContrato} 
            onClose={() => setShowContrato(false)} 
            idProyecto={Number(id)} 
            nombreProyecto={proyecto.nombre_proyecto}
          />
        </>
      )}

    </PageContainer>
  );
};

export default DetalleProyecto;