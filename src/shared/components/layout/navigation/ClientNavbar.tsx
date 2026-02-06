import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

// --- Material UI ---
import {
  alpha,
  AppBar,
  Avatar,
  Badge,
  Box, Button,
  Collapse,
  Container,
  Divider,
  Drawer,
  Fade,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu, MenuItem,
  Skeleton,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery, useTheme
} from '@mui/material';

// --- Iconos ---
import {
  CheckCircle,
  Clear,
  Close,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  Search as SearchIcon,
  VerifiedUser,
  Warning
} from '@mui/icons-material';

// --- Hooks & Services ---
import { useAuth } from '@/core/context/AuthContext';
import { NAVBAR_HEIGHT, useNavbarMenu, type NavItem } from '@/shared/hooks/useNavbarMenu';
import { ConfirmDialog } from '../../domain/modals/ConfirmDialog/ConfirmDialog';

// =================================================================
// 1. COMPONENTE: DESKTOP NAV LINK (Dropdown o Botón Simple)
// =================================================================
const DesktopNavItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isActive = item.path ? (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) : false;
  const isChildActive = item.submenu?.some(sub => sub.path && location.pathname.startsWith(sub.path));
  const isHighlighted = isActive || isChildActive;

  // Si no tiene submenú, es un botón simple
  if (!item.submenu) {
    const isCTA = item.label === "Invertir" || item.label === "Oportunidades";
    return (
      <Button
        onClick={() => item.path && navigate(item.path)}
        sx={{
          color: isHighlighted ? 'primary.main' : 'text.secondary',
          fontWeight: isHighlighted || isCTA ? 700 : 500,
          textTransform: 'none',
          fontSize: '0.95rem',
          px: 2,
          bgcolor: isCTA ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          position: 'relative',
          '&::after': {
            content: '""', position: 'absolute', bottom: 0, left: '50%',
            transform: isHighlighted ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
            width: '60%', height: 3, bgcolor: 'primary.main', borderRadius: '4px 4px 0 0',
            transition: 'transform 0.2s ease'
          },
          '&:hover': {
            bgcolor: isCTA ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
            color: 'primary.main'
          }
        }}
      >
        {item.label}
      </Button>
    );
  }

  // Si tiene submenú, es un Dropdown
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
        onClose={() => setAnchorEl(null)}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 4,
          sx: { mt: 1.5, minWidth: 260, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 1 }
        }}
      >
        {item.submenu.map((sub, idx) => {
          if (sub.isDivider) return <Divider key={idx} sx={{ my: 1 }} />;
          const Icon = sub.icon;
          return (
            <MenuItem
              key={idx}
              onClick={() => {
                if (sub.action) sub.action();
                else if (sub.path) navigate(sub.path);
                setAnchorEl(null);
              }}
              sx={{ py: 1.5, borderRadius: 2, mb: 0.5, alignItems: 'flex-start', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
            >
              {Icon && <ListItemIcon sx={{ color: 'primary.main', minWidth: 36, mt: 0.5 }}><Icon fontSize="small" /></ListItemIcon>}
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">{sub.label}</Typography>
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
// 2. COMPONENTE: USER ACCOUNT MENU (Avatar y Dropdown)
// =================================================================
const UserAccountMenu: React.FC<{ user: any, isLoading: boolean, userNavItems: NavItem[] }> = ({ user, isLoading, userNavItems }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const navigate = useNavigate();

  if (isLoading) return <Skeleton variant="circular" width={40} height={40} />;

  const getColorValue = (colorKey?: string) => {
    const colors: Record<string, string> = {
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main,
      primary: theme.palette.primary.main,
    };
    return colors[colorKey || 'default'] || theme.palette.text.primary;
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        TransitionComponent={Fade}
        PaperProps={{ elevation: 8, sx: { mt: 1.5, minWidth: 240, borderRadius: 3, border: `1px solid ${theme.palette.divider}` } }}
      >
        <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          <Typography variant="subtitle2" fontWeight={700}>Mi Cuenta</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
        </Box>
        <Divider />
        {userNavItems[0]?.submenu?.map((item, idx) => {
          if (item.isDivider) return <Divider key={idx} sx={{ my: 1 }} />;
          const Icon = item.icon;
          const finalColor = getColorValue(item.color || (item.label === 'Cerrar Sesión' ? 'error' : undefined));

          return (
            <MenuItem
              key={idx}
              onClick={() => {
                setAnchorEl(null);
                item.action ? item.action() : item.path && navigate(item.path);
              }}
              sx={{ py: 1.5, mx: 1, mb: 0.5, borderRadius: 2, '&:hover': { bgcolor: alpha(finalColor, 0.08) } }}
            >
              {Icon && <ListItemIcon sx={{ color: finalColor, minWidth: 36 }}><Icon fontSize="small" /></ListItemIcon>}
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: finalColor }}>{item.label}</Typography>
                {item.description && <Typography variant="caption" color="text.secondary">{item.description}</Typography>}
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

// =================================================================
// 3. COMPONENTE: MOBILE DRAWER CONTENT
// =================================================================
const MobileDrawerContent: React.FC<{
  navItems: NavItem[],
  actionButtons: NavItem[],
  user: any,
  isAuthenticated: boolean,
  isLoading: boolean,
  onClose: () => void
}> = ({ navItems, actionButtons, user, isAuthenticated, isLoading, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const isVerified = user?.estado_kyc === "APROBADA" && user?.is_2fa_enabled;

  const handleToggleMenu = (label: string) => {
    setOpenMenus(prev => prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]);
  };

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

  return (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: 32, objectFit: 'contain' }} />
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>

      {isAuthenticated && (
        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          {isLoading ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={40} height={40} />
              <Box><Skeleton variant="text" width={100} /><Skeleton variant="text" width={140} height={12} /></Box>
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
                <Button startIcon={<VerifiedUser />} variant="contained" color="warning" size="small" fullWidth onClick={() => { navigate('/kyc'); onClose(); }} sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}>
                  Verificar ahora
                </Button>
              )}
            </>
          )}
        </Box>
      )}

      {isAuthenticated && (
        <Box sx={{ px: 2, pt: 2 }}>
          <TextField
            size="small" placeholder="Buscar sección..." fullWidth value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon color="action" fontSize="small" /></InputAdornment>),
              endAdornment: searchQuery && (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery('')}><Clear fontSize="small" /></IconButton></InputAdornment>),
              sx: { borderRadius: 2, bgcolor: 'background.default' }
            }}
          />
        </Box>
      )}

      <List sx={{ flex: 1, overflowY: 'auto', px: 0 }}>
        {filteredNavItems.map((item, idx) => {
          const Icon = item.icon;
          const hasSubmenu = (item.submenu?.length || 0) > 0;
          const isOpen = openMenus.includes(item.label);
          const active = item.path ? location.pathname.startsWith(item.path) : false;

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
                      return (
                        <ListItemButton key={sIdx} onClick={() => { onClose(); sub.action ? sub.action() : sub.path && navigate(sub.path); }} sx={{ pl: 7 }}>
                          <ListItemText primary={sub.label} secondary={sub.description} secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
                        </ListItemButton>
                      )
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          return (
            <ListItemButton key={idx} onClick={() => { onClose(); item.path && navigate(item.path); }} selected={active} sx={{ px: 3, borderLeft: active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent' }}>
              {Icon && <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'text.secondary' }}><Icon /></ListItemIcon>}
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500, color: active ? 'primary.main' : 'text.primary' }} />
            </ListItemButton>
          );
        })}
      </List>

      {!isAuthenticated && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Stack spacing={2}>
            {actionButtons.map((btn, idx) => (
              <Button key={idx} variant={btn.variant || 'outlined'} fullWidth onClick={() => { onClose(); navigate(btn.path || ''); }}>
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
// 4. COMPONENTE PRINCIPAL: CLIENT NAVBAR
// =================================================================
const ClientNavbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const { user, isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const { config: { navItems, userNavItems, actionButtons }, logoutDialogProps } = useNavbarMenu();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

            {/* LOGO */}
            <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', mr: 4, textDecoration: 'none' }}>
              <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: { xs: 28, md: 36 }, objectFit: 'contain' }} />
            </Box>

            {/* DESKTOP NAV ITEMS */}
            {!isMobile && (
              <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                {navItems.map((item) => <DesktopNavItem key={item.label} item={item} />)}
              </Stack>
            )}

            {isMobile && <Box sx={{ flex: 1 }} />}

            {/* RIGHT SIDE ACTIONS */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {isAuthenticated && !isMobile && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />
                  <UserAccountMenu user={user} isLoading={isLoadingAuth} userNavItems={userNavItems} />
                </>
              )}

              {/* ACTIONS PARA NO AUTENTICADOS (DESKTOP) */}
              {!isAuthenticated && !isMobile && (
                <Stack direction="row" spacing={1} ml={2}>
                  {actionButtons.map((btn, idx) => (
                    <Button
                      key={idx}
                      variant={btn.variant || 'text'}
                      color={btn.variant === 'contained' ? 'primary' : 'inherit'}
                      onClick={() => navigate(btn.path || '')}
                      sx={{ fontWeight: 700 }}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </Stack>
              )}

              {/* HAMBURGER MENU (MOBILE) */}
              {isMobile && (
                <IconButton onClick={() => setMobileOpen(true)} color="primary">
                  <MenuIcon />
                </IconButton>
              )}
            </Stack>

          </Toolbar>
        </Container>
      </AppBar>

      {/* MOBILE DRAWER */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <MobileDrawerContent
          navItems={navItems}
          actionButtons={actionButtons}
          user={user}
          isAuthenticated={isAuthenticated}
          isLoading={isLoadingAuth}
          onClose={() => setMobileOpen(false)}
        />
      </Drawer>

      <ConfirmDialog {...logoutDialogProps} />
    </>
  );
};

export default ClientNavbar;