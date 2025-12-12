import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Iconos
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import {
  Dashboard as DashboardIcon,
  Construction as ConstructionIcon,
  Terrain as TerrainIcon,
  Paid as PaidIcon, // ✅ Mantenemos tu icono personalizado
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon, // Alias para usar en items
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  Favorite as FavoriteIcon,
  SupervisedUserCircle as SupervisedUserIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  type SvgIconComponent,
} from "@mui/icons-material";

// ==========================================
// 1. DEFINICIÓN DE TIPOS
// ==========================================

export interface NavItem {
  label: string;
  path?: string;
  icon?: SvgIconComponent;
  action?: () => void;
  submenu?: NavItem[];
  isDivider?: boolean;
  badge?: number;
  variant?: "text" | "outlined" | "contained";
}

export interface NavbarConfig {
  logoPath: string;
  homePath: string;
  navItems: NavItem[];
  userNavItems: NavItem[];
  actionButtons: NavItem[];
}

export const NAVBAR_HEIGHT = {
  mobile: 64,
  desktop: 72,
};

// ==========================================
// 2. EL HOOK FINAL (MEJORADO)
// ==========================================

export const useNavbarMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // ✅ 1. Manejamos el estado del modal aquí
  const [openLogout, setOpenLogout] = useState(false);

  // ✅ 2. Definimos las props para el diálogo
  const logoutProps = {
    open: openLogout,
    onClose: () => setOpenLogout(false),
    onConfirm: () => {
        setOpenLogout(false);
        logout();
        navigate("/login");
    }
  };

  const config: NavbarConfig = useMemo(() => {
    // ════════════════════════════════════════════════════════
    // A. ADMINISTRADOR
    // ════════════════════════════════════════════════════════
    // Usamos ?. para evitar error si user es null
    if (user?.rol === "admin") {
      const adminNavItems: NavItem[] = [
        { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon },
        { 
          label: "Gestión de Usuarios",
          icon: PersonIcon, 
          submenu: [
            { label: "Control de Usuarios", path: "/admin/usuarios", icon: ConstructionIcon },
            { label: "Verificacion de usuarios", path: "/admin/KYC", icon: AdminPanelSettingsIcon }, // Mejor icono para KYC
          ],
        },
        { 
          label: "Proyectos",
          icon: ConstructionIcon, 
          submenu: [
            { label: "Inventario Proyectos", path: "/admin/Proyectos", icon: ConstructionIcon },
            { label: "Gestion de suscripciones", path: "/admin/suscripciones", icon: AssignmentIcon },
            { label: "Control de Cancelaciones", path: "/admin/cancelaciones", icon: ReceiptIcon },
            { label: "Gestion de Inversiones", path: "/admin/Inversiones", icon: AttachMoneyIcon },
          ],
        },
        {
          label: "Lotes",
          icon: TerrainIcon,
          submenu: [
            { label: "Gestión de Lotes", path: "/admin/Lotes", icon: TerrainIcon },
            { label: "Lote Pagos", path: "/admin/LotePagos", icon: AttachMoneyIcon },
            { isDivider: true, label: "" },
            { label: "Sala de Pujas", path: "/admin/SalaControlPujas", icon: GavelIcon },
          ],
        },
        {
          label: "Contratos",
          icon: PaidIcon,
          submenu: [
            { label: "Plantillas", path: "/admin/Plantillas", icon: DescriptionIcon },
            { label: "Firmados", path: "/admin/Firmados", icon: AssignmentIcon },
          ],
        },
        {
          label: "Finanzas",
          icon: AccountBalanceIcon, // Icono más acorde a Finanzas
          submenu: [
            { label: "Control de Pagos", path: "/admin/Pagos", icon: AttachMoneyIcon },
            { label: "Transacciones", path: "/admin/transacciones", icon: ReceiptIcon },
            { label: "Resumenes de Cuenta", path: "/admin/ResumenesCuenta", icon: ReceiptIcon },
          ],
        },
      ];

      const adminUserNavItems: NavItem[] = [
        {
          // ✅ FIX: user?.nombre protege contra null
          label: user?.nombre || "Admin",
          icon: AccountCircleIcon,
          submenu: [
            { label: "Mi Perfil", path: "/admin/perfil", icon: AccountCircleIcon },
            { label: "Configuración", path: "/admin/configuracion", icon: SettingsIcon },
            { isDivider: true, label: "" },
            {
              label: "Cerrar Sesión",
              icon: LogoutIcon,
              action: () => setOpenLogout(true),
            },
          ],
        },
      ];

      return {
        logoPath: "/logo.svg",
        homePath: "/admin/dashboard",
        navItems: adminNavItems,
        userNavItems: adminUserNavItems,
        actionButtons: [],
      };
    }

    // ════════════════════════════════════════════════════════
    // B. CLIENTE
    // ════════════════════════════════════════════════════════
    if (user?.rol === "cliente") {
      // ✅ FIX CRÍTICO: Agregamos ?. en (user as any)?.estado_kyc
      const kycStatus = (user as any)?.estado_kyc || 'SIN_INICIAR';
      // ✅ FIX CRÍTICO: Agregamos user?.is_2fa_enabled
      const isVerified = kycStatus === "APROBADA" && user?.is_2fa_enabled;

      const clientNavItems: NavItem[] = [
        { label: "Dashboard", path: "/client/dashboard" },
        {
          label: "Como Funciona",
          icon: DescriptionIcon,
          submenu: [
            { label: "Para Ahorristas", path: "/como-funciona/ahorrista", icon: AccountCircleIcon },
            { label: "Para Inversionistas", path: "/como-funciona/inversionista", icon: AttachMoneyIcon },
          ],
        },
        { label: "Proyectos", path: "/client/proyectos/seleccion" },
        {
            label: "Mis Finanzas",
            icon: AccountBalanceIcon,
            submenu: [
                { label: "Inversiones", path: "/MisInversiones", icon: AttachMoneyIcon },
                { label: "Suscripciones", path: "/client/suscripciones", icon: SupervisedUserIcon },
                { label: "Subastas", path: "/client/subastas", icon: GavelIcon },
               { isDivider: true, label: "Pagos" }, // Separador visual
                
                { label: "Cuotas a Pagar", path: "/pagos", icon: AttachMoneyIcon }, 
                { label: "Historial Transacciones", path: "/client/transacciones", icon: ReceiptIcon }, 
                { label: "Resumen de Cuenta", path: "/MisResumenes", icon: DescriptionIcon }, 
            ]
        },
        {
            label: "Mi Portafolio",
            icon: AccountBalanceIcon,
            submenu: [
                { label: "Favoritos", path: "/client/Favoritos", icon: FavoriteIcon },
                { label: "Contratos", path: "/client/Contratos", icon: GavelIcon },
            ]
        },

        {
            label: "Seguridad",
            icon: AccountBalanceIcon,
            submenu: [
                ...(!isVerified ? [
                { label: "Verificar mi cuenta", path: "/client/kyc", icon: AdminIcon } as NavItem,
                { isDivider: true, label: "" } as NavItem,
            ] : []),
            { label: "Proteger mi acceso", path: "/client/seguridad", icon: AdminPanelSettingsIcon },
            ]
        },
            
      ];

      const clientUserNavItems: NavItem[] = [
        {
          label: user?.nombre || "Usuario",
          icon: AccountCircleIcon,
          submenu: [
            { label: "Mi Perfil", path: "/client/perfil", icon: AccountCircleIcon },
            { label: "Mensajes", path: "/client/mensajes", icon: DescriptionIcon },
            { isDivider: true, label: "" },

            {
              label: "Cerrar Sesión",
              icon: LogoutIcon,
              action: () => setOpenLogout(true),
            },
          ],
        },
      ];

      return {
        logoPath: "/logo.svg",
        homePath: "/client/dashboard",
        navItems: clientNavItems,
        userNavItems: clientUserNavItems,
        actionButtons: [],
      };
    }

    // ════════════════════════════════════════════════════════
    // C. PÚBLICO (DEFAULT)
    // ════════════════════════════════════════════════════════
    return {
      logoPath: "/",
      homePath: "/",
      navItems: [
        { label: "Inicio", path: "/" },
         {
          label: "Como Funciona",
          icon: DescriptionIcon,
          submenu: [
            { label: "Para Ahorristas", path: "/como-funciona/ahorrista", icon: AccountCircleIcon },
            { label: "Para Inversionistas", path: "/como-funciona/inversionista", icon: AttachMoneyIcon },
          ],
        },

        { label: "Proyectos", path: "/client/proyectos/seleccion" },
        { label: "Nosotros", path: "/nosotros" },
      ],
      userNavItems: [],
      actionButtons: [
        { label: "Iniciar Sesión", variant: "outlined", path: "/login" },
        { label: "Registrarse", variant: "contained", path: "/register" },
      ],
    };
  }, [user, navigate]);

  return { config, logoutProps };
};