import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Typography, Divider, Avatar, IconButton, Tooltip, Badge
} from '@mui/material';
import {
  ExpandLess, ExpandMore, ChevronLeft, ChevronRight, Logout
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { useNavbarMenu, NAVBAR_HEIGHT } from '../../../hooks/useNavbarMenu';

import { LogoutDialog } from '../../common/LogoutDialog/LogoutDialog';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

interface AdminSidebarProps {
  pendingKYC?: number;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ pendingKYC = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { config: { navItems, userNavItems }, logoutProps } = useNavbarMenu();

  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const isActive = (path?: string) => {
    return path ? location.pathname === path : false;
  };

  const isChildActive = (submenu?: any[]) => {
    return submenu?.some(child => location.pathname === child.path);
  };

  const handleToggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const handleNavigate = (path?: string) => {
    if (path) navigate(path);
  };

  const handleLogoutClick = () => {
    const logoutItem = userNavItems[0]?.submenu?.find(s => s.label === 'Cerrar Sesión');

    if (logoutItem?.action) {
      logoutItem.action();
    }
  };

  const renderNavItems = (items: any[]) => {
    return items.map((item, index) => {
      const active = isActive(item.path) || isChildActive(item.submenu);
      const hasSubmenu = item.submenu && item.submenu.length > 0;
      const isOpen = openMenus.includes(item.label);
      const showBadge = item.label === 'Usuarios' && pendingKYC > 0;
      const IconComponent = item.icon;

      return (
        <Box key={`${item.label}-${index}`}>
          <Tooltip title={collapsed ? item.label : ''} placement="right">
            <ListItemButton
              onClick={() => hasSubmenu && !collapsed ? handleToggleMenu(item.label) : handleNavigate(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                bgcolor: active ? 'rgba(204, 99, 51, 0.08)' : 'transparent',
                '&:hover': { bgcolor: 'secondary.light' }
              }}
            >
              <ListItemIcon sx={{
                minWidth: collapsed ? 0 : 40,
                color: active ? 'primary.main' : 'text.secondary',
                justifyContent: collapsed ? 'center' : 'flex-start'
              }}>
                <Badge badgeContent={showBadge ? pendingKYC : 0} color="error">
                  {IconComponent && <IconComponent />}
                </Badge>
              </ListItemIcon>

              {!collapsed && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: active ? 600 : 400,
                      color: active ? 'primary.main' : 'text.primary'
                    }}
                  />
                  {hasSubmenu && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                </>
              )}
            </ListItemButton>
          </Tooltip>

          {!collapsed && hasSubmenu && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {item.submenu.map((subItem: any, subIndex: number) => {
                  if (subItem.isDivider) return <Divider key={subIndex} sx={{ my: 1 }} />;
                  const SubIcon = subItem.icon;
                  const isSubActive = isActive(subItem.path);

                  return (
                    <ListItemButton
                      key={subItem.label || subIndex}
                      onClick={() => subItem.action ? subItem.action() : handleNavigate(subItem.path)}
                      sx={{
                        pl: 6,
                        py: 0.75,
                        mx: 1,
                        borderRadius: 2,
                        bgcolor: isSubActive ? 'rgba(204, 99, 51, 0.12)' : 'transparent',
                        '&:hover': { bgcolor: 'secondary.light' }
                      }}
                    >
                      {SubIcon && (
                        <ListItemIcon sx={{ minWidth: 30, color: isSubActive ? 'primary.main' : 'text.secondary' }}>
                          <SubIcon fontSize="small" />
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={subItem.label}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: isSubActive ? 600 : 400,
                          color: isSubActive ? 'primary.main' : 'text.secondary'
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Collapse>
          )}
        </Box>
      );
    });
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH,
            boxSizing: 'border-box',
            transition: 'width 0.2s ease-in-out',
            overflowX: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', minHeight: NAVBAR_HEIGHT.desktop }}>
          {!collapsed && (
            <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: 32 }} />
          )}
          <IconButton onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, py: 2, overflowY: 'auto' }}>
          <List disablePadding>
            {renderNavItems(navItems)}
          </List>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          {!collapsed ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'secondary.light' }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                {user?.nombre?.charAt(0) || 'A'}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{user?.nombre}</Typography>
                <Typography variant="caption" color="text.secondary">Admin</Typography>
              </Box>
              {/* ✅ CORREGIDO: Usamos handleLogoutClick en lugar de lógica inline compleja */}
              <IconButton size="small" onClick={handleLogoutClick} color="primary">
                <Logout fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            // ✅ CORREGIDO: Usamos handleLogoutClick aquí también
            <IconButton
              sx={{ width: '100%' }}
              onClick={handleLogoutClick}
            >
              <Logout />
            </IconButton>
          )}
        </Box>
      </Drawer>

      {/* 👇 AQUÍ RENDERIZAMOS EL MODAL PARA EL ADMIN */}
      <LogoutDialog
        open={logoutProps.open}
        onClose={logoutProps.onClose}
        onConfirm={logoutProps.onConfirm}
      />
    </>
  );
};

export default AdminSidebar;