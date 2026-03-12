// src/shared/hooks/useNavbarMenu.tsx

import { useAuth } from "@/core/context";
import type { EstadoVerificacion } from "@/core/types/kyc.dto";
import { ROUTES } from "@/routes"; // ✅ Fix: import que faltaba
import { useConfirmDialog } from "@/shared/hooks";
import {
  // Finanzas & Pagos
  AccountBalance as AccountBalanceIcon,
  // Usuario & Seguridad
  AccountCircle as AccountCircleIcon,
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
  Badge as BadgeIcon,
  Construction as ConstructionIcon,
  // Navegación General
  Dashboard as DashboardIcon,
  // Gestión & Documentos
  Description as DescriptionIcon,
  Favorite as FavoriteIcon,
  Folder as FolderIcon,
  Gavel as GavelIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Logout as LogoutIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  // Productos / Social
  SupervisedUserCircle as SupervisedUserIcon,
  Terrain as TerrainIcon,
  // Estados / Feedback
  VerifiedUser as VerifiedUserIcon,
  // Tipo
  type SvgIconComponent
} from "@mui/icons-material";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════

export interface NavItem {
  /** Texto visible */
  label: string;
  /** Ruta de navegación */
  path?: string;
  /** Icono del item */
  icon?: SvgIconComponent | React.ElementType;
  /** Acción personalizada (ej: logout) */
  action?: () => void;
  /** Submenú recursivo — usa NavItem para no duplicar tipos */
  submenu?: NavItem[];
  /** Divisor visual */
  isDivider?: boolean;
  /** Contador de notificaciones */
  badge?: number;
  /** Variante de botón (solo para actionButtons) */
  variant?: "text" | "outlined" | "contained";
  /** Si requiere KYC aprobado para verse/usarse */
  requiresKYC?: boolean;
  /** Descripción para menús detallados */
  description?: string;
  color?: "default" | "primary" | "secondary" | "error" | "warning" | "success" | "info";
}

export interface NavbarConfig {
  logoPath: string;
  homePath: string;
  navItems: NavItem[];
  userNavItems: NavItem[];
  actionButtons: NavItem[];
  quickAccess?: NavItem[];
}

// ════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════

export const NAVBAR_HEIGHT = {
  mobile: 64,
  desktop: 72,
} as const;

// ════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ════════════════════════════════════════════════════════

export const useNavbarMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const confirmLogout = useConfirmDialog();

  const logoutDialogProps = {
    controller: confirmLogout,
    onConfirm: () => {
      confirmLogout.close();
      logout();
      navigate(ROUTES.LOGIN);
    }
  };

  const config: NavbarConfig = useMemo(() => {
    const handleLogoutClick = () => {
      confirmLogout.confirm('logout');
    };

    // ----------------------------------------------------------------------
    // A. ADMINISTRADOR
    // ----------------------------------------------------------------------
    if (user?.rol === "admin") {
      return {
        logoPath: "/logo.svg",
        homePath: ROUTES.ADMIN.DASHBOARD,
        actionButtons: [],
        navItems: [
          {
            label: "Panel",
            path: ROUTES.ADMIN.DASHBOARD,
            icon: DashboardIcon
          },
          {
            label: "Usuarios",
            icon: PersonIcon,
            submenu: [
              { label: "Usuarios", path: ROUTES.ADMIN.USUARIOS.LISTA, icon: PersonIcon },
              { label: "Verificaciones ", path: ROUTES.ADMIN.USUARIOS.KYC, icon: VerifiedUserIcon, badge: 0 },
            ]
          },
          {
            label: "Proyectos",
            icon: ConstructionIcon,
            submenu: [
              { label: "Proyectos", path: ROUTES.ADMIN.PROYECTOS.LISTA, icon: ConstructionIcon },
              { label: "Planes de Ahorro", path: ROUTES.ADMIN.PROYECTOS.PLANES_AHORRO, icon: SupervisedUserIcon },
              { label: "Inversiones", path: ROUTES.ADMIN.PROYECTOS.INVERSIONES, icon: AttachMoneyIcon },
            ]
          },
          {
            label: "Lotes",
            icon: TerrainIcon,
            submenu: [
              { label: "Lotes", path: ROUTES.ADMIN.LOTES.LISTA, icon: TerrainIcon },
              { label: "Pagos Subasta", path: ROUTES.ADMIN.LOTES.PAGOS, icon: AttachMoneyIcon },
              { label: "Sala Subastas", path: ROUTES.ADMIN.LOTES.PUJAS, icon: GavelIcon },
            ]
          },
          {
            label: "Finanzas",
            icon: AccountBalanceIcon,
            submenu: [
              { label: "Transacciones", path: ROUTES.ADMIN.FINANZAS.TRANSACCIONES, icon: ReceiptIcon },
              { label: "Resúmenes de Cuenta", path: ROUTES.ADMIN.FINANZAS.RESUMENES, icon: DescriptionIcon },
            ]
          },
          {
            label: "Contratos",
            icon: DescriptionIcon,
            submenu: [
              { label: "Plantillas", path: ROUTES.ADMIN.CONTRATOS.PLANTILLAS, icon: DescriptionIcon },
              { label: "Firmados", path: ROUTES.ADMIN.CONTRATOS.FIRMADOS, icon: AssignmentIcon },
            ]
          }
        ],
        userNavItems: [
          {
            label: user.nombre || "Admin",
            icon: AccountCircleIcon,
            submenu: [
              { label: "Mi Perfil", path: ROUTES.ADMIN.USUARIOS.PERFIL, icon: AccountCircleIcon },
              { label: "Configuración", path: ROUTES.ADMIN.USUARIOS.CONFIGURACION, icon: SettingsIcon },
              { isDivider: true, label: "" },
              { label: "Cerrar Sesión", icon: LogoutIcon, action: handleLogoutClick }
            ]
          }
        ],
        quickAccess: [
          { label: "Dashboard", path: ROUTES.ADMIN.DASHBOARD, icon: DashboardIcon },
          { label: "Usuarios", path: ROUTES.ADMIN.USUARIOS.LISTA, icon: PersonIcon },
        ]
      };
    }

    // ----------------------------------------------------------------------
    // B. CLIENTE
    // ----------------------------------------------------------------------
    if (user?.rol === "cliente") {
      const kycStatus: EstadoVerificacion = user.estado_kyc ?? 'NO_INICIADO';
      const isKycApproved = kycStatus === "APROBADA";
      const isKycPending = kycStatus === "PENDIENTE";
      const is2faEnabled = user.is_2fa_enabled;

      return {
        logoPath: "/logo.svg",
        homePath: ROUTES.CLIENT.DASHBOARD,
        actionButtons: [],

        navItems: [
          // === ZONA PÚBLICA / INFORMATIVA ===
          {
            label: "Inicio",
            path: ROUTES.PUBLIC.HOME,
            icon: HomeIcon,
            description: "Ir a la portada del sitio web"
          },
          {
            label: "Cómo funciona",
            path: ROUTES.PUBLIC.COMO_FUNCIONA,
            icon: InfoIcon,
            description: "Guía paso a paso"
          },

          // === ZONA PRIVADA / GESTIÓN ===
          {
            label: "Mi Panel",
            path: ROUTES.CLIENT.DASHBOARD,
            icon: DashboardIcon,
            description: "Resumen de cuenta"
          },
          {
            label: "Oportunidades",
            path: ROUTES.PROYECTOS.SELECCION_ROL,
            icon: ConstructionIcon,
            description: "Explorar catálogo de inversiones"
          },
          {
            label: "Mis Activos",
            icon: FolderIcon,
            description: "Gestión de propiedades",
            submenu: [
              { label: "Planes de Ahorro", path: ROUTES.CLIENT.FINANZAS.SUSCRIPCIONES, icon: SupervisedUserIcon, description: "Mis suscripciones activas" },
              { label: "Mis Inversiones", path: ROUTES.CLIENT.FINANZAS.INVERSIONES, icon: TerrainIcon, description: "Lotes y participaciones" },
              { label: "Mis Pujas", path: ROUTES.CLIENT.FINANZAS.PUJAS, icon: GavelIcon, description: "Subastas en curso" },
              { isDivider: true, label: "" },
              { label: "Mis Contratos", path: ROUTES.CLIENT.CUENTA.CONTRATOS, icon: DescriptionIcon, description: "Documentación legal" },
            ]
          },
          {
            label: "Billetera",
            icon: AccountBalanceIcon,
            description: "Pagos y movimientos",
            submenu: [
              { label: "Pagar Cuotas", path: ROUTES.CLIENT.FINANZAS.PAGOS, icon: ReceiptIcon, description: "Pagos pendientes", badge: 1 },
              { label: "Movimientos", path: ROUTES.CLIENT.FINANZAS.TRANSACCIONES, icon: ReceiptIcon, description: "Historial de transacciones" },
              { label: "Estado de Cuenta", path: ROUTES.CLIENT.FINANZAS.RESUMENES, icon: DescriptionIcon, description: "Resúmenes mensuales" },
            ]
          },
          {
            label: "Favoritos",
            path: ROUTES.CLIENT.CUENTA.FAVORITOS,
            icon: FavoriteIcon,
            description: "Lotes guardados"
          },
        ],

        userNavItems: [
          {
            label: user.nombre || "Mi Cuenta",
            icon: AccountCircleIcon,
            badge: (!isKycApproved || !is2faEnabled) ? 1 : undefined,
            submenu: [
              {
                label: "Mi Perfil",
                path: ROUTES.CLIENT.CUENTA.PERFIL,
                icon: AccountCircleIcon,
                description: "Datos personales"
              },
              {
                label: "Mis Mensajes",
                path: ROUTES.CLIENT.CUENTA.MENSAJES,
                icon: MessageIcon,
                description: "Centro de notificaciones"
              },

              { isDivider: true, label: "" },

              {
                label: isKycApproved ? "Identidad Verificada" : "Verificar Identidad",
                path: ROUTES.CLIENT.CUENTA.KYC,
                icon: isKycApproved ? VerifiedUserIcon : BadgeIcon,
                description: isKycApproved
                  ? "Cuenta validada correctamente"
                  : (isKycPending ? "Verificación en revisión" : "Requerido para operar"),
                color: isKycApproved ? "success" : "warning",
                badge: !isKycApproved ? 1 : undefined
              },
              {
                label: is2faEnabled ? "2FA Activo" : "Activar 2FA",
                path: ROUTES.CLIENT.CUENTA.SEGURIDAD,
                icon: is2faEnabled ? LockIcon : LockOpenIcon,
                description: is2faEnabled ? "Cuenta protegida" : "Recomendado para seguridad",
                color: is2faEnabled ? "success" : "warning"
              },

              { isDivider: true, label: "" },

              {
                label: "Cerrar Sesión",
                icon: LogoutIcon,
                action: handleLogoutClick
              }
            ]
          }
        ],

        quickAccess: [
          { label: "Inicio", path: ROUTES.CLIENT.DASHBOARD, icon: DashboardIcon },
          { label: "Oportunidades", path: ROUTES.PROYECTOS.SELECCION_ROL, icon: ConstructionIcon },
          { label: "Pagar", path: ROUTES.CLIENT.FINANZAS.PAGOS, icon: ReceiptIcon },
        ]
      };
    }

    // ----------------------------------------------------------------------
    // C. PÚBLICO (Sin sesión)
    // ----------------------------------------------------------------------
    return {
      logoPath: "/",
      homePath: ROUTES.PUBLIC.HOME,
      navItems: [
        { label: "Inicio", path: ROUTES.PUBLIC.HOME },
        { label: "Cómo Funciona", path: ROUTES.PUBLIC.COMO_FUNCIONA },
        { label: "Oportunidades", path: ROUTES.PROYECTOS.SELECCION_ROL },
        { label: "Nosotros", path: ROUTES.PUBLIC.NOSOTROS },
      ],
      userNavItems: [],
      actionButtons: [
        { label: "Iniciar Sesión", path: ROUTES.LOGIN, variant: "outlined" },
        { label: "Registrarse", path: ROUTES.REGISTER, variant: "contained" },
      ],
      quickAccess: []
    };

  }, [user, navigate, confirmLogout]);

  return { config, logoutDialogProps };
};

// ════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════

export const getActiveNavItem = (pathname: string, navItems: NavItem[]): NavItem | null => {
  for (const item of navItems) {
    if (item.path === pathname) return item;
    if (item.submenu) {
      const subItem = getActiveNavItem(pathname, item.submenu);
      if (subItem) return subItem;
    }
  }
  return null;
};