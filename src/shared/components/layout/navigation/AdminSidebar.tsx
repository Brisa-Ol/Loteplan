// src/components/layout/AdminSidebar/AdminSidebar.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Typography, Divider, Avatar, IconButton, Tooltip, Badge,
  useTheme, alpha, TextField, InputAdornment, Popover, Chip
} from '@mui/material';
import {
  ExpandLess, ExpandMore, ChevronLeft, ChevronRight, Logout,
  Search as SearchIcon
} from '@mui/icons-material';

import { useNavbarMenu, NAVBAR_HEIGHT } from '../../../hooks/useNavbarMenu';
import { useAuth } from '@/core/context/AuthContext';
import { ConfirmDialog } from '../../domain/modals/ConfirmDialog/ConfirmDialog';


const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

// --- INTERFACES DE TIPADO ---
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
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ pendingKYC = 0 }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { config: { navItems, userNavItems }, logoutDialogProps } = useNavbarMenu();

  // ✅ Estado persistente en localStorage
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const saved = localStorage.getItem('admin-sidebar-menus');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Guardar estado en localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-menus', JSON.stringify(openMenus));
  }, [openMenus]);

  const isActive = (path?: string) => {
    return path ? location.pathname === path : false;
  };

  const isChildActive = (submenu?: NavSubItem[]) => {
    return submenu?.some(child => child.path && location.pathname === child.path);
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

  // ✅ Filtrado de búsqueda
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;

    const query = searchQuery.toLowerCase();
    return navItems.map(item => {
      // Buscar en el item padre
      const parentMatch = item.label.toLowerCase().includes(query);
      
      // Buscar en subitems
      const filteredSubmenu = item.submenu?.filter(sub => 
        !sub.isDivider && sub.label.toLowerCase().includes(query)
      );

      // Si hay match en padre o hijos, incluir el item
      if (parentMatch || (filteredSubmenu && filteredSubmenu.length > 0)) {
        return {
          ...item,
          submenu: parentMatch ? item.submenu : filteredSubmenu
        };
      }
      return null;
    }).filter(Boolean) as NavItem[];
  }, [navItems, searchQuery]);

  // ✅ Accesos rápidos (items más importantes)
  const quickAccessItems = useMemo(() => {
    const items: NavSubItem[] = [];
    
    if (pendingKYC > 0) {
      items.push({
        label: 'KYC Pendientes',
        path: '/admin/KYC',
        icon: navItems.find(i => i.label === 'Gestión de Usuarios')?.submenu?.[1]?.icon,
        badge: pendingKYC
      });
    }

    // Agregar dashboard siempre
    const dashboard = navItems.find(i => i.label === 'Dashboard');
    if (dashboard) {
      items.unshift({
        label: dashboard.label,
        path: dashboard.path,
        icon: dashboard.icon
      });
    }

    return items;
  }, [navItems, pendingKYC]);

  // ✅ Manejo de hover para modo collapsed
  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>, label: string, hasSubmenu: boolean) => {
    if (collapsed && hasSubmenu) {
      setHoveredItem(label);
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    setAnchorEl(null);
  };

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item, index) => {
      const active = isActive(item.path) || isChildActive(item.submenu);
     const hasSubmenu = (item.submenu?.length || 0) > 0;
      const isOpen = openMenus.includes(item.label);
      const IconComponent = item.icon;
      const itemBadge = item.badge || (item.label === 'Gestión de Usuarios' ? pendingKYC : 0);

      return (
        <Box key={`${item.label}-${index}`}>
          <Tooltip title={collapsed ? item.label : ''} placement="right">
            <ListItemButton
              onMouseEnter={(e) => handleMouseEnter(e, item.label, hasSubmenu)}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                if (hasSubmenu && !collapsed) {
                  handleToggleMenu(item.label);
                } else if (!hasSubmenu) {
                  handleNavigate(item.path);
                }
              }}
              selected={active}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                transition: 'all 0.2s ease-in-out',
                borderLeft: active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                '&.Mui-selected': { 
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateX(4px)',
                },
                '&:hover': { 
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  transform: 'translateX(2px)',
                }
              }}
            >
              <ListItemIcon sx={{
                minWidth: collapsed ? 0 : 40,
                color: active ? 'primary.main' : 'text.secondary',
                justifyContent: collapsed ? 'center' : 'flex-start'
              }}>
                <Badge 
                  badgeContent={itemBadge > 0 ? itemBadge : 0} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      animation: itemBadge > 5 ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' }
                      }
                    }
                  }}
                >
                  {IconComponent && <IconComponent />}
                </Badge>
              </ListItemIcon>

              {!collapsed && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: active ? 700 : 600,
                      fontSize: '0.9rem',
                      color: active ? 'primary.main' : 'text.primary'
                    }}
                  />
                  {hasSubmenu && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                </>
              )}
            </ListItemButton>
          </Tooltip>

          {/* Submenu normal (no collapsed) */}
          {!collapsed && hasSubmenu && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {item.submenu?.map((subItem: NavSubItem, subIndex: number) => {
                  if (subItem.isDivider) return <Divider key={subIndex} sx={{ my: 1 }} />;
                  const SubIcon = subItem.icon;
                  const isSubActive = isActive(subItem.path);
                  const subBadge = subItem.badge || 0;

                  return (
                    <ListItemButton
                      key={subItem.label || subIndex}
                      onClick={() => subItem.action ? subItem.action() : handleNavigate(subItem.path)}
                      selected={isSubActive}
                      sx={{
                        pl: 6,
                        py: 0.75,
                        mx: 1,
                        borderRadius: 2,
                        transition: 'all 0.15s ease-in-out',
                        '&.Mui-selected': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          transform: 'translateX(4px)',
                        },
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          transform: 'translateX(2px)',
                        }
                      }}
                    >
                      {SubIcon && (
                        <ListItemIcon sx={{ minWidth: 30, color: isSubActive ? 'primary.main' : 'text.secondary' }}>
                          <Badge badgeContent={subBadge} color="error">
                            <SubIcon fontSize="small" />
                          </Badge>
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={subItem.label}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: isSubActive ? 600 : 400,
                          fontSize: '0.85rem',
                          color: isSubActive ? 'primary.main' : 'text.secondary'
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Collapse>
          )}

          {/* Popover para modo collapsed */}
          {collapsed && hasSubmenu && (
            <Popover
              open={hoveredItem === item.label}
              anchorEl={anchorEl}
              onClose={handleMouseLeave}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              sx={{
                pointerEvents: 'none',
                '& .MuiPopover-paper': {
                  pointerEvents: 'auto',
                  ml: 1,
                  boxShadow: theme.shadows[8]
                }
              }}
              disableRestoreFocus
            >
              <Box 
                sx={{ minWidth: 200, p: 1 }}
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <Typography variant="caption" sx={{ px: 2, py: 1, fontWeight: 600, color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <List dense>
                  {item.submenu?.map((subItem: NavSubItem, subIndex: number) => {
                    if (subItem.isDivider) return <Divider key={subIndex} sx={{ my: 0.5 }} />;
                    const SubIcon = subItem.icon;
                    const isSubActive = isActive(subItem.path);

                    return (
                      <ListItemButton
                        key={subItem.label || subIndex}
                        onClick={() => {
                          handleMouseLeave();
                          subItem.action ? subItem.action() : handleNavigate(subItem.path);
                        }}
                        selected={isSubActive}
                        sx={{
                          borderRadius: 1,
                          '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                        }}
                      >
                        {SubIcon && (
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <SubIcon fontSize="small" />
                          </ListItemIcon>
                        )}
                        <ListItemText
                          primary={subItem.label}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontSize: '0.85rem'
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            </Popover>
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
            overflowX: 'hidden',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }
        }}
      >
        {/* Header con logo y toggle */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'space-between', 
          minHeight: NAVBAR_HEIGHT.desktop,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          {!collapsed && (
            <Box component="img" src="/navbar/nav.png" alt="Logo" sx={{ height: 32 }} />
          )}
          <IconButton onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>

        {/* Buscador */}
        {!collapsed && (
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <TextField
              size="small"
              placeholder="Buscar menú..."
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  }
                }
              }}
            />
          </Box>
        )}

        {/* Accesos Rápidos */}
        {!collapsed && !searchQuery && quickAccessItems.length > 0 && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                px: 1, 
                fontWeight: 600, 
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}
            >
              Acceso Rápido
            </Typography>
            <List dense sx={{ mt: 0.5 }}>
              {quickAccessItems.map((item, idx) => {
                const Icon = item.icon;
                const isQuickActive = isActive(item.path);
                
                return (
                  <ListItemButton
                    key={idx}
                    onClick={() => handleNavigate(item.path)}
                    selected={isQuickActive}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&.Mui-selected': { 
                        bgcolor: alpha(theme.palette.primary.main, 0.08) 
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Badge badgeContent={item.badge} color="error">
                        {Icon && <Icon fontSize="small" />}
                      </Badge>
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontSize: '0.85rem',
                        fontWeight: isQuickActive ? 600 : 400
                      }}
                    />
                    {item.badge && item.badge > 0 && (
                      <Chip 
                        label={item.badge} 
                        size="small" 
                        color="error" 
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
            <Divider sx={{ my: 1 }} />
          </Box>
        )}

        {/* Navegación Principal */}
        <Box sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
          {!collapsed && searchQuery && (
            <Typography 
              variant="caption" 
              sx={{ px: 3, pb: 1, color: 'text.secondary', display: 'block' }}
            >
              {filteredNavItems.length} resultado(s)
            </Typography>
          )}
          <List disablePadding>
            {renderNavItems(filteredNavItems as NavItem[])}
          </List>
        </Box>

        <Divider />

        {/* Footer con Usuario */}
        <Box sx={{ p: 2 }}>
          {!collapsed ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              p: 1.5, 
              borderRadius: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.1)
            }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 700 }}>
                {user?.nombre?.charAt(0) || 'A'}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {user?.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrador
                </Typography>
              </Box>
              <Tooltip title="Cerrar Sesión">
                <IconButton 
                  size="small" 
                  onClick={handleLogoutClick} 
                  sx={{ 
                    color: 'error.main',
                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                  }}
                >
                  <Logout fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Tooltip title="Cerrar Sesión">
              <IconButton
                sx={{ 
                  width: '100%', 
                  color: 'error.main',
                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                }}
                onClick={handleLogoutClick}
              >
                <Logout />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Drawer>

      <ConfirmDialog {...logoutDialogProps} />
    </>
  );
};

export default AdminSidebar;