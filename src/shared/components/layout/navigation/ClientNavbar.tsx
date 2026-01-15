// src/components/layout/navigation/ClientNavbar.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Material UI
import {
  AppBar, Toolbar, Box, Button, IconButton, Drawer, List, ListItem,
  ListItemButton, ListItemText, ListItemIcon, Typography, Avatar,
  Menu, MenuItem, Divider, Badge, useMediaQuery, useTheme, Container, 
  alpha, Collapse, InputAdornment, TextField, Chip, Skeleton, Fade
} from '@mui/material';
import {
  Menu as MenuIcon, Close, Notifications, ExpandMore, CheckCircle,
  Search as SearchIcon, ExpandLess, Warning
} from '@mui/icons-material';

// Hooks & Services
import { NAVBAR_HEIGHT, useNavbarMenu, type NavItem } from '@/shared/hooks/useNavbarMenu';
import { useAuth } from '@/core/context/AuthContext';
import MensajeService from '@/core/api/services/mensaje.service';

// Components
import { ConfirmDialog } from '../../domain/modals/ConfirmDialog/ConfirmDialog';

// =================================================================
// SUB-COMPONENTE: NAV DROPDOWN (Lo mantengo aquí por simplicidad)
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
          transition: 'all 0.2s ease-in-out',
          '&:hover': { 
            color: 'primary.main', 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            transform: 'translateY(-2px)'
          }
        }}
      >
        {item.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        transitionDuration={200}
        PaperProps={{ 
          elevation: 8,
          sx: { 
            mt: 1.5, 
            minWidth: 200, 
            borderRadius: 2.5,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.08),
            boxShadow: `0 8px 24px ${alpha('#000', 0.12)}`
          } 
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
                transition: 'all 0.15s ease-in-out',
                '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
              }}
            >
              {Icon && (
                <ListItemIcon sx={{ color: isSelected ? 'primary.main' : 'inherit' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
              )}
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
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // Estados derivados
  const kycStatus = (user as any)?.estado_kyc || 'SIN_INICIAR';
  const isVerified = kycStatus === "APROBADA" && user?.is_2fa_enabled;

  // React Query: Mensajes no leídos
  const { data: unreadData, isLoading: loadingMessages } = useQuery({
    queryKey: ['mensajesNoLeidos'],
    queryFn: async () => (await MensajeService.getUnreadCount()).data,
    refetchInterval: 60000,
    enabled: !!user && isAuthenticated,
    retry: false
  });

  const unreadCount = unreadData?.cantidad || 0;

  // Efecto de scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setUserMenuAnchor(null);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  const handleToggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const filteredNavItems = searchQuery.trim()
    ? navItems.map(item => {
        const query = searchQuery.toLowerCase();
        const parentMatch = item.label.toLowerCase().includes(query);
        const filteredSubmenu = item.submenu?.filter(sub => 
          !sub.isDivider && sub.label.toLowerCase().includes(query)
        );
        if (parentMatch || (filteredSubmenu && filteredSubmenu.length > 0)) {
          return { ...item, submenu: parentMatch ? item.submenu : filteredSubmenu };
        }
        return null;
      }).filter(Boolean) as NavItem[]
    : navItems;

  const quickAccessItems = isAuthenticated ? [
    { label: 'Inicio', path: '/dashboard', icon: navItems[0]?.icon },
    { label: 'Proyectos', path: '/proyectos/rol-seleccion', icon: navItems[1]?.icon },
    ...(unreadCount > 0 ? [{ label: 'Mensajes', path: '/mensajes', icon: undefined as any, badge: unreadCount }] : [])
  ] : [];

  // --- DRAWER MOBILE (Contenido) ---
  const mobileDrawer = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Header Mobile */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: 32 }} />
        <IconButton onClick={() => setMobileOpen(false)}><Close /></IconButton>
      </Box>

      {/* Perfil Mobile */}
      {isAuthenticated && user && (
        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                user?.is_2fa_enabled ? 
                <CheckCircle sx={{ width: 16, height: 16, color: theme.palette.success.main, bgcolor: 'white', borderRadius: '50%', border: '2px solid white' }} /> : 
                <Warning sx={{ width: 16, height: 16, color: theme.palette.warning.main, bgcolor: 'white', borderRadius: '50%', border: '2px solid white' }} />
              }
            >
              <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, border: '2px solid white', boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}` }}>
                {user.nombre?.charAt(0)}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} noWrap>{user.nombre} {user.apellido}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
            </Box>
          </Box>
          {!isVerified && (
            <Chip icon={<Warning fontSize="small" />} label="Verificar cuenta" size="small" color="warning" onClick={() => { setMobileOpen(false); navigate('/kyc'); }} sx={{ mt: 2, width: '100%', fontWeight: 600 }} />
          )}
        </Box>
      )}

      {/* Buscador Mobile */}
      {isAuthenticated && (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <TextField
            size="small"
            placeholder="Buscar menú..."
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>) }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
          />
        </Box>
      )}

      {/* Accesos Rápidos Mobile */}
      {isAuthenticated && !searchQuery && quickAccessItems.length > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" sx={{ px: 1, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Acceso Rápido</Typography>
          <List dense sx={{ mt: 0.5 }}>
            {quickAccessItems.map((item, idx) => {
              const Icon = item.icon;
              const isQuickActive = isActive(item.path);
              return (
                <ListItemButton key={idx} onClick={() => handleNavigate(item.path!)} selected={isQuickActive} sx={{ borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
                  {Icon && <ListItemIcon sx={{ minWidth: 36 }}><Badge badgeContent={item.badge} color="error"><Icon fontSize="small" /></Badge></ListItemIcon>}
                  <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body2', fontSize: '0.85rem', fontWeight: isQuickActive ? 600 : 400 }} />
                </ListItemButton>
              );
            })}
          </List>
          <Divider sx={{ my: 1 }} />
        </Box>
      )}

      {/* Navegación Principal Mobile */}
      <List sx={{ flex: 1, py: 2, overflowY: 'auto' }}>
        {filteredNavItems.map((item, idx) => {
          const Icon = item.icon;
          const hasSubmenu = (item.submenu?.length || 0) > 0;
          const isOpen = openMenus.includes(item.label);

          if (hasSubmenu && !item.path) {
            return (
              <React.Fragment key={idx}>
                <ListItemButton onClick={() => handleToggleMenu(item.label)} sx={{ px: 2 }}>
                  {Icon && <ListItemIcon sx={{ minWidth: 40 }}><Icon /></ListItemIcon>}
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.submenu?.map((sub, sIdx) => {
                      if (sub.isDivider) return null;
                      const SubIcon = sub.icon;
                      const active = isActive(sub.path);
                      return (
                        <ListItemButton key={sIdx} onClick={() => { setMobileOpen(false); sub.action ? sub.action() : sub.path && handleNavigate(sub.path); }} selected={active} sx={{ pl: 6, borderLeft: active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent', '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
                          {SubIcon && <ListItemIcon sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}><SubIcon fontSize="small" /></ListItemIcon>}
                          <ListItemText primary={sub.label} primaryTypographyProps={{ fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.primary' }} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
                <Divider sx={{ my: 1 }} />
              </React.Fragment>
            );
          }
          const active = isActive(item.path);
          return (
            <ListItem key={idx} disablePadding>
              <ListItemButton onClick={() => handleNavigate(item.path || '')} selected={active} sx={{ px: 2, borderLeft: active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent', '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
                {Icon && <ListItemIcon sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}><Icon /></ListItemIcon>}
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.primary' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer Mobile (Acciones) */}
      {!isAuthenticated && (
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {actionButtons.map((btn, idx) => (
            <Button key={idx} variant={btn.variant || 'outlined'} fullWidth color={btn.variant === 'contained' ? 'primary' : 'inherit'} onClick={() => handleNavigate(btn.path || '')} sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}>
              {btn.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );

  // --- RENDER PRINCIPAL (Desktop) ---
  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={scrolled ? 4 : 0}
        sx={{ 
          bgcolor: 'background.paper', 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          color: 'text.primary',
          transition: 'all 0.3s ease-in-out',
          boxShadow: scrolled ? `0 4px 12px ${alpha('#000', 0.08)}` : 'none'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0 }, minHeight: { xs: NAVBAR_HEIGHT.mobile, md: NAVBAR_HEIGHT.desktop } }}>
            
            {/* Logo */}
            <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', mr: 4 }}>
              <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: { xs: 28, md: 36 } }} />
            </Box>

            {/* Menu Desktop */}
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
                        transition: 'all 0.2s ease-in-out',
                        '&::after': active ? {
                          content: '""', position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
                          width: '70%', height: 4, bgcolor: 'primary.main', borderRadius: '4px 4px 0 0', 
                          boxShadow: `0 -2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                        } : {},
                        '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05), transform: 'translateY(-2px)' }
                      }}
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </Box>
            )}

            {isMobile && <Box sx={{ flex: 1 }} />}

            {/* Iconos y Perfil Desktop */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {isAuthenticated ? (
                  <>
                    {loadingMessages ? (
                      <Skeleton variant="circular" width={40} height={40} />
                    ) : (
                      <IconButton onClick={() => handleNavigate('/mensajes')} sx={{ color: 'text.secondary', transition: 'all 0.2s', '&:hover': { color: 'primary.main', transform: 'scale(1.1)', bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                        <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}>
                          <Notifications />
                        </Badge>
                      </IconButton>
                    )}

                    <Button
                      onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                      sx={{ textTransform: 'none', color: 'text.primary', pl: 1, pr: 1.5, py: 0.75, borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05), borderColor: alpha(theme.palette.primary.main, 0.3), transform: 'translateY(-1px)', boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}` } }}
                      endIcon={<ExpandMore />}
                    >
                      <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={user?.is_2fa_enabled ? <CheckCircle sx={{ width: 16, height: 16, color: theme.palette.success.main, bgcolor: 'white', borderRadius: '50%', border: '2px solid white' }} /> : <Warning sx={{ width: 16, height: 16, color: theme.palette.warning.main, bgcolor: 'white', borderRadius: '50%', border: '2px solid white' }} />}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', mr: 1.5, border: '2px solid white', boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}` }}>
                          {user?.nombre?.charAt(0) || 'U'}
                        </Avatar>
                      </Badge>
                      <Box textAlign="left">
                        <Typography variant="body2" fontWeight={700} lineHeight={1.2}>{user?.nombre?.split(' ')[0]}</Typography>
                        <Typography variant="caption" color="text.secondary" lineHeight={1}>Cuenta</Typography>
                      </Box>
                    </Button>

                    <Menu
                      anchorEl={userMenuAnchor}
                      open={Boolean(userMenuAnchor)}
                      onClose={() => setUserMenuAnchor(null)}
                      TransitionComponent={Fade}
                      transitionDuration={200}
                      PaperProps={{ elevation: 8, sx: { mt: 1.5, minWidth: 240, borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.08), boxShadow: `0 8px 24px ${alpha('#000', 0.12)}` } }}
                    >
                      {userNavItems[0]?.submenu?.map((item, idx) => {
                        if (item.isDivider) return <Divider key={idx} />;
                        const ItemIcon = item.icon;
                        const isLogout = item.label === 'Cerrar Sesión';
                        const isKYC = item.label.includes('Verificar');
                        return (
                          <MenuItem key={idx} onClick={() => { item.action ? item.action() : item.path && handleNavigate(item.path); setUserMenuAnchor(null); }} sx={{ py: 1.5, color: isLogout ? 'error.main' : isKYC ? 'warning.main' : 'text.primary', '&:hover': { bgcolor: isLogout ? alpha(theme.palette.error.main, 0.05) : isKYC ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.action.active, 0.05) } }}>
                            {ItemIcon && <ListItemIcon sx={{ color: isLogout ? 'error.main' : isKYC ? 'warning.main' : 'inherit' }}><ItemIcon fontSize="small" /></ListItemIcon>}
                            <Typography variant="body2" fontWeight={isLogout || isKYC ? 600 : 400}>{item.label}</Typography>
                          </MenuItem>
                        );
                      })}
                    </Menu>
                  </>
                ) : (
                  <>
                    {actionButtons.map((btn, idx) => (
                      <Button key={idx} variant={btn.variant || 'text'} color={btn.variant === 'contained' ? 'primary' : 'inherit'} onClick={() => handleNavigate(btn.path || '')} sx={{ borderRadius: 2, fontWeight: 700, px: 3, mr: idx === 0 ? 1 : 0, '&:hover': { transform: 'translateY(-2px)', boxShadow: btn.variant === 'contained' ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` : 'none' } }}>
                        {btn.label}
                      </Button>
                    ))}
                  </>
                )}
              </Box>
            )}

            {/* Hamburguesa Mobile */}
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isAuthenticated && (
                  <IconButton onClick={() => handleNavigate('/mensajes')} sx={{ '&:hover': { transform: 'scale(1.1)' } }}>
                    <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none' } }}>
                      <Notifications />
                    </Badge>
                  </IconButton>
                )}
                <IconButton onClick={() => setMobileOpen(true)} sx={{ color: 'text.primary', '&:hover': { color: 'primary.main', transform: 'rotate(90deg)' } }}>
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
        PaperProps={{ sx: { width: 280, borderLeft: 'none', boxShadow: theme.shadows[16] } }}
        ModalProps={{ BackdropProps: { sx: { bgcolor: alpha('#000', 0.6), backdropFilter: 'blur(4px)' } } }}
        transitionDuration={300}
      >
        {mobileDrawer}
      </Drawer>

      <ConfirmDialog {...logoutDialogProps} />
    </>
  );
};

export default ClientNavbar;