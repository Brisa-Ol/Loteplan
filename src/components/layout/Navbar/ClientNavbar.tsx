// src/components/layout/ClientNavbar/ClientNavbar.tsx

import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Material UI
import {
  AppBar, Toolbar, Box, Button, IconButton, Drawer, List, ListItem,
  ListItemButton, ListItemText, ListItemIcon, Typography, Avatar,
  Menu, MenuItem, Divider, Badge, useMediaQuery, useTheme, Container, alpha
} from '@mui/material';
import {
  Menu as MenuIcon, Close, Notifications, ExpandMore, CheckCircle
} from '@mui/icons-material';

// Contexts & Hooks
import { useAuth } from '../../../context/AuthContext';
import { useNavbarMenu, NAVBAR_HEIGHT, type NavItem } from '../../../hooks/useNavbarMenu';

// Components & Services
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog'; 
import MensajeService from '../../../services/mensaje.service';
import Footer from '../../layout/Footer/Footer'; // 👈 1. IMPORTAR FOOTER

// =================================================================
// SUB-COMPONENTE: NAV DROPDOWN (Escritorio)
// =================================================================
const NavDropdown: React.FC<{ item: NavItem }> = ({ item }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isChildActive = item.submenu?.some(sub =>
    sub.path && location.pathname.startsWith(sub.path)
  );

  const handleClose = () => setAnchorEl(null);

  const handleItemClick = (path?: string, action?: () => void) => {
    if (action) action();
    else if (path) navigate(path);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<ExpandMore />}
        sx={{
          color: isChildActive ? 'primary.main' : 'text.secondary',
          fontWeight: isChildActive ? 700 : 500,
          textTransform: 'none',
          fontSize: '0.95rem',
          '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }
        }}
      >
        {item.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ 
            elevation: 3, 
            sx: { mt: 1.5, minWidth: 180, borderRadius: 2, overflow: 'hidden' } 
        }}
      >
        {item.submenu?.map((sub, idx) => {
          if (sub.isDivider) return <Divider key={`div-${idx}`} />;
          
          const Icon = sub.icon;
          const isSelected = sub.path ? location.pathname === sub.path : false;

          return (
            <MenuItem
              key={`item-${idx}`}
              onClick={() => handleItemClick(sub.path, sub.action)}
              selected={isSelected}
              sx={{
                py: 1.5,
                color: isSelected ? 'primary.main' : 'text.primary',
                '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
              }}
            >
              {Icon && <ListItemIcon sx={{ color: isSelected ? 'primary.main' : 'inherit' }}><Icon fontSize="small" /></ListItemIcon>}
              <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                {sub.label}
              </Typography>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

// =================================================================
// COMPONENTE PRINCIPAL: CLIENT NAVBAR
// =================================================================
const ClientNavbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, isAuthenticated } = useAuth();
  const { config: { navItems, userNavItems, actionButtons }, logoutDialogProps } = useNavbarMenu();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const { data: unreadData } = useQuery({
    queryKey: ['mensajesNoLeidos'],
    queryFn: async () => (await MensajeService.getUnreadCount()).data,
    refetchInterval: 60000,
    enabled: !!user && isAuthenticated,
    retry: false
  });

  const unreadCount = unreadData?.cantidad || 0;

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setUserMenuAnchor(null);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  // --- DRAWER MOBILE ---
  const mobileDrawer = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: 32 }} />
        <IconButton onClick={() => setMobileOpen(false)}>
          <Close />
        </IconButton>
      </Box>

      {isAuthenticated && user && (
        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>{user.nombre?.charAt(0)}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {user.nombre} {user.apellido}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.email}
              </Typography>
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
                    primaryTypographyProps={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 1, textTransform: 'uppercase' }} 
                  />
                </ListItem>
                {item.submenu.map((sub, sIdx) => {
                  if (sub.isDivider) return null;
                  const SubIcon = sub.icon;
                  const active = isActive(sub.path);
                  
                  return (
                    <ListItemButton
                      key={sIdx}
                      onClick={() => {
                        setMobileOpen(false);
                        sub.action ? sub.action() : sub.path && handleNavigate(sub.path);
                      }}
                      selected={active}
                      sx={{ 
                          pl: 3, 
                          borderLeft: active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                          '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                      }}
                    >
                      {SubIcon && <ListItemIcon sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}><SubIcon /></ListItemIcon>}
                      <ListItemText 
                        primary={sub.label} 
                        primaryTypographyProps={{ fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.primary' }}
                      />
                    </ListItemButton>
                  );
                })}
                <Divider sx={{ my: 1 }} />
              </React.Fragment>
            );
          }

          const active = isActive(item.path);
          return (
            <ListItem key={idx} disablePadding>
              <ListItemButton 
                onClick={() => handleNavigate(item.path || '')} 
                selected={active}
                sx={{ 
                    borderLeft: active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                    '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                }}
              >
                {Icon && (
                  <ListItemIcon sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}>
                    <Icon />
                  </ListItemIcon>
                )}
                <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.primary' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {isAuthenticated && userNavItems[0]?.submenu?.map((sub, idx) => {
          if (sub.isDivider) return <Divider key={`u-${idx}`} />;
          const SubIcon = sub.icon;
          const isLogout = sub.label === 'Cerrar Sesión';
          
          return (
            <ListItemButton
              key={`u-${idx}`}
              onClick={() => {
                setMobileOpen(false);
                sub.action ? sub.action() : sub.path && handleNavigate(sub.path);
              }}
              sx={{ color: isLogout ? 'error.main' : 'inherit' }}
            >
              {SubIcon && (
                <ListItemIcon sx={{ color: isLogout ? 'error.main' : 'inherit', minWidth: 40 }}>
                  <SubIcon />
                </ListItemIcon>
              )}
              <ListItemText 
                primary={sub.label} 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {!isAuthenticated && (
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {actionButtons.map((btn, idx) => (
            <Button
              key={idx}
              variant={btn.variant || 'outlined'}
              fullWidth
              color={btn.variant === 'contained' ? 'primary' : 'inherit'}
              onClick={() => handleNavigate(btn.path || '')}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
            >
              {btn.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    // 2. 🟢 AQUI ESTÁ LA ESTRUCTURA FLEX COLUMN QUE EMPUJA EL FOOTER AL FINAL
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
            bgcolor: 'background.paper', 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            color: 'text.primary'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0 }, minHeight: { xs: NAVBAR_HEIGHT.mobile, md: NAVBAR_HEIGHT.desktop } }}>
            
            <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', mr: 4 }}>
              <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: { xs: 28, md: 36 } }} />
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1, flex: 1, justifyContent: 'center' }}>
                {navItems.map((link) => {
                  if (link.submenu && !link.path) {
                    return <NavDropdown key={link.label} item={link} />;
                  }
                  const active = isActive(link.path);
                  return (
                    <Button
                      key={link.label}
                      onClick={() => handleNavigate(link.path || '')}
                      sx={{
                        color: active ? 'primary.main' : 'text.secondary',
                        fontWeight: active ? 700 : 500,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        position: 'relative',
                        '&::after': active ? {
                          content: '""', position: 'absolute', bottom: 0, left: '50%',
                          transform: 'translateX(-50%)', width: '60%', height: 3,
                          bgcolor: 'primary.main', borderRadius: '3px 3px 0 0'
                        } : {},
                        '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isAuthenticated ? (
                  <>
                    <IconButton onClick={() => handleNavigate('/mensajes')} sx={{ color: 'text.secondary' }}>
                      <Badge badgeContent={unreadCount} color="error">
                        <Notifications />
                      </Badge>
                    </IconButton>

                    <Button
                      onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                      sx={{ 
                          textTransform: 'none', 
                          color: 'text.primary', 
                          pl: 0.5, pr: 1, py: 0.5,
                          borderRadius: 2,
                          '&:hover': { bgcolor: alpha(theme.palette.action.active, 0.05) }
                      }}
                      endIcon={<ExpandMore color="action" />}
                    >
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          user?.is_2fa_enabled ? (
                            <CheckCircle sx={{ width: 14, height: 14, color: theme.palette.success.main, bgcolor: 'white', borderRadius: '50%' }} />
                          ) : null
                        }
                      >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1.5, fontSize: '0.875rem', fontWeight: 700 }}>
                          {user?.nombre?.charAt(0) || 'U'}
                        </Avatar>
                      </Badge>
                      <Box textAlign="left">
                          <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
                            {user?.nombre?.split(' ')[0]}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" lineHeight={1}>
                             Cuenta
                          </Typography>
                      </Box>
                    </Button>

                    <Menu
                      anchorEl={userMenuAnchor}
                      open={Boolean(userMenuAnchor)}
                      onClose={() => setUserMenuAnchor(null)}
                      PaperProps={{ 
                          elevation: 4, 
                          sx: { mt: 1.5, minWidth: 220, borderRadius: 2, overflow: 'hidden' } 
                      }}
                    >
                      {userNavItems[0]?.submenu?.map((item, idx) => {
                        if (item.isDivider) return <Divider key={idx} />;
                        const ItemIcon = item.icon;
                        const isLogout = item.label === 'Cerrar Sesión';
                        return (
                          <MenuItem
                            key={idx}
                            onClick={() => {
                              item.action ? item.action() : item.path && handleNavigate(item.path);
                              setUserMenuAnchor(null);
                            }}
                            sx={{
                                py: 1.5,
                                color: isLogout ? 'error.main' : 'text.primary',
                                '&:hover': { bgcolor: isLogout ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.action.active, 0.05) }
                            }}
                          >
                            {ItemIcon && (
                              <ListItemIcon sx={{ color: isLogout ? 'error.main' : 'inherit' }}>
                                <ItemIcon fontSize="small" />
                              </ListItemIcon>
                            )}
                            <Typography variant="body2" fontWeight={isLogout ? 600 : 400}>
                                {item.label}
                            </Typography>
                          </MenuItem>
                        );
                      })}
                    </Menu>
                  </>
                ) : (
                  <>
                    {actionButtons.map((btn, idx) => (
                      <Button
                        key={idx}
                        variant={btn.variant || 'text'}
                        color={btn.variant === 'contained' ? 'primary' : 'inherit'}
                        onClick={() => handleNavigate(btn.path || '')}
                        sx={{ 
                            borderRadius: 2, 
                            fontWeight: 700, 
                            px: 3,
                            mr: idx === 0 ? 1 : 0 
                        }}
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
                  <IconButton onClick={() => handleNavigate('/client/mensajes')}>
                    <Badge badgeContent={unreadCount} color="error">
                      <Notifications />
                    </Badge>
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
        PaperProps={{ sx: { width: 280, borderLeft: 'none' } }}
      >
        {mobileDrawer}
      </Drawer>

      {/* 3. 🟢 CONTENIDO PRINCIPAL (Empuja el footer) */}
      <Box component="main" sx={{ flexGrow: 1, width: '100%', py: 3 }}>
        <Outlet />
      </Box>

      {/* 4. 🟢 FOOTER AGREGADO AL FINAL */}
      <Footer />

      {/* Modal de Confirmación Genérico (incluye Logout) */}
      <ConfirmDialog {...logoutDialogProps} />
    </Box>
  );
};

export default ClientNavbar;