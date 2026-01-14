import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useConfirmDialog } from "./useConfirmDialog";

import {
  // Navegación Principal
  Dashboard as DashboardIcon,
  Construction as ConstructionIcon,
  HelpOutline as HelpOutlineIcon,
  
  // Finanzas
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  
  // Productos
  SupervisedUserCircle as SupervisedUserIcon,
  Gavel as GavelIcon,
  Favorite as FavoriteIcon,
  
  // Usuario y Configuración
  AccountCircle as AccountCircleIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  Logout as LogoutIcon,
  
  // Administración
  Person as PersonIcon,
  Terrain as TerrainIcon,
  Assignment as AssignmentIcon,
  
  // Utilidades
  Folder as FolderIcon,
  MoreHoriz as MoreHorizIcon,
  
  type SvgIconComponent
} from "@mui/icons-material";
import { useAuth } from "../../core/context/AuthContext";
import { ROUTES } from "@/routes";


// ════════════════════════════════════════════════════════
// INTERFACES MEJORADAS CON DOCUMENTACIÓN
// ════════════════════════════════════════════════════════

/** Elemento de navegación individual */
export interface NavItem {
  /** Texto visible del item */
  label: string;
  /** Ruta de navegación (opcional si tiene submenu o action) */
  path?: string;
  /** Icono del item */
  icon?: SvgIconComponent;
  /** Acción personalizada al hacer clic (alternativa a path) */
  action?: () => void;
  /** Items anidados (para dropdown/accordion) */
  submenu?: NavItem[];
  /** Indica si es un divisor visual (Divider) */
  isDivider?: boolean;
  /** Contador de notificaciones/alertas */
  badge?: number;
  /** Estilo del botón (solo para actionButtons) */
  variant?: "text" | "outlined" | "contained";
  /** Indica si requiere verificación KYC */
  requiresKYC?: boolean;
  /** Descripción para tooltips/accesibilidad */
  description?: string;
}

/** Configuración completa del navbar */
export interface NavbarConfig {
  /** Ruta del logo */
  logoPath: string;
  /** Ruta de inicio/home */
  homePath: string;
  /** Items de navegación principal */
  navItems: NavItem[];
  /** Items del menú de usuario (avatar dropdown) */
  userNavItems: NavItem[];
  /** Botones de acción (Login/Register para público) */
  actionButtons: NavItem[];
  /** Items de acceso rápido (para mobile drawer) */
  quickAccess?: NavItem[];
}

// ════════════════════════════════════════════════════════
// CONSTANTES DE ALTURA
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
      navigate(ROUTES.LOGIN); // ✅ Constante
    }
  };

  const config: NavbarConfig = useMemo(() => {
    const handleLogoutClick = () => {
      confirmLogout.confirm('logout');
    };

    // ════════════════════════════════════════════════════════
    // A. ADMINISTRADOR
    // ════════════════════════════════════════════════════════
    if (user?.rol === "admin") {
      const adminNavItems: NavItem[] = [
        { 
          label: "Dashboard", 
          path: ROUTES.ADMIN.DASHBOARD, // ✅ Constante
          icon: DashboardIcon,
          description: "Panel de control principal"
        },
        { 
          label: "Gestión de Usuarios",
          icon: PersonIcon,
          description: "Administrar usuarios y verificaciones",
          submenu: [
            { 
              label: "Gestión Usuarios", 
              path: ROUTES.ADMIN.USUARIOS.LISTA, // ✅ Constante
              icon: PersonIcon, 
              description: "Listado y administración de usuarios"
            },
            { 
              label: "Verificación de Usuarios", 
              path: ROUTES.ADMIN.USUARIOS.KYC, // ✅ Constante
              icon: VerifiedUserIcon, 
              description: "Revisar solicitudes KYC"
            },
          ],
        },
        { 
          label: "Proyectos",
          icon: ConstructionIcon,
          description: "Gestión de proyectos inmobiliarios",
          submenu: [
            { 
              label: "Gestión Proyectos", 
              path: ROUTES.ADMIN.PROYECTOS.LISTA, // ✅ Constante
              icon: ConstructionIcon, 
              description: "Administrar proyectos"
            },
            { 
              label: "Planes de Ahorro", 
              path: ROUTES.ADMIN.PROYECTOS.PLANES_AHORRO, // ✅ Constante
              icon: SupervisedUserIcon, 
              description: "Gestionar planes de ahorro"
            },
            { 
              label: "Inversiones", 
              path: ROUTES.ADMIN.PROYECTOS.INVERSIONES, // ✅ Constante
              icon: AttachMoneyIcon, 
              description: "Gestionar inversiones"
            },
          ],
        },
        {
          label: "Lotes",
          icon: TerrainIcon,
          description: "Administración de lotes y pujas",
          submenu: [
            { 
              label: "Gestión de Lotes", 
              path: ROUTES.ADMIN.LOTES.LISTA, // ✅ Constante
              icon: TerrainIcon, 
              description: "Administrar lotes disponibles"
            },
            { 
              label: "Gestión de Pagos", 
              path: ROUTES.ADMIN.LOTES.PAGOS, // ✅ Constante
              icon: AttachMoneyIcon, 
              description: "Pagos de lotes"
            },
            { isDivider: true, label: "" },
            { 
              label: "Gestión de Pujas", 
              path: ROUTES.ADMIN.LOTES.PUJAS, // ✅ Constante
              icon: GavelIcon, 
              description: "Administrar pujas activas"
            },
          ],
        },
        {
          label: "Contratos",
          icon: DescriptionIcon,
          description: "Gestión de contratos",
          submenu: [
            { 
              label: "Plantillas de Contratos", 
              path: ROUTES.ADMIN.CONTRATOS.PLANTILLAS, // ✅ Constante
              icon: DescriptionIcon, 
              description: "Administrar plantillas"
            },
            { 
              label: "Contratos Firmados", 
              path: ROUTES.ADMIN.CONTRATOS.FIRMADOS, // ✅ Constante
              icon: AssignmentIcon, 
              description: "Ver contratos firmados"
            },
          ],
        },
        {
          label: "Finanzas",
          icon: AccountBalanceIcon,
          description: "Gestión financiera",
          submenu: [
            { 
              label: "Gestión de Pagos", 
              path: ROUTES.ADMIN.FINANZAS.PAGOS, // ✅ Constante
              icon: AttachMoneyIcon, 
              description: "Administrar pagos"
            },
            { 
              label: "Transacciones", 
              path: ROUTES.ADMIN.FINANZAS.TRANSACCIONES, // ✅ Constante
              icon: ReceiptIcon, 
              description: "Historial de transacciones"
            },
            { 
              label: "Estados de Cuenta", 
              path: ROUTES.ADMIN.FINANZAS.RESUMENES, // ✅ Constante
              icon: DescriptionIcon, 
              description: "Generar reportes"
            },
          ],
        },
        { isDivider: true, label: "" },
        {
          label: "Vista Cliente",
          icon: AccountCircleIcon,
          description: "Previsualizar como cliente",
          submenu: [
            { 
              label: "Como Ahorrista", 
              path: ROUTES.PROYECTOS.AHORRISTA, // ✅ Constante
              icon: SupervisedUserIcon 
            },
            { 
              label: "Como Inversionista", 
              path: ROUTES.PROYECTOS.INVERSIONISTA, // ✅ Constante
              icon: AttachMoneyIcon 
            },
          ],
        },
      ];

      const adminUserNavItems: NavItem[] = [
        {
          label: user?.nombre || "Admin",
          icon: AccountCircleIcon,
          submenu: [
            { 
              label: "Mi Perfil", 
              path: ROUTES.ADMIN.USUARIOS.PERFIL, // ✅ Constante
              icon: AccountCircleIcon, 
              description: "Ver y editar perfil"
            },
            { 
              label: "Configuración", 
              path: ROUTES.ADMIN.USUARIOS.CONFIGURACION, // ✅ Constante
              icon: SettingsIcon, 
              description: "Ajustes del sistema"
            },
            { isDivider: true, label: "" },
            { 
              label: "Cerrar Sesión", 
              icon: LogoutIcon, 
              action: handleLogoutClick 
            },
          ],
        },
      ];

      return {
        logoPath: "/logo.svg",
        homePath: ROUTES.ADMIN.DASHBOARD, // ✅ Constante
        navItems: adminNavItems,
        userNavItems: adminUserNavItems,
        actionButtons: [],
        quickAccess: [
          { label: "Dashboard", path: ROUTES.ADMIN.DASHBOARD, icon: DashboardIcon },
          { label: "Usuarios", path: ROUTES.ADMIN.USUARIOS.LISTA, icon: PersonIcon },
          { label: "Proyectos", path: ROUTES.ADMIN.PROYECTOS.LISTA, icon: ConstructionIcon },
        ]
      };
    }

    // ════════════════════════════════════════════════════════
    // B. CLIENTE - ESTRUCTURA OPTIMIZADA
    // ════════════════════════════════════════════════════════
    if (user?.rol === "cliente") {
      const kycStatus = (user as any)?.estado_kyc || 'SIN_INICIAR';
      const isVerified = kycStatus === "APROBADA" && user?.is_2fa_enabled;

      const clientNavItems: NavItem[] = [
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🏠 INICIO - Acceso principal
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        { 
          label: "Inicio", 
          path: ROUTES.CLIENT.DASHBOARD, // ✅ Constante
          icon: DashboardIcon,
          description: "Dashboard principal"
        },
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🏗️ PROYECTOS - Explorar oportunidades
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        { 
          label: "Proyectos", 
          path: ROUTES.PROYECTOS.SELECCION_ROL, // ✅ Constante
          icon: ConstructionIcon,
          description: "Explorar proyectos disponibles"
        },

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 💰 MIS FINANZAS - Productos y pagos
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {
          label: "Mis Finanzas",
          icon: AccountBalanceIcon,
          description: "Administrar productos financieros",
          submenu: [
            // === Productos Activos ===
            { 
              label: "Planes de Ahorro", 
              path: ROUTES.CLIENT.FINANZAS.SUSCRIPCIONES, // ✅ Constante
              icon: SupervisedUserIcon, 
              description: "Ver mis planes de ahorro",
              requiresKYC: true
            },
            { 
              label: "Inversiones", 
              path: ROUTES.CLIENT.FINANZAS.INVERSIONES, // ✅ Constante
              icon: AttachMoneyIcon, 
              description: "Ver mis inversiones",
              requiresKYC: true
            },
            { 
              label: "Mis Pujas", 
              path: ROUTES.CLIENT.FINANZAS.PUJAS, // ✅ Constante
              icon: GavelIcon, 
              description: "Pujas activas y historial",
              requiresKYC: true
            },
            { isDivider: true, label: "" },
            // === Acción Prioritaria ===
            { 
              label: "Pagar Cuotas", 
              path: ROUTES.CLIENT.FINANZAS.PAGOS, // ✅ Constante
              icon: ReceiptIcon, 
              description: "Realizar pagos de cuotas",
              requiresKYC: true
            }, 
          ]
        },

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 📂 MI PORTAFOLIO - Assets personales
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {
          label: "Mi Portafolio",
          icon: FolderIcon,
          description: "Mis documentos y favoritos",
          submenu: [
            { 
              label: "Lotes Favoritos", 
              path: ROUTES.CLIENT.CUENTA.FAVORITOS, // ✅ Constante
              icon: FavoriteIcon, 
              description: "Lotes guardados"
            },
            { 
              label: "Mis Contratos", 
              path: ROUTES.CLIENT.CUENTA.CONTRATOS, // ✅ Constante
              icon: DescriptionIcon, 
              description: "Contratos y documentos",
              requiresKYC: true
            },
          ]
        },

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ⋯ MÁS - Funciones secundarias (Overflow menu)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {
          label: "Más",
          icon: MoreHorizIcon,
          description: "Más opciones y configuración",
          submenu: [
            // === Reportes y Consultas ===
            { 
              label: "Movimientos", 
              path: ROUTES.CLIENT.FINANZAS.TRANSACCIONES, // ✅ Constante
              icon: ReceiptIcon, 
              description: "Historial de transacciones"
            }, 
            { 
              label: "Estado de Cuenta", 
              path: ROUTES.CLIENT.FINANZAS.RESUMENES, // ✅ Constante
              icon: DescriptionIcon, 
              description: "Ver resumen de cuenta"
            },
            { isDivider: true, label: "" },
            
            // === Información y Ayuda ===
            {
              label: "Cómo Funciona",
              icon: HelpOutlineIcon,
              description: "Guías y tutoriales",
              submenu: [
                { 
                  label: "Para Ahorristas", 
                  path: ROUTES.PUBLIC.COMO_FUNCIONA_AHORRISTA, // ✅ Constante
                  icon: SupervisedUserIcon, 
                  description: "Guía para ahorristas"
                },
                { 
                  label: "Para Inversionistas", 
                  path: ROUTES.PUBLIC.COMO_FUNCIONA_INVERSIONISTA, // ✅ Constante
                  icon: AttachMoneyIcon, 
                  description: "Guía para inversionistas"
                },
              ],
            },
            { isDivider: true, label: "" },
            
            // === Seguridad ===
            { 
              label: "Configuración de Seguridad", 
              path: ROUTES.CLIENT.CUENTA.SEGURIDAD, // ✅ Constante
              icon: SecurityIcon, 
              description: "Administrar seguridad de la cuenta"
            },
          ]
        },
      ];

      const clientUserNavItems: NavItem[] = [
        {
          label: user?.nombre || "Usuario",
          icon: AccountCircleIcon,
          badge: !isVerified ? 1 : undefined,
          submenu: [
            { 
              label: "Mi Perfil", 
              path: ROUTES.CLIENT.CUENTA.PERFIL, // ✅ Constante
              icon: AccountCircleIcon, 
              description: "Ver y editar perfil"
            },
            { 
              label: "Mis Mensajes", 
              path: ROUTES.CLIENT.CUENTA.MENSAJES, // ✅ Constante
              icon: MessageIcon, 
              description: "Centro de notificaciones"
            },
            
            // === Alerta de Verificación (solo si no está verificado) ===
            ...(!isVerified ? [
              { isDivider: true, label: "" } as NavItem,
              { 
                label: "⚠️ Verificar mi Cuenta", 
                path: ROUTES.CLIENT.CUENTA.KYC, // ✅ Constante
                icon: VerifiedUserIcon, 
                description: "Completar verificación KYC",
                badge: 1
              } as NavItem,
            ] : []),
            
            { isDivider: true, label: "" },
            { 
              label: "Cerrar Sesión", 
              icon: LogoutIcon, 
              action: handleLogoutClick 
            },
          ],
        },
      ];

      return {
        logoPath: "/logo.svg",
        homePath: ROUTES.CLIENT.DASHBOARD, // ✅ Constante
        navItems: clientNavItems,
        userNavItems: clientUserNavItems,
        actionButtons: [],
        quickAccess: [
          { label: "Inicio", path: ROUTES.CLIENT.DASHBOARD, icon: DashboardIcon },
          { label: "Proyectos", path: ROUTES.PROYECTOS.SELECCION_ROL, icon: ConstructionIcon },
          { label: "Pagar Cuotas", path: ROUTES.CLIENT.FINANZAS.PAGOS, icon: ReceiptIcon },
        ]
      };
    }

    // ════════════════════════════════════════════════════════
    // C. PÚBLICO (DEFAULT) - Landing page
    // ════════════════════════════════════════════════════════
    return {
      logoPath: "/",
      homePath: ROUTES.PUBLIC.HOME, // ✅ Constante
      navItems: [
        { 
          label: "Inicio", 
          path: ROUTES.PUBLIC.HOME, // ✅ Constante
          description: "Página principal"
        },
        { 
          label: "Cómo Funciona", 
          path: ROUTES.PUBLIC.COMO_FUNCIONA, // ✅ Constante
          icon: HelpOutlineIcon, 
          description: "Información sobre nuestros servicios"
        },
        { 
          label: "Proyectos", 
          path: ROUTES.PROYECTOS.SELECCION_ROL, // ✅ Constante
          description: "Ver proyectos disponibles"
        },
        { 
          label: "Nosotros", 
          path: ROUTES.PUBLIC.NOSOTROS, // ✅ Constante
          description: "Sobre la empresa"
        },
      ],
      userNavItems: [],
      actionButtons: [
        { 
          label: "Iniciar Sesión", 
          variant: "outlined", 
          path: ROUTES.LOGIN, // ✅ Constante
          description: "Acceder a tu cuenta"
        },
        { 
          label: "Registrarse", 
          variant: "contained", 
          path: ROUTES.REGISTER, // ✅ Constante
          description: "Crear una cuenta nueva"
        },
      ],
      quickAccess: []
    };
  }, [user, navigate, confirmLogout]);

  return { config, logoutDialogProps };
};

// ════════════════════════════════════════════════════════
// UTILIDADES ADICIONALES
// ════════════════════════════════════════════════════════

/**
 * Filtra items de navegación que requieren KYC según el estado del usuario
 */
export const filterByKYCStatus = (
  items: NavItem[], 
  isVerified: boolean
): NavItem[] => {
  return items.map(item => {
    if (item.submenu) {
      return {
        ...item,
        submenu: item.submenu.filter(sub => 
          !sub.requiresKYC || (sub.requiresKYC && isVerified)
        )
      };
    }
    return item;
  }).filter(item => 
    !item.requiresKYC || (item.requiresKYC && isVerified)
  );
};

/**
 * Obtiene el path activo basado en la ruta actual
 */
export const getActiveNavItem = (
  pathname: string, 
  navItems: NavItem[]
): NavItem | null => {
  for (const item of navItems) {
    if (item.path === pathname) return item;
    
    if (item.submenu) {
      const subItem = getActiveNavItem(pathname, item.submenu);
      if (subItem) return subItem;
    }
  }
  return null;
};