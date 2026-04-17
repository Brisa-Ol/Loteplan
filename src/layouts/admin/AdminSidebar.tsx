// src/layouts/admin/AdminSidebar.tsx

import {
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  Logout,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Badge,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/core/context/AuthContext';
import { ConfirmDialog } from '@/shared';
import { useNavbarMenu, type NavItem } from '../useNavbarMenu';

// ════════════════════════════════════════════════════════
// CONSTANTES EXPORTADAS (consumidas también por AdminLayout)
// ════════════════════════════════════════════════════════

export const DRAWER_WIDTH = 250;

export const NAVBAR_HEIGHT = {
  desktop: 64,
  mobile: 56,
} as const;

// ════════════════════════════════════════════════════════
// STYLED COMPONENTS
// ════════════════════════════════════════════════════════

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  height: NAVBAR_HEIGHT.desktop,
  flexShrink: 0,
}));

// ════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════

interface AdminSidebarProps {
  pendingKYC?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingKYC = 0,
  mobileOpen = false,
  onMobileClose,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    config: { navItems, userNavItems },
    logoutDialogProps,
  } = useNavbarMenu();

  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════

  const isActive = (path?: string) =>
    path ? location.pathname === path : false;

  const isChildActive = (submenu?: NavItem[]) =>
    submenu?.some((child) => child.path && location.pathname === child.path);

  const handleToggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const handleNavigate = (path?: string) => {
    if (path) {
      navigate(path);
      if (isMobile && onMobileClose) onMobileClose();
    }
  };

  const handleLogoutClick = () => {
    const logoutItem = userNavItems[0]?.submenu?.find(
      (s) => s.label === 'Cerrar Sesión'
    );
    if (logoutItem?.action) logoutItem.action();
  };

  // ════════════════════════════════════════════════════════
  // FILTRADO DE ITEMS
  // ════════════════════════════════════════════════════════

  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const query = searchQuery.toLowerCase();

    return navItems
      .map((item) => {
        const parentMatch = item.label.toLowerCase().includes(query);
        const filteredSubmenu = item.submenu?.filter(
          (sub) => !sub.isDivider && sub.label.toLowerCase().includes(query)
        );

        if (parentMatch || (filteredSubmenu && filteredSubmenu.length > 0)) {
          return {
            ...item,
            submenu: parentMatch ? item.submenu : filteredSubmenu,
          };
        }
        return null;
      })
      .filter(Boolean) as NavItem[];
  }, [navItems, searchQuery]);

  // ════════════════════════════════════════════════════════
  // RENDER ITEM
  // ════════════════════════════════════════════════════════

  const renderItem = (item: NavItem) => {
    const active = isActive(item.path) || isChildActive(item.submenu);
    const hasSubmenu = (item.submenu?.length || 0) > 0;
    const isOpen = openMenus.includes(item.label) || !!searchQuery;
    const IconComponent = item.icon;
    const itemBadge =
      item.label === 'Gestión KYC' ? pendingKYC : item.badge || 0;

    return (
      <Box key={item.label}>
        <ListItemButton
          onClick={() =>
            hasSubmenu
              ? handleToggleMenu(item.label)
              : handleNavigate(item.path)
          }
          selected={active}
          sx={{
            minHeight: 44,
            px: 2,
            mx: 1.5,
            borderRadius: 2,
            mb: 0.5,
            borderLeft: active
              ? `4px solid ${theme.palette.primary.main}`
              : '4px solid transparent',
            bgcolor: active
              ? alpha(theme.palette.primary.main, 0.08)
              : 'transparent',
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              bgcolor: active
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.text.primary, 0.04),
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 36,
              color: active ? 'primary.main' : 'text.secondary',
            }}
          >
            <Badge badgeContent={itemBadge} color="error">
              {IconComponent && <IconComponent />}
            </Badge>
          </ListItemIcon>

          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: active ? 700 : 500,
              color: active ? 'primary.main' : 'text.primary',
              fontSize: '0.875rem',
              noWrap: true,
            }}
          />

          {hasSubmenu &&
            (isOpen ? (
              <ExpandLess
                sx={{ color: 'text.secondary', fontSize: '1.1rem' }}
              />
            ) : (
              <ExpandMore
                sx={{ color: 'text.disabled', fontSize: '1.1rem' }}
              />
            ))}
        </ListItemButton>

        {/* Submenú */}
        {hasSubmenu && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.submenu?.map((sub, idx) => {
                if (sub.isDivider)
                  return (
                    <Divider
                      key={idx}
                      sx={{ my: 0.75, mx: 2, borderColor: 'divider' }}
                    />
                  );

                const SubIcon = sub.icon;
                const subActive = isActive(sub.path);

                return (
                  <ListItemButton
                    key={sub.label}
                    selected={subActive}
                    onClick={() =>
                      sub.action ? sub.action() : handleNavigate(sub.path)
                    }
                    sx={{
                      pl: 4,
                      pr: 1.5,
                      mx: 1.5,
                      borderRadius: 2,
                      mb: 0.25,
                      minHeight: 38,
                      transition: 'background-color 0.15s ease',
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                      '&.Mui-selected:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      },
                    }}
                  >
                    {SubIcon && (
                      <ListItemIcon
                        sx={{
                          minWidth: 30,
                          color: subActive ? 'primary.main' : 'text.secondary',
                        }}
                      >
                        <SubIcon fontSize="small" />
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={sub.label}
                      primaryTypographyProps={{
                        fontSize: '0.82rem',
                        fontWeight: subActive ? 600 : 400,
                        noWrap: true,
                      }}
                    />
                    {!!sub.badge && (
                      <Badge
                        badgeContent={sub.badge}
                        color="error"
                        sx={{ mr: 0.5 }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  // ════════════════════════════════════════════════════════
  // CONTENIDO DEL DRAWER
  // ════════════════════════════════════════════════════════

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header — solo visible en desktop (en móvil lo reemplaza el AppBar) */}
      {!isMobile && (
        <>
          <DrawerHeader>
            <Box
              component="img"
              src="/navbar/nav.png"
              alt="Logo"
              sx={{ height: 38, maxWidth: 170, objectFit: 'contain' }}
            />
          </DrawerHeader>
          <Divider />
        </>
      )}

      {/* Header móvil — con botón de cierre */}
      {isMobile && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              height: NAVBAR_HEIGHT.mobile,
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/navbar/nav.png"
              alt="Logo"
              sx={{ height: 32, maxWidth: 140, objectFit: 'contain' }}
            />
            <IconButton
              onClick={onMobileClose}
              size="small"
              aria-label="Cerrar menú"
              sx={{ color: 'text.secondary' }}
            >
              <ChevronLeft />
            </IconButton>
          </Box>
          <Divider />
        </>
      )}

      {/* Buscador */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" sx={{ fontSize: '1rem' }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.default, 0.6),
              fontSize: '0.85rem',
            },
          }}
        />
      </Box>

      {/* Lista principal — scrolleable */}
      <List
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 0,
          py: 0.5,
        }}
      >
        {filteredNavItems.map((item) => renderItem(item))}
      </List>

      <Divider />

      {/* Footer usuario */}
      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.default, 0.6),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 34,
              height: 34,
              fontSize: '0.875rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user?.nombre?.charAt(0) || 'A'}
          </Avatar>

          <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.3 }}>
              {user?.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin
            </Typography>
          </Box>

          <Tooltip title="Cerrar sesión" placement="top">
            <IconButton
              onClick={handleLogoutClick}
              size="small"
              color="error"
              sx={{ flexShrink: 0 }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  const drawerStyles = {
    '& .MuiDrawer-paper': {
      boxSizing: 'border-box',
      width: DRAWER_WIDTH,
      bgcolor: 'background.paper',
      borderRight: `1px solid ${theme.palette.divider}`,
    },
  } as const;

  return (
    <>
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="Navegación principal"
      >
        {/* Drawer temporal (móvil) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            ...drawerStyles,
            // El drawer móvil aparece bajo el AppBar fijo
            '& .MuiDrawer-paper': {
              ...drawerStyles['& .MuiDrawer-paper'],
              mt: `${NAVBAR_HEIGHT.mobile}px`,
              height: `calc(100% - ${NAVBAR_HEIGHT.mobile}px)`,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Drawer permanente (desktop) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            ...drawerStyles,
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <ConfirmDialog {...logoutDialogProps} />
    </>
  );
};

export default AdminSidebar;