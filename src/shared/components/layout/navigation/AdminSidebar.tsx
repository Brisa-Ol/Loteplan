// src/components/layout/AdminSidebar/AdminSidebar.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Typography, Divider, Avatar, IconButton, Tooltip, Badge,
  useTheme, alpha, TextField, InputAdornment, useMediaQuery, styled
} from '@mui/material';
import {
  ExpandLess, ExpandMore, Logout,
  Search as SearchIcon, ChevronLeft
} from '@mui/icons-material';

import { useNavbarMenu, NAVBAR_HEIGHT } from '../../../hooks/useNavbarMenu';
import { useAuth } from '@/core/context/AuthContext';
import { ConfirmDialog } from '../../domain/modals/ConfirmDialog/ConfirmDialog';

// ✅ Ancho fijo constante
const DRAWER_WIDTH = 280;

// Header simple del Drawer
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between', // Espacio entre logo y botón cerrar (solo móvil)
  padding: theme.spacing(0, 2),
  height: NAVBAR_HEIGHT.desktop,
  ...theme.mixins.toolbar,
}));

// --- INTERFACES ---
interface NavSubItem {
  label: string;
  path?: string;
  icon?: React.ElementType;
  action?: () => void;
  isDivider?: boolean;
  badge?: number;
}

interface NavItem {
  label: string;
  path?: string;
  icon?: React.ElementType;
  submenu?: NavSubItem[];
  badge?: number;
}

interface AdminSidebarProps {
  pendingKYC?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingKYC = 0,
  mobileOpen = false,
  onMobileClose
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Detectar móvil
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { config: { navItems, userNavItems }, logoutDialogProps } = useNavbarMenu();

  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Lógica de navegación activa
  const isActive = (path?: string) => path ? location.pathname === path : false;
  const isChildActive = (submenu?: NavSubItem[]) => submenu?.some(child => child.path && location.pathname === child.path);

  // Handlers
  const handleToggleMenu = (label: string) => {
    setOpenMenus(prev => prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]);
  };

  const handleNavigate = (path?: string) => {
    if (path) {
      navigate(path);
      if (isMobile && onMobileClose) onMobileClose();
    }
  };

  const handleLogoutClick = () => {
    const logoutItem = userNavItems[0]?.submenu?.find(s => s.label === 'Cerrar Sesión');
    if (logoutItem?.action) logoutItem.action();
  };

  // Filtrado de items
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const query = searchQuery.toLowerCase();

    return navItems.map(item => {
      const parentMatch = item.label.toLowerCase().includes(query);
      const filteredSubmenu = item.submenu?.filter(sub =>
        !sub.isDivider && sub.label.toLowerCase().includes(query)
      );

      if (parentMatch || (filteredSubmenu && filteredSubmenu.length > 0)) {
        return { ...item, submenu: parentMatch ? item.submenu : filteredSubmenu };
      }
      return null;
    }).filter(Boolean) as NavItem[];
  }, [navItems, searchQuery]);

  // Renderizado de items (Simplificado: Siempre muestra texto)
  const renderItem = (item: NavItem) => {
    const active = isActive(item.path) || isChildActive(item.submenu);
    const hasSubmenu = (item.submenu?.length || 0) > 0;
    const isOpen = openMenus.includes(item.label) || !!searchQuery;
    const IconComponent = item.icon;
    const itemBadge = item.badge || (item.label === 'Gestión de Usuarios' ? pendingKYC : 0);

    return (
      <Box key={item.label}>
        <ListItemButton
          onClick={() => hasSubmenu ? handleToggleMenu(item.label) : handleNavigate(item.path)}
          selected={active}
          sx={{
            minHeight: 48,
            px: 2.5,
            mx: 1.5,
            borderRadius: 2,
            mb: 0.5,
            borderLeft: active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
            bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.04),
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'text.secondary' }}>
            <Badge badgeContent={itemBadge} color="error">
              {IconComponent && <IconComponent />}
            </Badge>
          </ListItemIcon>

          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: active ? 700 : 500,
              color: active ? 'primary.main' : 'text.primary',
              fontSize: '0.9rem'
            }}
          />
          {hasSubmenu && (isOpen ? <ExpandLess sx={{ color: 'text.secondary' }} /> : <ExpandMore sx={{ color: 'text.disabled' }} />)}
        </ListItemButton>

        {/* Submenú */}
        {hasSubmenu && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.submenu?.map((sub, idx) => {
                if (sub.isDivider) return <Divider key={idx} sx={{ my: 1, borderColor: 'divider' }} />;
                const SubIcon = sub.icon;
                const subActive = isActive(sub.path);
                return (
                  <ListItemButton
                    key={sub.label}
                    selected={subActive}
                    onClick={() => sub.action ? sub.action() : handleNavigate(sub.path)}
                    sx={{
                      pl: 4,
                      mx: 1.5,
                      borderRadius: 2,
                      mb: 0.25,
                      '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                    }}
                  >
                    {SubIcon && (
                      <ListItemIcon sx={{ minWidth: 30, color: subActive ? 'primary.main' : 'text.secondary' }}>
                        <SubIcon fontSize="small" />
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={sub.label}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: subActive ? 600 : 400
                      }}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  // Contenido interno del Drawer
  const drawerContent = (
    <>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="img"
            src={"/navbar/nav.png"} // O la ruta "/navbar/nav.png"
            alt="Logo"
            sx={{
              height: 40, // Altura fija para que entre en el header (ajusta según necesites)
              maxWidth: 180, // Ancho máximo para que no rompa el diseño
              objectFit: 'contain', // Asegura que se vea TODO el logo sin recortes
              // Si quieres que ocupe todo el ancho disponible y empuje el texto:
              // flexGrow: 1 
            }}
          />


        </Box>

        {/* Solo mostramos botón de cerrar en móvil */}
        {isMobile && (
          <IconButton onClick={onMobileClose}>
            <ChevronLeft />
          </IconButton>
        )}
      </DrawerHeader>

      <Divider />

      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            sx: { borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }
          }}
        />
      </Box>

      {/* Lista Principal */}
      <List sx={{ flex: 1, overflowY: 'auto', px: 0 }}>
        {filteredNavItems.map(item => renderItem(item))}
      </List>

      <Divider />

      {/* Footer Usuario */}
      <Box sx={{ p: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          p: 2.5,
          borderRadius: 4,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${theme.palette.divider}`
        }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 'bold' }}>
            {user?.nombre?.charAt(0) || 'A'}
          </Avatar>

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap>{user?.nombre}</Typography>
            <Typography variant="caption" color="text.secondary">Admin</Typography>
          </Box>

          <Tooltip title="Cerrar sesión">
            <IconButton onClick={handleLogoutClick} size="small" color="error">
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </>
  );

  return (
    <>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* 1. MÓVIL: Temporary (Overlay) */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={onMobileClose}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          /* 2. DESKTOP: Permanent (Fijo, sin colapsar) */
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH, // Ancho fijo siempre
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <ConfirmDialog {...logoutDialogProps} />
    </>
  );
};

export default AdminSidebar;