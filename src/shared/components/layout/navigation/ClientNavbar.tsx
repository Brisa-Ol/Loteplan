// src/components/layout/navigation/ClientNavbar.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Material UI
import {
  AppBar, Toolbar, Box, Button, IconButton, Drawer, List,
  ListItemButton, ListItemText, ListItemIcon, Typography, Avatar,
  Menu, MenuItem, Divider, Badge, useMediaQuery, useTheme, Container, 
  alpha, Collapse, InputAdornment, TextField, Skeleton, Fade, Stack, Tooltip
} from '@mui/material';

// Iconos
import {
  Menu as MenuIcon, Close, Notifications, ExpandMore, CheckCircle,
  Search as SearchIcon, ExpandLess, Warning, Clear, VerifiedUser,
  FavoriteBorder, Favorite
} from '@mui/icons-material';

// Hooks & Services
import { NAVBAR_HEIGHT, useNavbarMenu, type NavItem } from '@/shared/hooks/useNavbarMenu';
import { useAuth } from '@/core/context/AuthContext';
import MensajeService from '@/core/api/services/mensaje.service';
import { ConfirmDialog } from '../../domain/modals/ConfirmDialog/ConfirmDialog';
import { ROUTES } from '@/routes'; // Asegúrate de tener tus rutas importadas

// =================================================================
// SUB-COMPONENTE: NAV DROPDOWN (Estilo Mega-Menu Simple)
// =================================================================
const NavDropdown: React.FC<{ item: NavItem }> = ({ item }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Detectar si algún hijo está activo
  const isChildActive = item.submenu?.some(sub => sub.path && location.pathname.startsWith(sub.path));

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<ExpandMore sx={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
        sx={{
          color: isChildActive ? 'primary.main' : 'text.secondary',
          fontWeight: isChildActive ? 700 : 500,
          textTransform: 'none',
          fontSize: '0.95rem',
          '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04) }
        }}
      >
        {item.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        PaperProps={{ 
          elevation: 4,
          sx: { 
            mt: 1.5, 
            minWidth: 260, // Un poco más ancho para las descripciones
            borderRadius: 3, 
            border: `1px solid ${theme.palette.divider}`,
            p: 1
          } 
        }}
      >
        {item.submenu?.map((sub, idx) => {
          if (sub.isDivider) return <Divider key={idx} sx={{ my: 1 }} />;
          const Icon = sub.icon;
          
          return (
            <MenuItem
              key={idx}
              onClick={() => {
                if (sub.action) sub.action();
                else if (sub.path) navigate(sub.path);
                handleClose();
              }}
              sx={{
                py: 1.5,
                borderRadius: 2,
                mb: 0.5,
                alignItems: 'flex-start', // Alinear icono arriba si hay descripción
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
              }}
            >
              {Icon && (
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 36, mt: 0.5 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
              )}
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {sub.label}
                </Typography>
                {/* ✅ UX: Descripción para guiar al usuario */}
                {sub.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3, mt: 0.5 }}>
                    {sub.description}
                  </Typography>
                )}
              </Box>
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
  
  const { user, isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const { config: { navItems, userNavItems, actionButtons }, logoutDialogProps } = useNavbarMenu();

  // Estados UI
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // Estados Derivados
  const kycStatus = (user as any)?.estado_kyc || 'SIN_INICIAR';
  const isVerified = kycStatus === "APROBADA" && user?.is_2fa_enabled;

  // --- DATA FETCHING ---
  // 1. Mensajes no leídos
  const { data: unreadData } = useQuery({
    queryKey: ['mensajesNoLeidos'],
    queryFn: async () => (await MensajeService.getUnreadCount()).data,
    refetchInterval: 60000,
    enabled: !!user && isAuthenticated,
    retry: false
  });
  const unreadCount = unreadData?.cantidad || 0;

  // 2. Favoritos (Mock o Hook real)
  // const { data: favoritesCount = 0 } = useFavoritesCount(); // Tu hook aquí
  const favoritesCount = 0; // Placeholder

  // Efecto Scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handlers
  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setUserMenuAnchor(null);
  };

  const isActive = (path?: string) => path ? (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)) : false;

  const handleToggleMenu = (label: string) => {
    setOpenMenus(prev => prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]);
  };

  // Filtrado de menú móvil
  const filteredNavItems = useMemo(() => {
      if (!searchQuery.trim()) return navItems;
      const query = searchQuery.toLowerCase();
      return navItems.map(item => {
        const parentMatch = item.label.toLowerCase().includes(query);
        const filteredSubmenu = item.submenu?.filter(sub => !sub.isDivider && sub.label.toLowerCase().includes(query));
        if (parentMatch || (filteredSubmenu && filteredSubmenu.length > 0)) {
          return { ...item, submenu: parentMatch ? item.submenu : filteredSubmenu };
        }
        return null;
      }).filter(Boolean) as NavItem[];
  }, [navItems, searchQuery]);

  // -------------------------------------------------------------
  // RENDER: DRAWER MÓVIL
  // -------------------------------------------------------------
  const mobileDrawer = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Header Drawer */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: 32, objectFit: 'contain' }} />
        <IconButton onClick={() => setMobileOpen(false)}><Close /></IconButton>
      </Box>

      {/* Perfil (Con Skeleton) */}
      {isAuthenticated && (
        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          {isLoadingAuth ? (
             <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={40} height={40} />
                <Box>
                   <Skeleton variant="text" width={100} />
                   <Skeleton variant="text" width={140} height={12} />
                </Box>
             </Stack>
          ) : (
            <>
              <Stack direction="row" spacing={2} alignItems="center">
                 <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={isVerified ? <CheckCircle color="success" sx={{ bgcolor: 'white', borderRadius: '50%', fontSize: 16 }} /> : <Warning color="warning" sx={{ bgcolor: 'white', borderRadius: '50%', fontSize: 16 }} />}
                 >
                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>{user?.nombre?.charAt(0)}</Avatar>
                 </Badge>
                 <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{user?.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{user?.email}</Typography>
                 </Box>
              </Stack>
              {!isVerified && (
                 <Button 
                    startIcon={<VerifiedUser />} 
                    variant="contained" 
                    color="warning" 
                    size="small" 
                    fullWidth 
                    onClick={() => handleNavigate('/kyc')} 
                    sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                 >
                    Verificar ahora
                 </Button>
              )}
            </>
          )}
        </Box>
      )}

      {/* Buscador Móvil */}
      {isAuthenticated && (
        <Box sx={{ px: 2, pt: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar sección..."
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ 
              startAdornment: (<InputAdornment position="start"><SearchIcon color="action" fontSize="small" /></InputAdornment>),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}><Clear fontSize="small" /></IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: 'background.default' }
            }}
          />
        </Box>
      )}

      {/* Navegación Móvil */}
      <List sx={{ flex: 1, overflowY: 'auto', px: 0 }}>
        {filteredNavItems.map((item, idx) => {
          const Icon = item.icon;
          const hasSubmenu = (item.submenu?.length || 0) > 0;
          const isOpen = openMenus.includes(item.label);
          const active = isActive(item.path);

          if (hasSubmenu && !item.path) {
            return (
              <React.Fragment key={idx}>
                <ListItemButton onClick={() => handleToggleMenu(item.label)} sx={{ px: 3 }}>
                  {Icon && <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}><Icon /></ListItemIcon>}
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                  {isOpen ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                </ListItemButton>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.submenu?.map((sub, sIdx) => {
                       if (sub.isDivider) return null;
                       const subActive = isActive(sub.path);
                       return (
                         <ListItemButton 
                            key={sIdx} 
                            onClick={() => { setMobileOpen(false); sub.action ? sub.action() : sub.path && handleNavigate(sub.path); }} 
                            selected={subActive}
                            sx={{ pl: 7, borderLeft: subActive ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent' }}
                         >
                            <ListItemText 
                                primary={sub.label} 
                                secondary={sub.description} // Mostrar descripción en móvil también
                                secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
                                primaryTypographyProps={{ fontSize: '0.9rem', color: subActive ? 'primary.main' : 'text.primary', fontWeight: subActive ? 600 : 400 }} 
                            />
                         </ListItemButton>
                       )
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          return (
            <ListItemButton key={idx} onClick={() => handleNavigate(item.path || '')} selected={active} sx={{ px: 3, borderLeft: active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent' }}>
               {Icon && <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'text.secondary' }}><Icon /></ListItemIcon>}
               <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500, color: active ? 'primary.main' : 'text.primary' }} />
            </ListItemButton>
          );
        })}
      </List>
      
      {/* Footer Móvil (Login/Register) */}
      {!isAuthenticated && (
         <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Stack spacing={2}>
               {actionButtons.map((btn, idx) => (
                  <Button key={idx} variant={btn.variant || 'outlined'} fullWidth onClick={() => handleNavigate(btn.path || '')}>
                     {btn.label}
                  </Button>
               ))}
            </Stack>
         </Box>
      )}
    </Box>
  );

  // -------------------------------------------------------------
  // RENDER: DESKTOP APPBAR
  // -------------------------------------------------------------
  return (
    <>
      <AppBar 
        position="sticky" 
        color="inherit"
        elevation={scrolled ? 4 : 0}
        sx={{ 
          bgcolor: 'background.paper', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: NAVBAR_HEIGHT.mobile, md: NAVBAR_HEIGHT.desktop } }}>
            
            {/* 1. LOGO */}
            <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', mr: 4, textDecoration: 'none' }}>
              <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: { xs: 28, md: 36 }, objectFit: 'contain' }} />
            </Box>

            {/* 2. MENÚ PRINCIPAL */}
            {!isMobile && (
              <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                {navItems.map((link) => {
                  // Dropdown
                  if (link.submenu && !link.path) return <NavDropdown key={link.label} item={link} />;
                  
                  // Botón Simple
                  const active = isActive(link.path);
                  // UX: Detectar si es CTA ("Invertir")
                  const isCTA = link.label === "Invertir" || link.label === "Proyectos";

                  return (
                    <Button
                      key={link.label}
                      onClick={() => handleNavigate(link.path || '')}
                      sx={{
                        color: active ? 'primary.main' : 'text.secondary',
                        fontWeight: active || isCTA ? 700 : 500,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        px: 2,
                        // Estilo CTA sutil
                        bgcolor: isCTA ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                        
                        // Línea indicadora animada
                        position: 'relative',
                        '&::after': {
                           content: '""', position: 'absolute', bottom: 0, left: '50%', 
                           transform: active ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
                           width: '60%', height: 3, bgcolor: 'primary.main', borderRadius: '4px 4px 0 0', 
                           transition: 'transform 0.2s ease'
                        },
                        '&:hover': { 
                            bgcolor: isCTA ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                            color: 'primary.main' 
                        }
                      }}
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </Stack>
            )}

            {isMobile && <Box sx={{ flex: 1 }} />}

            {/* 3. ICONOS Y PERFIL (Derecha) */}
            <Stack direction="row" spacing={0.5} alignItems="center">
               
               {isAuthenticated && !isMobile && (
                   <>
                       {/* Favoritos (E-commerce Style) */}
                       <Tooltip title="Mis Favoritos">
                           <IconButton onClick={() => handleNavigate(ROUTES.CLIENT.CUENTA.FAVORITOS)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                               <Badge badgeContent={favoritesCount} color="primary">
                                   {favoritesCount > 0 ? <Favorite color="error" /> : <FavoriteBorder />}
                               </Badge>
                           </IconButton>
                       </Tooltip>

                       {/* Notificaciones */}
                       <Tooltip title="Notificaciones">
                           <IconButton onClick={() => handleNavigate('/mensajes')} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                              <Badge badgeContent={unreadCount} color="error">
                                  <Notifications />
                              </Badge>
                           </IconButton>
                       </Tooltip>
                       
                       <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />
                   </>
               )}

               {/* Botón Menú Móvil */}
               {isMobile && (
                  <IconButton onClick={() => setMobileOpen(true)} color="primary">
                     <MenuIcon />
                  </IconButton>
               )}

               {/* Menú Usuario Desktop */}
               {!isMobile && (
                  <>
                     {isAuthenticated ? (
                        <>
                           {isLoadingAuth ? (
                              <Skeleton variant="circular" width={40} height={40} />
                           ) : (
                             <Button
                                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                                sx={{ 
                                   textTransform: 'none', color: 'text.primary', border: `1px solid ${theme.palette.divider}`,
                                   borderRadius: 8, pl: 0.5, pr: 1.5, ml: 1, py: 0.5,
                                   transition: 'all 0.2s',
                                   '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04), borderColor: 'primary.main', boxShadow: theme.shadows[2] }
                                }}
                             >
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1, fontSize: '0.9rem', fontWeight: 700 }}>
                                    {user?.nombre?.charAt(0)}
                                </Avatar>
                                <Box textAlign="left" sx={{ mr: 1 }}>
                                   <Typography variant="body2" fontWeight={700} lineHeight={1}>{user?.nombre?.split(' ')[0]}</Typography>
                                </Box>
                                <ExpandMore fontSize="small" color="action" />
                             </Button>
                           )}

                           <Menu
                              anchorEl={userMenuAnchor}
                              open={Boolean(userMenuAnchor)}
                              onClose={() => setUserMenuAnchor(null)}
                              TransitionComponent={Fade}
                              PaperProps={{ 
                                elevation: 8, 
                                sx: { mt: 1.5, minWidth: 240, borderRadius: 3, border: `1px solid ${theme.palette.divider}` } 
                              }}
                           >
                              {/* Header Menú Usuario */}
                              <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                                 <Typography variant="subtitle2" fontWeight={700}>Mi Cuenta</Typography>
                                 <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
                              </Box>
                              <Divider />
                              
                              {userNavItems[0]?.submenu?.map((item, idx) => {
    if (item.isDivider) return <Divider key={idx} sx={{ my: 1 }} />;
    
    const Icon = item.icon;
    const isLogout = item.label === 'Cerrar Sesión';
    
    // 1. Determinar el color base
    // Si viene un color explícito del hook (success/warning), úsalo.
    // Si es logout, usa error. Si no, text.primary.
    const itemColorProp = item.color || (isLogout ? 'error' : 'inherit');
    
    // 2. Mapear a colores del tema MUI
    const getColorValue = (colorKey: string) => {
        switch(colorKey) {
            case 'success': return theme.palette.success.main;
            case 'warning': return theme.palette.warning.main;
            case 'error': return theme.palette.error.main;
            case 'primary': return theme.palette.primary.main;
            default: return theme.palette.text.primary;
        }
    };

    const finalColor = getColorValue(itemColorProp);

    return (
    <MenuItem 
        key={idx} 
        onClick={() => { 
            if (item.action) item.action(); 
            else if (item.path) handleNavigate(item.path); 
            setUserMenuAnchor(null); 
        }} 
        sx={{ 
            py: 1.5, 
            mx: 1, 
            mb: 0.5, 
            borderRadius: 2, 
            // Fondo suave al hacer hover según el color del ítem
            '&:hover': { 
                bgcolor: alpha(finalColor, 0.08) 
            } 
        }}
    >
        {Icon && (
            <ListItemIcon sx={{ 
                color: finalColor, // APLICAR COLOR AL ÍCONO
                minWidth: 36,
                mt: item.description ? 0.5 : 0 // Ajuste fino si hay descripción
            }}>
                <Icon fontSize="small" />
            </ListItemIcon>
        )}
        <Box>
            <Typography 
                variant="body2" 
                fontWeight={600} 
                sx={{ color: finalColor }} // APLICAR COLOR AL TÍTULO
            >
                {item.label}
            </Typography>
            
            {item.description && (
                <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ display: 'block', lineHeight: 1.2 }}
                >
                    {item.description}
                </Typography>
            )}
        </Box>
        
        {/* Badge opcional si lo necesitas dentro del ítem */}
        {item.badge && (
             <Box sx={{ ml: 'auto', pl: 2 }}>
                <Badge badgeContent={item.badge} color="error" />
             </Box>
        )}
    </MenuItem>
    )
})}
                           </Menu>
                        </>
                     ) : (
                        // Botones Login (Público)
                        <Stack direction="row" spacing={1} ml={2}>
                           {actionButtons.map((btn, idx) => (
                              <Button 
                                key={idx} 
                                variant={btn.variant || 'text'} 
                                color={btn.variant === 'contained' ? 'primary' : 'inherit'}
                                onClick={() => handleNavigate(btn.path || '')}
                                sx={{ fontWeight: 700 }}
                              >
                                 {btn.label}
                              </Button>
                           ))}
                        </Stack>
                     )}
                  </>
               )}
            </Stack>

          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer Móvil (Montado externamente) */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        {mobileDrawer}
      </Drawer>

      <ConfirmDialog {...logoutDialogProps} />
    </>
  );
};

export default ClientNavbar;