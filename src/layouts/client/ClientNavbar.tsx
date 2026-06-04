// src/layouts/client/ClientNavbar.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

import {
  alpha, AppBar, Avatar, Badge, Box, Button, Collapse, Container,
  Divider, Drawer, Fade, IconButton, InputAdornment, List,
  ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem,
  Skeleton, Stack, TextField, Toolbar, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';

import {
  CheckCircle, Clear, Close, ExpandLess, ExpandMore,
  Menu as MenuIcon, Search as SearchIcon, VerifiedUser, Warning,
} from '@mui/icons-material';

import { useAuth } from '@/core/context/AuthContext';
import type { UserDto } from '@/core/types/auth.dto';
import { ConfirmDialog } from '@/shared';
import { NAVBAR_HEIGHT, useNavbarMenu, type NavItem } from '../useNavbarMenu';

const MOBILE_DRAWER_WIDTH = 300;

// =================================================================
// 1. DESKTOP NAV ITEM
// =================================================================

const DesktopNavItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isActive = item.path
    ? item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)
    : false;

  const isChildActive = item.submenu?.some(
    (sub) => sub.path && location.pathname.startsWith(sub.path)
  );
  const isHighlighted = isActive || isChildActive;

  if (!item.submenu) {
    return (
      <Button
        onClick={() => item.path && navigate(item.path)}
        sx={{
          color: isHighlighted ? 'primary.main' : 'text.secondary',
          fontWeight: 500,
          textTransform: 'none',
          fontSize: '1.03rem',
          px: 2,
          py: 1,
          borderRadius: 1.5,
          minWidth: 'unset',
          bgcolor: 'transparent',
          letterSpacing: 0,
          '&:hover': {
            bgcolor: 'transparent',
            color: 'text.primary',
          },
        }}
      >
        {item.label}
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={
          <ExpandMore
            sx={{
              fontSize: '1.3rem !important',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: '0.2s',
              color: 'text.disabled',
              ml: 0.5,
            }}
          />
        }
        sx={{
          color: isChildActive ? 'primary.main' : 'text.secondary',
          fontWeight: 500,
          textTransform: 'none',
          fontSize: '1.03rem',
          px: 1.75,
          py: 0.75,
          borderRadius: 1.5,
          minWidth: 'unset',
          letterSpacing: 0,
          '&:hover': {
            bgcolor: 'transparent',
            color: 'text.primary',
          },
        }}
      >
        {item.label}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            p: 0.75,
          },
        }}
      >
        {item.submenu.map((sub, idx) => {
          if (sub.isDivider) return <Divider key={idx} sx={{ my: 0.75 }} />;
          const Icon = sub.icon;
          return (
            <MenuItem
              key={idx}
              onClick={() => {
                if (sub.action) sub.action();
                else if (sub.path) navigate(sub.path);
                setAnchorEl(null);
              }}
              sx={{
                py: 1.25,
                borderRadius: 1.5,
                mb: 0.25,
                alignItems: 'flex-start',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
              }}
            >
              {Icon && (
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 34, mt: 0.25 }}>
                  <Icon sx={{ fontSize: '1.1rem' }} />
                </ListItemIcon>
              )}
              <Box>
                <Typography variant="body2" fontWeight={500} color="text.primary" fontSize="0.875rem">
                  {sub.label}
                </Typography>
                {sub.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', lineHeight: 1.3, mt: 0.25 }}
                  >
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
// 2. USER ACCOUNT MENU
// =================================================================

interface UserAccountMenuProps {
  user: UserDto | null;
  isLoading: boolean;
  userNavItems: NavItem[];
}

const UserAccountMenu: React.FC<UserAccountMenuProps> = ({ user, isLoading, userNavItems }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const navigate = useNavigate();

  if (isLoading) return <Skeleton variant="circular" width={36} height={36} />;

  const getColorValue = (colorKey?: string) => {
    const colors: Record<string, string> = {
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main,
      primary: theme.palette.primary.main,
    };
    return colors[colorKey ?? ''] ?? theme.palette.text.primary;
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          textTransform: 'none',
          color: 'text.primary',
          border: `2px solid ${theme.palette.divider}`,
          borderRadius: 6,
          pl: 0.7,
          pr: 1.5,
          py: 0.7,
          transition: 'border-color 0.15s',
          minWidth: 'unset',
          '&:hover': {
            bgcolor: 'transparent',
            borderColor: alpha(theme.palette.primary.main, 0.5),
          },
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: 'primary.main',
            mr: 1.5,
            fontSize: '1.1rem',
            fontWeight: 500,
          }}
        >
          {user?.nombre?.charAt(0)}
        </Avatar>
        <Typography 
    variant="body1" 
    fontWeight={500} // Cambiado a 700 para que coincida con el resto del nav
    sx={{ 
      mr: 1.5, 
      fontSize: '1.1rem' // Aumentado a 1rem para que sea más grande
    }}
  >
    {user?.nombre?.split(' ')[0]}
  </Typography>
        <ExpandMore sx={{ fontSize: '1rem', color: 'text.disabled' }} />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 6,
          sx: {
            mt: 1.1,
            minWidth: 220,
            borderRadius: 1.5,
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 1.25, display: 'flex',
  flexDirection: 'column', gap: 0.5, bgcolor: alpha(theme.palette.primary.main, 0.08),borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={500} fontSize="1rem" color="text.primary">
            Mi Cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap fontSize="0.875rem" sx={{ 
      textOverflow: 'ellipsis', 
      overflow: 'hidden' 
    }}>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        {userNavItems[0]?.submenu?.map((item, idx) => {
          if (item.isDivider) return <Divider key={idx} sx={{ my: 0.75}} />;
          const Icon = item.icon;
          const finalColor = getColorValue(
            item.color || (item.label === 'Cerrar Sesión' ? 'error' : undefined)
          );
          return (
            <MenuItem
              key={idx}
              onClick={() => {
                setAnchorEl(null);
                item.action ? item.action() : item.path && navigate(item.path);
              }}
              sx={{
                py: 1.25,
                mt:1,
                mx: 0.75,
                mb: 0.25,
                borderRadius: 1.5,
                '&:hover': { bgcolor: alpha(finalColor, 0.06) },
              }}
            >
              {Icon && (
                <ListItemIcon sx={{ color: finalColor, minWidth: 32 }}>
                  <Icon sx={{ fontSize: '1.6rem' }} />
                </ListItemIcon>
              )}
             <Box>
  <Typography variant="body2" fontWeight={500} fontSize="1.1rem" sx={{ color: finalColor }}>
    {item.label}
  </Typography>
  {item.description && (
    <Typography 
      variant="caption" 
      color="text.secondary" 
      sx={{ 
        display: 'block', 
        lineHeight: 1.8, // <-- REDUCE ESTO (de 1.3 a 1.0)
        mt: -0.4         // <-- AGREGA ESTO (un valor negativo acerca el texto)
      }}
    >
      {item.description}
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
// 3. MOBILE DRAWER
// =================================================================

interface MobileDrawerContentProps {
  navItems: NavItem[];
  actionButtons: NavItem[];
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onClose: () => void;
  userNavItems: NavItem[];
}

const MobileDrawerContent: React.FC<MobileDrawerContentProps> = ({
  navItems, actionButtons, user, isAuthenticated, isLoading, onClose, userNavItems,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const isVerified = user?.estado_kyc === 'APROBADA' && user?.is_2fa_enabled;

  const handleToggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const profilePath = userNavItems[0]?.submenu?.find((s) => s.label === 'Mi Perfil')?.path;

  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const query = searchQuery.toLowerCase();
    return navItems.map((item) => {
      const parentMatch = item.label.toLowerCase().includes(query);
      const filteredSubmenu = item.submenu?.filter(
        (sub) => !sub.isDivider && sub.label.toLowerCase().includes(query)
      );
      if (parentMatch || (filteredSubmenu && filteredSubmenu.length > 0)) {
        return { ...item, submenu: parentMatch ? item.submenu : filteredSubmenu };
      }
      return null;
    }).filter(Boolean) as NavItem[];
  }, [navItems, searchQuery]);

  return (
    <Box sx={{ width: MOBILE_DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', overflow: 'hidden' }}>
      <Box sx={{ px: 2, height: NAVBAR_HEIGHT.mobile, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: 28, objectFit: 'contain' }} />
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {isAuthenticated && (
        <Box sx={{ px: 2.5, py: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), flexShrink: 0 }}>
          {isLoading ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="80%" height={12} /></Box>
            </Stack>
          ) : (
            <>
              <Stack
                direction="row" spacing={1.5} alignItems="center"
                onClick={() => { if (profilePath) { navigate(profilePath); onClose(); } }}
                sx={{ cursor: profilePath ? 'pointer' : 'default', borderRadius: 2, px: 1, mx: -1, py: 0.5, transition: 'background 0.15s', '&:hover': profilePath ? { bgcolor: alpha(theme.palette.primary.main, 0.06) } : {} }}
              >
                <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={isVerified
                    ? <CheckCircle color="success" sx={{ bgcolor: 'white', borderRadius: '50%', fontSize: 15 }} />
                    : <Warning color="warning" sx={{ bgcolor: 'white', borderRadius: '50%', fontSize: 15 }} />
                  }
                >
                  <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, width: 36, height: 36, fontSize: '0.9rem' }}>
                    {user?.nombre?.charAt(0)}
                  </Avatar>
                </Badge>
                <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap fontSize="0.875rem">{user?.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">{user?.email}</Typography>
                </Box>
              </Stack>
              {!isVerified && (
                <Button startIcon={<VerifiedUser />} variant="contained" color="warning" size="small" fullWidth
                  onClick={() => { navigate('/client/verificacion'); onClose(); }}
                  sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
                >
                  Verificar ahora
                </Button>
              )}
            </>
          )}
        </Box>
      )}

      {isAuthenticated && (
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
          <TextField size="small" placeholder="Buscar sección..." fullWidth value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" sx={{ fontSize: '1rem' }} /></InputAdornment>,
              endAdornment: searchQuery ? (
                <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery('')}><Clear sx={{ fontSize: '1rem' }} /></IconButton></InputAdornment>
              ) : null,
              sx: { borderRadius: 2, bgcolor: 'background.default', fontSize: '0.85rem' },
            }}
          />
        </Box>
      )}

      <List sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 0, py: 0.5 }}>
        {isAuthenticated && (() => {
          const profileItem = userNavItems[0]?.submenu?.find(s => s.label === 'Mi Perfil');
          if (!profileItem) return null;
          const Icon = profileItem.icon;
          const active = profileItem.path ? location.pathname.startsWith(profileItem.path) : false;
          return (
            <ListItemButton onClick={() => { if (profileItem.path) navigate(profileItem.path); onClose(); }} selected={active}
              sx={{ px: 2.5, minHeight: 44, borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent', '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
              {Icon && <ListItemIcon sx={{ minWidth: 34, color: active ? 'primary.main' : 'text.secondary' }}><Icon /></ListItemIcon>}
              <ListItemText primary={profileItem.label} secondary={profileItem.description}
                primaryTypographyProps={{ fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.primary', fontSize: '0.875rem' }}
                secondaryTypographyProps={{ fontSize: '0.72rem' }} />
            </ListItemButton>
          );
        })()}

        {filteredNavItems.map((item, idx) => {
          const Icon = item.icon;
          const hasSubmenu = (item.submenu?.length || 0) > 0;
          const isOpen = openMenus.includes(item.label);
          const active = item.path ? (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) : false;

          if (hasSubmenu && !item.path) {
            return (
              <React.Fragment key={idx}>
                <ListItemButton onClick={() => handleToggleMenu(item.label)} sx={{ px: 2.5, minHeight: 44 }}>
                  {Icon && <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}><Icon /></ListItemIcon>}
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }} />
                  {isOpen ? <ExpandLess color="action" sx={{ fontSize: '1.1rem' }} /> : <ExpandMore color="action" sx={{ fontSize: '1.1rem' }} />}
                </ListItemButton>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.submenu?.map((sub, sIdx) => {
                      if (sub.isDivider) return null;
                      return (
                        <ListItemButton key={sIdx} onClick={() => { onClose(); sub.action ? sub.action() : sub.path && navigate(sub.path); }} sx={{ pl: 6, minHeight: 40 }}>
                          <ListItemText primary={sub.label} secondary={sub.description}
                            secondaryTypographyProps={{ fontSize: '0.72rem', noWrap: true }}
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 400, noWrap: true }} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          return (
            <ListItemButton key={idx}
              onClick={() => { onClose(); if (item.action) item.action(); else if (item.path) navigate(item.path); }}
              selected={active}
              sx={{ px: 2.5, minHeight: 44, borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent', '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}
            >
              {Icon && <ListItemIcon sx={{ minWidth: 34, color: active ? 'primary.main' : 'text.secondary' }}><Icon /></ListItemIcon>}
              <ListItemText primary={item.label}
                primaryTypographyProps={{ fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.primary', fontSize: '0.875rem', noWrap: true }} />
            </ListItemButton>
          );
        })}
      </List>

      {!isAuthenticated && (
        <Box sx={{ p: 2, flexShrink: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Stack spacing={1.5}>
            {actionButtons.map((btn, idx) => (
              <Button key={idx} variant={btn.variant || 'outlined'} fullWidth
                onClick={() => { onClose(); navigate(btn.path || ''); }}>
                {btn.label}
              </Button>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

// =================================================================
// 4. COMPONENTE PRINCIPAL
// =================================================================

const ClientNavbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();

  const { user, isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const { config: { navItems, userNavItems, actionButtons }, logoutDialogProps } = useNavbarMenu();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${scrolled ? theme.palette.divider : theme.palette.divider}`,
          boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
          transition: 'box-shadow 0.25s ease',
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Container maxWidth="xl" disableGutters={isMobile} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 5 } }}>
<Toolbar
  disableGutters
  sx={{
    display: 'flex',
    justifyContent: 'center', 
    minHeight: {
      xs: `${NAVBAR_HEIGHT.mobile}px !important`,
      md: `${NAVBAR_HEIGHT.desktop}px !important`,
    },
  }}
>
  {/* Este Stack contiene todo y lo centra automáticamente */}
  <Stack 
    direction="row" 
    alignItems="center" 
    spacing={{ md: 3, lg: 5 }} 
    sx={{ width: '100%', justifyContent: 'center' }} // width: 100% y justifyContent: center centra todo el grupo
  >
    {/* 1. Logo */}
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: { xs: 26, md: 32 }, objectFit: 'contain' }} />
      </Box>
    </Box>

    {/* 2. Desktop Nav Items */}
    {!isMobile && (
      <Stack direction="row" spacing={{ md: 1, lg: 2 }} sx={{ alignItems: 'center' }}>
        {navItems.filter((item) => !item.action).map((item) => (
          <DesktopNavItem key={item.label} item={item} />
        ))}
      </Stack>
    )}

    {/* 3. Right side */}
    <Stack direction="row" spacing={1} alignItems="center">
      {isAuthenticated && !isMobile && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 22 }} />
          <UserAccountMenu user={user} isLoading={isLoadingAuth} userNavItems={userNavItems} />
        </>
      )}

      {!isAuthenticated && !isMobile && (
        <Stack direction="row" spacing={2}>
          {actionButtons.map((btn, idx) => {
            const isRegister = btn.label.toLowerCase() === 'registrarse';
            return (
              <Button
                key={idx}
                variant={isRegister ? 'contained' : 'text'}
                onClick={() => navigate(btn.path || '')}
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderRadius: '50px',
                  px: 3,
                  py: 0.8,
                  bgcolor: isRegister ? 'primary.main' : 'transparent',
                  color: isRegister ? 'white' : 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: isRegister ? 'primary.dark' : alpha(theme.palette.primary.main, 0.05),
                    color: isRegister ? 'white' : 'primary.main',
                    borderColor: 'primary.main',
                  },
                }}
              >
                {btn.label}
              </Button>
            );
          })}
        </Stack>
      )}

      {isMobile && (
        <IconButton onClick={() => setMobileOpen(true)} color="primary" size="small">
          <MenuIcon />
        </IconButton>
      )}
    </Stack>
  </Stack>
</Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: MOBILE_DRAWER_WIDTH, maxWidth: '85vw' } }}
      >
        <MobileDrawerContent
          navItems={navItems}
          actionButtons={actionButtons}
          user={user}
          isAuthenticated={isAuthenticated}
          isLoading={isLoadingAuth}
          onClose={() => setMobileOpen(false)}
          userNavItems={userNavItems}
        />
      </Drawer>

      <ConfirmDialog {...logoutDialogProps} />
    </>
  );
};

export default ClientNavbar;