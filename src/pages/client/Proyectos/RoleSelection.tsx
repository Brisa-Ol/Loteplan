import React from "react";
import { 
  Box, Typography, Card, CardContent, Avatar, 
  useTheme, alpha, Button 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { 
  Home as HomeIcon, // Cambiamos a una casita para el ahorrista (más emocional)
  TrendingUp as TrendingUpIcon, 
  ArrowForward
} from "@mui/icons-material";
import { PageContainer, PageHeader } from "../../../components/common";

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const roles = [
    {
      key: "ahorrista",
      // Título enfocado en el objetivo final, no en el método
      title: "Quiero mi Lote Propio", 
      // Copy persuasivo: Ataca el dolor (alquilar) y ofrece la solución (ser dueño)
      description: "Deja de esperar y empieza a ser dueño. Financia tu terreno 100% en pesos y cuotas a tu medida. El primer paso hacia la casa de tus sueños.",
      icon: <HomeIcon fontSize="large" />,
      route: "/proyectos/ahorrista",
      isPrimary: false,
    },
    {
      key: "inversionista",
      title: "Busco Rentabilidad", 
      // CAMBIO AQUÍ: "aprovecha la revalorización" en vez de "capitalízate con la plusvalía"
      description: "Haz que tu capital trabaje para vos. Accede a precios mayoristas, aprovecha la revalorización del desarrollo y multiplica tus ahorros.",
      icon: <TrendingUpIcon fontSize="large" />,
      route: "/proyectos/inversionista",
      isPrimary: true,
    },
  ];

  return (
    <PageContainer maxWidth="lg">
      <Box textAlign="center" mb={6}>
        <PageHeader
          title="¿Cuál es tu objetivo hoy?"
          subtitle="Diseñamos dos planes a la medida de tus metas. Elige cómo quieres crecer."
        />
      </Box>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 4,
          maxWidth: 900,
          mx: 'auto'
        }}
      >
        {roles.map((role) => (
          <Card
            key={role.key}
            elevation={0}
            onClick={() => handleCardClick(role.route)}
            sx={{
              position: 'relative',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 4,
              border: '1px solid',
              borderColor: role.isPrimary ? alpha(theme.palette.primary.main, 0.5) : theme.palette.divider,
              bgcolor: role.isPrimary ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                borderColor: 'primary.main',
                '& .icon-avatar': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  transform: 'scale(1.1)'
                }
              }
            }}
          >
            <CardContent sx={{ p: 5, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              
              <Avatar
                className="icon-avatar"
                sx={{
                  width: 80, height: 80, mb: 3,
                  transition: 'all 0.3s ease',
                  bgcolor: role.isPrimary ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.secondary.main, 0.2),
                  color: role.isPrimary ? 'primary.main' : 'text.secondary'
                }}
              >
                {role.icon}
              </Avatar>

              <Typography variant="h5" fontWeight={800} gutterBottom color="text.primary">
                {role.title}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                {role.description}
              </Typography>

              <Box mt="auto">
                <Button 
                  variant={role.isPrimary ? "contained" : "outlined"} 
                  color="primary"
                  endIcon={<ArrowForward />}
                  sx={{ 
                    borderRadius: 3, 
                    px: 4, 
                    py: 1,
                    pointerEvents: 'none',
                    fontWeight: 700
                  }}
                >
                  {role.isPrimary ? 'Comenzar a Invertir' : 'Ver Financiación'}
                </Button>
              </Box>

            </CardContent>
          </Card>
        ))}
      </Box>
    </PageContainer>
  );
};

export default RoleSelection;