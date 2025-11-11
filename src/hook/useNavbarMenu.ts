// src/hook/useNavbarMenu.ts
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { NavItem, NavbarConfig } from '../components/layout/Navbar/Navbar.types';

// Iconos
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';

/**
 * Hook que retorna la configuración completa del navbar según el rol del usuario
 */
export const useNavbarMenu = (): NavbarConfig => {
  const { user, logout } = useAuth();

  return useMemo<NavbarConfig>(() => {
    // ══════════════════════════════════════════════════════
    // NAVBAR INVITADO (No autenticado)
    // ══════════════════════════════════════════════════════
    if (!user) {
      return {
        logoPath: '/navbar/nav.png',
        homePath: '/',
        navItems: [
          { label: 'Nosotros', path: '/nosotros' },
          {
            label: 'Cómo Funciona',
            submenu: [
              { label: 'Ahorrista', path: '/ahorrista' },
              { label: 'Inversionista', path: '/inversionista' },
            ],
          },
          { label: 'Proyectos', path: '/proyectos' },
          { label: 'Preguntas', path: '/preguntas' },
        ],
        userNavItems: [],
        actionButtons: [
          { label: 'Iniciar Sesión', variant: 'outlined', path: '/login' },
          { label: 'Registrarse', variant: 'contained', path: '/register' },
        ],
      };
    }

    // ══════════════════════════════════════════════════════
    // NAVBAR ADMINISTRADOR
    // ══════════════════════════════════════════════════════
    if (user.rol === 'admin') {
      return {
        logoPath: '/navbar/admin.png',
        homePath: '/admin/dashboard',
        navItems: [
          {
            label: 'Dashboard',
            path: '/admin/dashboard',
            icon: DashboardIcon,
          },
          {
            label: 'Proyectos',
            path: '/admin/proyectos',
            icon: FolderIcon,
          },
          {
            label: 'Usuarios',
            path: '/admin/users',
            icon: PeopleIcon,
          },
          {
            label: 'Verificaciones KYC',
            path: '/admin/kyc',
            icon: VerifiedUserIcon,
          },
        ],
        userNavItems: [
          {
            label: `${user.nombre} (Admin)`,
            submenu: [
              {
                label: 'Mi Perfil',
                path: '/mi-cuenta/perfil',
                icon: AccountCircleIcon,
              },
              {
                label: 'Configuración',
                path: '/mi-cuenta/configuracion',
                icon: SettingsIcon,
              },
              { isDivider: true },
              {
                label: 'Cerrar Sesión',
                action: logout,
                icon: LogoutIcon,
              },
            ],
          },
        ],
        actionButtons: [],
      };
    }

    // ══════════════════════════════════════════════════════
    // NAVBAR CLIENTE
    // ══════════════════════════════════════════════════════
    return {
      logoPath: '/navbar/nav.png',
      homePath: '/',
      navItems: [
        { label: 'Nosotros', path: '/nosotros', icon: InfoIcon },
        {
          label: 'Cómo Funciona',
          submenu: [
            { label: 'Ahorrista', path: '/ahorrista' },
            { label: 'Inversionista', path: '/inversionista' },
          ],
        },
        { label: 'Proyectos', path: '/proyectos', icon: FolderIcon },
        { label: 'Preguntas', path: '/preguntas', icon: HelpIcon },
      ],
      userNavItems: [
        {
          label: 'Mi Cuenta',
          submenu: [
            {
              label: 'Mi Perfil',
              path: '/mi-cuenta/perfil',
              icon: AccountCircleIcon,
            },
            {
              label: 'Configuración',
              path: '/mi-cuenta/configuracion',
              icon: SettingsIcon,
            },
            { isDivider: true },
            {
              label: 'Mis Pagos',
              path: '/mi-cuenta/pagos',
              icon: PaymentIcon,
            },
            {
              label: 'Mis Suscripciones',
              path: '/mi-cuenta/suscripciones',
              icon: ListAltIcon,
            },
            { isDivider: true },
            {
              label: 'Cerrar Sesión',
              action: logout,
              icon: LogoutIcon,
            },
          ],
        },
      ],
      actionButtons: [],
    };
  }, [user, logout]);
};