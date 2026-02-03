// src/shared/hooks/useNavbarMenu.tsx

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
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Logout as LogoutIcon,
  Message as MessageIcon,
  MoreHoriz as MoreHorizIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  // Productos / Social
  SupervisedUserCircle as SupervisedUserIcon,
  Terrain as TerrainIcon,
  // Estados / Feedback (Para KYC y 2FA)
  VerifiedUser as VerifiedUserIcon,
  // Tipo
  type SvgIconComponent
} from "@mui/icons-material";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/routes";
import { useAuth } from "../../core/context/AuthContext";
import { useConfirmDialog } from "./useConfirmDialog";

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
  /** Submenú recursivo */
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

  // Configuración del diálogo de cierre de sesión
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
            label: "Dashboard",
            path: ROUTES.ADMIN.DASHBOARD,
            icon: DashboardIcon
          },
          {
            label: "Gestión Usuarios",
            icon: PersonIcon,
            submenu: [
              { label: "Lista de Usuarios", path: ROUTES.ADMIN.USUARIOS.LISTA, icon: PersonIcon },
              { label: "Verificaciones KYC", path: ROUTES.ADMIN.USUARIOS.KYC, icon: VerifiedUserIcon, badge: 0 }, // Aquí podrías pasar un prop de conteo
            ]
          },
          {
            label: "Proyectos",
            icon: ConstructionIcon,
            submenu: [
              { label: "Gestión Proyectos", path: ROUTES.ADMIN.PROYECTOS.LISTA, icon: ConstructionIcon },
              { label: "Planes de Ahorro", path: ROUTES.ADMIN.PROYECTOS.PLANES_AHORRO, icon: SupervisedUserIcon },
              { label: "Inversiones", path: ROUTES.ADMIN.PROYECTOS.INVERSIONES, icon: AttachMoneyIcon },
            ]
          },
          {
            label: "Lotes",
            icon: TerrainIcon,
            submenu: [
              { label: "Gestión Lotes", path: ROUTES.ADMIN.LOTES.LISTA, icon: TerrainIcon },
              { label: "Gestión Pagos", path: ROUTES.ADMIN.LOTES.PAGOS, icon: AttachMoneyIcon },
              { label: "Gestión Pujas", path: ROUTES.ADMIN.LOTES.PUJAS, icon: GavelIcon },
            ]
          },
          {
            label: "Finanzas",
            icon: AccountBalanceIcon,
            submenu: [
              { label: "Transacciones", path: ROUTES.ADMIN.FINANZAS.TRANSACCIONES, icon: ReceiptIcon },
              { label: "Reportes", path: ROUTES.ADMIN.FINANZAS.RESUMENES, icon: DescriptionIcon },
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
    // B. CLIENTE (Estructura Optimizada + Perfil con Seguridad)
    // ----------------------------------------------------------------------
    if (user?.rol === "cliente") {
      // Analizar Estados de Seguridad
      const rawKycStatus = (user as any)?.estado_kyc || 'SIN_INICIAR';
      const kycStatus = rawKycStatus.toUpperCase();
      const isKycApproved = kycStatus === "APROBADA";
      const isKycPending = kycStatus === "PENDIENTE";
      const is2faEnabled = user?.is_2fa_enabled;

      return {
        logoPath: "/logo.svg",
        homePath: ROUTES.CLIENT.DASHBOARD,
        actionButtons: [],

        // 1. MENÚ PRINCIPAL (Izquierda)
        navItems: [
          {
            label: "Inicio",
            path: ROUTES.CLIENT.DASHBOARD,
            icon: DashboardIcon,
            description: "Resumen de cuenta"
          },
          {
            label: "Oportunidades", // Mejor que "Invertir" o "Proyectos"
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
            label: "Más",
            icon: MoreHorizIcon,
            submenu: [
              { label: "Lotes Favoritos", path: ROUTES.CLIENT.CUENTA.FAVORITOS, icon: FavoriteIcon },
              { isDivider: true, label: "" },
              //{ label: "Ayuda Ahorristas", path: ROUTES.PUBLIC.COMO_FUNCIONA_AHORRISTA, icon: HelpOutlineIcon },
              //{ label: "Ayuda Inversores", path: ROUTES.PUBLIC.COMO_FUNCIONA_INVERSIONISTA, icon: HelpOutlineIcon },
            ]
          }
        ],

        // 2. MENÚ DE USUARIO (Perfil + Seguridad Mejorada)
        userNavItems: [
          {
            label: user?.nombre || "Mi Cuenta",
            icon: AccountCircleIcon,
            // Badge en el avatar si falta algo crítico
            badge: (!isKycApproved || !is2faEnabled) ? 1 : undefined,
            submenu: [
              // --- Datos ---
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

              // --- Seguridad (Semáforo) ---
              {
                label: isKycApproved ? "Identidad Verificada" : "Verificar Identidad",
                path: ROUTES.CLIENT.CUENTA.KYC,
                // Si está aprobado: Check Verde. Si no: Escudo con alerta o Badge.
                icon: isKycApproved ? VerifiedUserIcon : BadgeIcon,
                description: isKycApproved
                  ? "Cuenta validada correctamente"
                  : (isKycPending ? "Verificación en revisión" : "Requerido para operar"),
                // Si no está aprobado, mostramos badge para llamar la atención
                color: isKycApproved ? "success" : "warning",
                badge: !isKycApproved ? 1 : undefined
              },
              {
                label: is2faEnabled ? "2FA Activo" : "Activar 2FA",
                path: ROUTES.CLIENT.CUENTA.SEGURIDAD,
                // Candado cerrado (seguro) vs Candado abierto (inseguro)
                icon: is2faEnabled ? LockIcon : LockOpenIcon,
                description: is2faEnabled
                  ? "Cuenta protegida"
                  : "Recomendado para seguridad",
                // Opcional: Badge si quieres forzar la seguridad
                // badge: !is2faEnabled ? 1 : undefined
                color: is2faEnabled ? "success" : "warning"
              },

              { isDivider: true, label: "" },

              // --- Salida ---
              {
                label: "Cerrar Sesión",
                icon: LogoutIcon,
                action: handleLogoutClick
              }
            ]
          }
        ],

        // 3. ACCESO RÁPIDO (Mobile Drawer)
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
        { label: "Proyectos", path: ROUTES.PROYECTOS.SELECCION_ROL },
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