import React from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Typography, Divider, Avatar, IconButton, useTheme, useMediaQuery 
} from '@mui/material';
import { 
  Dashboard, 
  AccountCircle, 
  MonetizationOn, 
  Gavel, 
  Description, 
  Logout,
  Savings,
  Business,
  AdminPanelSettings,
  Close,
  People,
  VerifiedUser
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

// ⚠️ CRÍTICO: Esta constante es usada por MainLayout para calcular el ancho
export const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // --- CONFIGURACIÓN DE MENÚS ---

  // Menú común para Clientes
  const clientItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { type: 'divider' },
    { text: 'Catálogo Ahorro', icon: <Savings />, path: '/proyectos/ahorrista' },
    { text: 'Catálogo Inversión', icon: <Business />, path: '/proyectos/inversionista' },
    { type: 'divider' },
    { text: 'Mis Pagos', icon: <MonetizationOn />, path: '/mis-pagos' },
    { text: 'Mis Subastas', icon: <Gavel />, path: '/mis-pujas' },
    { text: 'Mis Suscripciones', icon: <Description />, path: '/mis-suscripciones' },
    { text: 'Mis Documentos', icon: <Description />, path: '/mis-documentos' },
  ];

  // Menú extra para Administradores
  const adminItems = [
    { type: 'header', text: 'ADMINISTRACIÓN' },
    { text: 'Panel Admin', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Usuarios', icon: <People />, path: '/admin/usuarios' },
    { text: 'Verificaciones KYC', icon: <VerifiedUser />, path: '/admin/kyc' },
    { text: 'Gestionar Proyectos', icon: <AdminPanelSettings />, path: '/admin/proyectos' },
  ];

  // Decidir qué items mostrar
  const menuItems = user?.rol === 'admin' 
    ? [...adminItems, { type: 'divider' }, ...clientItems] // Admin ve todo
    : clientItems; // Cliente ve solo lo suyo

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onClose(); // Cerrar sidebar en móvil al hacer clic
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Contenido interno del Drawer
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      
      {/* 1. CABECERA: Perfil Resumido */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.2rem', fontWeight: 'bold' }}
        >
          {user?.nombre?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" fontWeight="bold" noWrap>
            {user?.nombre}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.rol === 'admin' ? 'Administrador' : 'Inversionista'}
          </Typography>
        </Box>
        {/* Botón cerrar solo en móvil */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, ml: 'auto' }}>
           <IconButton onClick={onClose}><Close /></IconButton>
        </Box>
      </Box>

      <Divider />

      {/* 2. LISTA DE NAVEGACIÓN */}
      <List sx={{ flexGrow: 1, px: 2, pt: 2, overflowY: 'auto' }}>
        {menuItems.map((item, index) => {
          
          // Renderizar Separadores o Encabezados
          if (item.type === 'divider') return <Divider key={index} sx={{ my: 1.5, opacity: 0.6 }} />;
          if (item.type === 'header') return (
            <Typography key={index} variant="caption" sx={{ mt: 2, mb: 1, pl: 2, display: 'block', fontWeight: 700, color: 'text.disabled' }}>
              {item.text}
            </Typography>
          );
          
          const isSelected = location.pathname === item.path;
          
          return (
            <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleNavigate(item.path!)}
                selected={isSelected}
                sx={{ 
                  borderRadius: 2,
                  minHeight: 44,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light', // Color suave de fondo
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.main' },
                    '& .MuiListItemIcon-root': { color: 'inherit' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'inherit' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '0.95rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* 3. FOOTER: Perfil y Logout */}
      <Box p={2}>
        <ListItemButton onClick={() => handleNavigate('/perfil')} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}><AccountCircle /></ListItemIcon>
          <ListItemText primary="Mi Perfil" />
        </ListItemButton>
        
        <ListItemButton 
          onClick={handleLogout} 
          sx={{ borderRadius: 2, color: 'error.main', mt: 1, '&:hover': { bgcolor: 'error.lighter' } }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}><Logout /></ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      
      {/* Versión Móvil (Temporary) */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }} // Mejor rendimiento en móvil
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Versión Escritorio (Permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: DRAWER_WIDTH, 
            borderRight: '1px solid',
            borderColor: 'divider'
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;