import React from "react";
import {
  Card, CardMedia, CardContent, Typography, Chip, Box, Button,
  useTheme, alpha, Divider, Stack, LinearProgress, Tooltip
} from "@mui/material";
import {
  ArrowForward, CalendarMonth, MonetizationOn, MapsHomeWork,
  GppGood, Group, AccessTime, LocalOffer
} from "@mui/icons-material";
import ImagenService from "@/core/api/services/imagen.service";
import type { ProyectoDto } from "@/core/types/dto/proyecto.dto";

// ==========================================
// 1. HELPERS & UTILS
// ==========================================

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'En proceso': return { label: 'Activo', color: 'success' as const };
    case 'Finalizado': return { label: 'Finalizado', color: 'default' as const };
    default: return { label: 'Próximamente', color: 'info' as const };
  }
};

const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const getDaysRemaining = (dateString: string) => {
  if (!dateString) return 0;
  const end = new Date(dateString);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
};

// ==========================================
// 2. SUB-COMPONENTES
// ==========================================

const StatItem: React.FC<{ label: string; icon: React.ReactNode; value: string | number; align?: 'left' | 'right' }> = ({ label, icon, value, align = 'left' }) => (
  <Box textAlign={align}>
    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
      {label}
    </Typography>
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent={align === 'right' ? 'flex-end' : 'flex-start'} color={align === 'left' ? "primary.main" : "text.primary"}>
      {icon}
      <Typography variant={align === 'left' ? "subtitle1" : "subtitle2"} fontWeight={align === 'left' ? 800 : 700}>
        {value}
      </Typography>
    </Stack>
  </Box>
);

// --- Header Mejorado: Manejo robusto de imágenes ---
const CardHeader: React.FC<{ project: ProyectoDto }> = ({ project }) => {
  const { label, color } = getStatusConfig(project.estado_proyecto);

  // 1. Resolvemos la URL usando tu Service actualizado
  const imageUrl = project.imagenes && project.imagenes.length > 0
    ? ImagenService.resolveImageUrl(project.imagenes[0].url) 
    : '/assets/placeholder-project.jpg'; // Ruta por defecto si no hay array

  return (
    <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
      <CardMedia
        component="img"
        height="100%"
        image={imageUrl}
        alt={project.nombre_proyecto}
        sx={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
        
        // ✅ 2. Manejador de Error BLINDADO
        onError={(e) => {
            const img = e.target as HTMLImageElement;
            const fallback = '/assets/placeholder-project.jpg';
            
            // Evitar bucle infinito: Si ya intentamos cargar el placeholder y falló, no hacemos nada más.
            if (img.src.includes('placeholder-project.jpg')) return;
            
            console.warn(`Falló carga de imagen para ${project.nombre_proyecto}. Usando fallback.`);
            img.src = fallback; 
        }}
      />
      
      {/* Overlay Gradiente */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 50%)',
        pointerEvents: 'none'
      }} />
      
      {/* Badge Estado */}
      <Chip
        label={label}
        color={color}
        size="small"
        variant="filled"
        sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, boxShadow: 3, height: 24 }}
      />

      {/* Badge Pack */}
      {project.pack_de_lotes && (
        <Chip
          icon={<LocalOffer sx={{ fontSize: '14px !important', color: 'white !important' }} />}
          label="Pack Lotes"
          size="small"
          sx={{ 
            position: 'absolute', top: 12, left: 12, 
            fontWeight: 700, boxShadow: 3, height: 24,
            bgcolor: 'secondary.main', color: 'white'
          }}
        />
      )}
    </Box>
  );
};

const CardInfo: React.FC<{ project: ProyectoDto; type: "ahorrista" | "inversionista" }> = ({ project, type }) => {
  const theme = useTheme();
  
  const daysLeft = getDaysRemaining(project.fecha_cierre);
  const percent = project.obj_suscripciones > 0 
    ? (project.suscripciones_actuales / project.obj_suscripciones) * 100 
    : 0;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Chip
          label={type === "ahorrista" ? "Plan Ahorro" : "Inversión"}
          size="small"
          variant="outlined"
          sx={{
            borderRadius: 1, height: 20, fontSize: '0.65rem', fontWeight: 700,
            borderColor: theme.palette.primary.main, color: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.05)
          }}
        />

        {daysLeft > 0 && daysLeft <= 30 && project.estado_proyecto === 'En proceso' && (
          <Tooltip title={`Cierra el ${new Date(project.fecha_cierre).toLocaleDateString()}`}>
             <Chip 
                icon={<AccessTime sx={{ fontSize: '14px !important' }} />}
                label={`${daysLeft} días rest.`}
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', border: 'none', bgcolor: alpha(theme.palette.warning.main, 0.1) }}
             />
          </Tooltip>
        )}
      </Stack>

      <Typography variant="h6" gutterBottom fontWeight={700} noWrap title={project.nombre_proyecto} sx={{ mb: 0.5 }}>
        {project.nombre_proyecto}
      </Typography>

      <Stack direction="row" spacing={2} mb={1.5} alignItems="center">
        {project.forma_juridica && (
          <Tooltip title="Respaldo Legal">
             <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
               <GppGood sx={{ fontSize: 16, color: 'success.main' }} />
               <Typography variant="caption" fontWeight={500} noWrap sx={{ maxWidth: 100 }}>
                 {project.forma_juridica}
               </Typography>
             </Stack>
          </Tooltip>
        )}
        {project.suscripciones_actuales > 0 && (
           <Tooltip title="Inversores actuales">
             <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
               <Group sx={{ fontSize: 16, color: 'action.active' }} />
               <Typography variant="caption" fontWeight={500}>
                 {project.suscripciones_actuales} inv.
               </Typography>
             </Stack>
           </Tooltip>
        )}
      </Stack>

      {type === 'ahorrista' && project.estado_proyecto === 'En proceso' && project.obj_suscripciones > 0 && (
        <Box sx={{ mb: 2 }}>
           <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={700} color="primary.main" fontSize="0.7rem">
                 {Math.round(percent)}% Financiado
              </Typography>
           </Stack>
           <LinearProgress 
              variant="determinate" 
              value={percent > 100 ? 100 : percent} 
              sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }} 
           />
        </Box>
      )}

      {type !== 'ahorrista' && (
        <Typography variant="body2" color="text.secondary" mb={2} sx={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', minHeight: 40, fontSize: '0.875rem', lineHeight: 1.5
        }}>
          {project.descripcion || 'Sin descripción disponible.'}
        </Typography>
      )}
    </>
  );
};

const CardFinancials: React.FC<{ project: ProyectoDto; type: "ahorrista" | "inversionista"; onClick?: () => void }> = ({ project, type, onClick }) => {
  const monto = formatMoney(Number(project.monto_inversion), project.moneda);

  return (
    <Box mt="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <StatItem 
          label={type === "ahorrista" ? "Valor de Cuota" : "Inversión Total"}
          icon={<MonetizationOn sx={{ fontSize: 18 }} />}
          value={monto}
        />
        
        <StatItem 
          align="right"
          label={type === "ahorrista" ? "Plazo Total" : "Disponibilidad"}
          icon={type === "ahorrista" ? <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} /> : <MapsHomeWork sx={{ fontSize: 16, color: 'text.secondary' }} />}
          value={type === "ahorrista" ? `${project.plazo_inversion} meses` : `${project.lotes?.length || 0} Lotes`}
        />
      </Stack>

      <Button
        variant="contained" fullWidth disableElevation
        endIcon={<ArrowForward />}
        onClick={onClick}
        sx={{ mt: 3, fontWeight: 700, borderRadius: 2, textTransform: 'none', py: 1.2 }}
      >
        Ver Oportunidad
      </Button>
    </Box>
  );
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================

export interface ProjectCardProps {
  project: ProyectoDto;
  type: "ahorrista" | "inversionista";
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, type, onClick }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%", display: "flex", flexDirection: "column",
        borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper', transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: 'relative',
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[8],
          borderColor: theme.palette.primary.main
        },
      }}
    >
      <CardHeader project={project} />
      
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2.5 }}>
        <CardInfo project={project} type={type} />
        
        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
        
        <CardFinancials project={project} type={type} onClick={onClick} />
      </CardContent>
    </Card>
  );
};