import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink, Outlet } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, Button, IconButton, Drawer, List, ListItem,
  ListItemButton, ListItemText, ListItemIcon, Typography, Avatar,
  Menu, MenuItem, Divider, Badge, useMediaQuery, useTheme, Container
} from '@mui/material';
import {
  Menu as MenuIcon, Close, Notifications, ExpandMore,
  CheckCircle
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../../context/AuthContext';
import MensajeService from '../../../Services/mensaje.service';
import { useNavbarMenu, type NavItem } from '../../../hooks/useNavbarMenu';

// 👇 IMPORTACIÓN DEL DIÁLOGO
import { LogoutDialog } from '../../common/LogoutDialog/LogoutDialog';

// =================================================================
// 1. SUB-COMPONENTE PARA MENÚS DESPLEGABLES (Desktop) - CORREGIDO
// =================================================================
const NavDropdown: React.FC<{ item: NavItem }> = ({ item }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isChildActive = item.submenu?.some(sub => 
    sub.path && location.pathname.startsWith(sub.path)
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (path?: string, action?: () => void) => {
    if (action) action();
    else if (path) navigate(path);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        endIcon={<ExpandMore />}
        sx={{
          color: isChildActive ? 'primary.main' : 'text.secondary',
          fontWeight: isChildActive ? 600 : 400,
          '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
        }}
      >
        {item.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ elevation: 2, sx: { mt: 1, minWidth: 180 } }}
      >
        {/* ✅ CORRECCIÓN: Eliminamos React.Fragment y devolvemos items directos */}
        {item.submenu?.map((sub, idx) => {
             // 1. Si es divisor, retornamos el Divider directamente
             if (sub.isDivider) {
                 return <Divider key={idx} />;
             }

             // 2. Si es item normal, retornamos el MenuItem directamente
             const Icon = sub.icon;
             return (
                <MenuItem 
                   key={idx} 
                   onClick={() => handleItemClick(sub.path, sub.action)}
                   selected={sub.path ? location.pathname === sub.path : false}
                >
                   {Icon && <ListItemIcon><Icon fontSize="small" /></ListItemIcon>}
                   {sub.label}
                </MenuItem>
             );
        })}
      </Menu>
    </>
  );
};

// =================================================================
// 2. COMPONENTE PRINCIPAL NAVBAR
// =================================================================

const ClientNavbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth(); 
  
  // 👇 DESESTRUCTURAMOS logoutProps DEL HOOK
  const { config: { navItems, userNavItems, actionButtons }, logoutProps } = useNavbarMenu();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages'],
    queryFn: async () => {
      try {
        const res = await MensajeService.getUnreadCount(); 
        return (res.data as any).cantidad || (res.data as any).count || 0; 
      } catch (e) { return 0; }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setUserMenuAnchor(null);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // --- DRAWER MOBILE ---
  const mobileDrawer = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: 32 }} />
        <IconButton onClick={() => setMobileOpen(false)}><Close /></IconButton>
      </Box>

      {isAuthenticated && user && (
        <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{user.nombre?.charAt(0)}</Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>{user.nombre} {user.apellido}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </Box>
          </Box>
        </Box>
      )}

      <List sx={{ flex: 1, py: 2 }}>
        {navItems.map((item, idx) => {
            const Icon = item.icon;
            
            if (item.submenu && !item.path) {
                return (
                    <React.Fragment key={idx}>
                          <ListItem>
                             <ListItemText 
                                primary={item.label} 
                                primaryTypographyProps={{ fontWeight: 'bold', color: 'text.primary' }} 
                             />
                          </ListItem>
                          {item.submenu.map((sub, sIdx) => {
                             if(sub.isDivider) return null;
                             const SubIcon = sub.icon;
                             return (
                                <ListItemButton 
                                    key={sIdx} 
                                    // Soporte para acción (logout) o navegación
                                    onClick={() => sub.action ? sub.action() : handleNavigate(sub.path || '')} 
                                    sx={{ pl: 4 }}
                                    selected={isActive(sub.path)}
                                >
                                    {SubIcon && <ListItemIcon><SubIcon /></ListItemIcon>}
                                    <ListItemText primary={sub.label} />
                                </ListItemButton>
                             )
                          })}
                          <Divider sx={{ my: 1 }} />
                    </React.Fragment>
                )
            }
            
            return (
                <ListItem key={idx} disablePadding>
                    <ListItemButton onClick={() => handleNavigate(item.path || '')} selected={isActive(item.path)}>
                    {Icon && <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}><Icon /></ListItemIcon>}
                    <ListItemText primary={item.label} />
                    </ListItemButton>
                </ListItem>
            )
        })}
        {/* Renderizar items de usuario (como cerrar sesión) en mobile */}
        {isAuthenticated && userNavItems[0]?.submenu?.map((sub, idx) => {
             if(sub.isDivider) return <Divider key={`u-${idx}`} />;
             const SubIcon = sub.icon;
             return (
                <ListItemButton 
                    key={`u-${idx}`}
                    onClick={() => {
                        setMobileOpen(false);
                        if(sub.action) sub.action();
                        else if(sub.path) handleNavigate(sub.path);
                    }}
                >
                    {SubIcon && <ListItemIcon sx={{ color: sub.label === 'Cerrar Sesión' ? 'error.main' : 'inherit' }}><SubIcon /></ListItemIcon>}
                    <ListItemText primary={sub.label} sx={{ color: sub.label === 'Cerrar Sesión' ? 'error.main' : 'inherit' }} />
                </ListItemButton>
             )
        })}
      </List>

      {!isAuthenticated && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {actionButtons.map((btn, idx) => (
                <Button 
                    key={idx} 
                    variant={btn.variant || 'outlined'} 
                    fullWidth 
                    onClick={() => handleNavigate(btn.path || '')}
                >
                    {btn.label}
                </Button>
            ))}
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0 }, minHeight: { xs: 64, md: 72 } }}>
            <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', mr: 4 }}>
              <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: { xs: 28, md: 36 } }} />
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                {navItems.map((link) => {
                    if (link.submenu && !link.path) {
                        return <NavDropdown key={link.label} item={link} />;
                    }
                    return (
                        <Button
                            key={link.label}
                            onClick={() => handleNavigate(link.path || '')}
                            sx={{
                                color: isActive(link.path) ? 'primary.main' : 'text.secondary',
                                fontWeight: isActive(link.path) ? 600 : 400,
                                position: 'relative',
                                '&::after': isActive(link.path) ? {
                                    content: '""', position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                                    width: '60%', height: 3, bgcolor: 'primary.main', borderRadius: '3px 3px 0 0'
                                } : {},
                                '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
                            }}
                        >
                            {link.label}
                        </Button>
                    );
                })}
              </Box>
            )}

            {isMobile && <Box sx={{ flex: 1 }} />}

            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isAuthenticated ? (
                  <>
                    <IconButton onClick={() => handleNavigate('/cliente/mensajes')} sx={{ color: 'text.secondary' }}>
                      <Badge badgeContent={unreadCount} color="error">
                        <Notifications />
                      </Badge>
                    </IconButton>

                    <Button
                      onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                      sx={{ textTransform: 'none', color: 'text.primary', ml: 1 }}
                      endIcon={<ExpandMore />}
                    >
                      <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            user?.is_2fa_enabled ? (
                              <CheckCircle sx={{ 
                                width: 16, height: 16, color: '#4CAF50',
                                bgcolor: 'white', borderRadius: '50%', border: '2px solid white'
                              }} />
                            ) : null
                          }
                        >
                          <Avatar sx={{ 
                            width: 32, height: 32, bgcolor: 'primary.main', mr: 1,
                            fontSize: '0.875rem', border: user?.is_2fa_enabled ? '2px solid #4CAF50' : 'none'
                          }}>
                            {user?.nombre?.charAt(0) || 'U'}
                          </Avatar>
                        </Badge>
                      <Typography variant="body2" fontWeight={500}>{user?.nombre?.split(' ')[0]}</Typography>
                    </Button>

                    <Menu
                      anchorEl={userMenuAnchor}
                      open={Boolean(userMenuAnchor)}
                      onClose={() => setUserMenuAnchor(null)}
                      PaperProps={{ elevation: 2, sx: { mt: 1, minWidth: 200 } }}
                    >
                        {userNavItems[0]?.submenu?.map((item, idx) => {
                            if (item.isDivider) return <Divider key={idx} />;
                            const ItemIcon = item.icon;
                            return (
                                <MenuItem 
                                    key={idx} 
                                    onClick={() => {
                                        if (item.action) item.action(); // Aquí se dispara el setOpenLogoutDialog(true)
                                        else if (item.path) handleNavigate(item.path);
                                        setUserMenuAnchor(null);
                                    }}
                                    sx={item.label === 'Cerrar Sesión' ? { color: 'error.main' } : {}}
                                >
                                    {ItemIcon && <ListItemIcon><ItemIcon fontSize="small" color={item.label === 'Cerrar Sesión' ? 'error' : 'inherit'} /></ListItemIcon>}
                                    {item.label}
                                </MenuItem>
                            )
                        })}
                    </Menu>
                  </>
                ) : (
                  <>
                    {actionButtons.map((btn, idx) => (
                        <Button 
                            key={idx} 
                            variant={btn.variant || 'text'} 
                            onClick={() => handleNavigate(btn.path || '')}
                            sx={idx === 0 ? { mr: 1 } : {}}
                        >
                            {btn.label}
                        </Button>
                    ))}
                  </>
                )}
              </Box>
            )}

            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 {isAuthenticated && (
                      <IconButton onClick={() => handleNavigate('/cliente/mensajes')}>
                          <Badge badgeContent={unreadCount} color="error"><Notifications /></Badge>
                      </IconButton>
                 )}
                <IconButton onClick={() => setMobileOpen(true)} sx={{ color: 'text.primary' }}>
                  <MenuIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        {mobileDrawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minHeight: 'calc(100vh - 72px)' }}>
        <Outlet />
      </Box>

      {/* 👇 AQUÍ RENDERIZAMOS EL MODAL GLOBALMENTE PARA EL CLIENTE */}
      <LogoutDialog 
        open={logoutProps.open}
        onClose={logoutProps.onClose}
        onConfirm={logoutProps.onConfirm}
      />
    </>
  );
};

export default ClientNavbar;