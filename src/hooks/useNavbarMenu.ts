import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Hooks
import { useConfirmDialog } from "./useConfirmDialog"; // 👈 Importamos el hook nuevo

// Iconos
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import {
  Dashboard as DashboardIcon,
  Construction as ConstructionIcon,
  Terrain as TerrainIcon,
  Paid as PaidIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  Favorite as FavoriteIcon,
  SupervisedUserCircle as SupervisedUserIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
   Message as MessageIcon,
  type SvgIconComponent,
} from "@mui/icons-material";

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

export const useNavbarMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // 1. Usamos el hook useConfirmDialog en lugar de useState manual
  const confirmLogout = useConfirmDialog();

  // 2. Preparamos las props para el ConfirmDialog (que se renderizará en el Navbar)
  const logoutDialogProps = {
    controller: confirmLogout,
    onConfirm: () => {
        confirmLogout.close();
        logout();
        navigate("/login");
    }
  };

  const config: NavbarConfig = useMemo(() => {
    // Handler común para logout
    const handleLogoutClick = () => {
        confirmLogout.confirm('logout'); // 👈 Activamos el diálogo con la acción 'logout'
    };

    // ════════════════════════════════════════════════════════
    // A. ADMINISTRADOR
    // ════════════════════════════════════════════════════════
    if (user?.rol === "admin") {
      const adminNavItems: NavItem[] = [
        { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon },
        { 
          label: "Gestión de Usuarios",
          icon: PersonIcon, 
          submenu: [
            { label: "Gestion Usuarios", path: "/admin/usuarios", icon: ConstructionIcon },
            { label: "Verificacion de usuarios", path: "/admin/KYC", icon: AdminPanelSettingsIcon },
          ],
        },
        { 
          label: "Proyectos",
          icon: ConstructionIcon, 
          submenu: [
            { label: "Gestion Proyectos", path: "/admin/Proyectos", icon: ConstructionIcon },
            { label: "Gestion de suscripciones", path: "/admin/suscripciones", icon: AssignmentIcon },
            { label: "Gestion de Inversiones", path: "/admin/Inversiones", icon: AttachMoneyIcon },
          ],
        },
        {
          label: "Lotes",
          icon: TerrainIcon,
          submenu: [
            { label: "Gestión de Lotes", path: "/admin/Lotes", icon: TerrainIcon },
            { label: "Gestion de Pagos", path: "/admin/AdminLotePagos", icon: AttachMoneyIcon },
            { isDivider: true, label: "" },
            { label: "Gestion de Pujas", path: "/admin/pujas", icon: GavelIcon },
          ],
        },
        {
          label: "Contratos",
          icon: PaidIcon,
          submenu: [
            { label: "Gestion de Contrato Plantilla", path: "/admin/plantillas", icon: DescriptionIcon },
            { label: "Gestion de Contratos Firmados", path: "/admin/firmados", icon: AssignmentIcon },
          ],
        },
        {
          label: "Finanzas",
          icon: AccountBalanceIcon,
          submenu: [
            { label: "Gestion de Pagos ", path: "/admin/Pagos", icon: AttachMoneyIcon },
            { label: "Gestion Transacciones", path: "/admin/transacciones", icon: ReceiptIcon },
            { label: "Gestion de Resumenes de Cuenta", path: "/admin/ResumenesCuenta", icon: ReceiptIcon },
          ],
        },
        { isDivider: true, label: "" },
        {
          
          label: "Proyectos Vista Cliente",
          icon: AccountBalanceIcon,
          submenu: [
            { label: "Ahorrista ", path: "/proyectos/ProyectosAhorrista", icon: AttachMoneyIcon },
            { label: "Inversionista", path: "/proyectos/ProyectosInversionista", icon: ReceiptIcon },
          ],
        },
      ];

      const adminUserNavItems: NavItem[] = [
        {
          label: user?.nombre || "Admin",
          icon: AccountCircleIcon,
          submenu: [
            { label: "Mi Perfil", path: "/admin/perfil", icon: AccountCircleIcon },
            { label: "Configuración", path: "/admin/configuracion", icon: SettingsIcon },
            { isDivider: true, label: "" },
            {
              label: "Cerrar Sesión",
              icon: LogoutIcon,
              action: handleLogoutClick, // 👈 Usamos el handler
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
      const kycStatus = (user as any)?.estado_kyc || 'SIN_INICIAR';
      const isVerified = kycStatus === "APROBADA" && user?.is_2fa_enabled;

      const clientNavItems: NavItem[] = [
        { label: "Dashboard", path: "/dashboard" },
        {
          label: "Como Funciona",
          icon: DescriptionIcon,
          submenu: [
            { label: "Para Ahorristas", path: "/como-funciona/ahorrista", icon: AccountCircleIcon },
            { label: "Para Inversionistas", path: "/como-funciona/inversionista", icon: AttachMoneyIcon },
          ],
        },
        { label: "Proyectos", path: "/proyectos/rol-seleccion" },
        {
            label: "Mis Finanzas",
            icon: AccountBalanceIcon,
            submenu: [
                { label: "Inversiones", path: "/inversiones", icon: AttachMoneyIcon },
                { label: "Suscripciones", path: "/suscripciones", icon: SupervisedUserIcon },
                { label: "Pujas", path: "/pujas", icon: GavelIcon },
                { isDivider: true, label: "Pagos" },
                { label: "Cuotas a Pagar", path: "/pagos", icon: AttachMoneyIcon }, 
                { label: "Historial Transacciones", path: "/transacciones", icon: ReceiptIcon }, 
                { label: "Resumen de Cuenta", path: "/Resumenes", icon: DescriptionIcon }, 
            ]
        },
        {
            label: "Mi Portafolio",
            icon: AccountBalanceIcon,
            submenu: [
                { label: "Favoritos", path: "/Favoritos", icon: FavoriteIcon },
                { label: "Contratos", path: "/Contratos", icon: GavelIcon },
            ]
        },
        {
            label: "Seguridad",
            icon: AccountBalanceIcon,
            submenu: [
                ...(!isVerified ? [
                { label: "Verificar mi cuenta", path: "/kyc", icon: AdminIcon } as NavItem,
                { isDivider: true, label: "" } as NavItem,
            ] : []),
            { label: "Proteger mi acceso", path: "/seguridad", icon: AdminPanelSettingsIcon },
            ]
        },
      ];

      const clientUserNavItems: NavItem[] = [
        {
          label: user?.nombre || "Usuario",
          icon: AccountCircleIcon,
          submenu: [
            { label: "Mi Perfil", path: "/perfil", icon: AccountCircleIcon },
            { label: "Mensajes", path: "/mensajes", icon: DescriptionIcon },
            { isDivider: true, label: "" },
            {
              label: "Cerrar Sesión",
              icon: LogoutIcon,
              action: handleLogoutClick, // 👈 Usamos el handler
            },
          ],
        },
      ];

      return {
        logoPath: "/logo.svg",
        homePath: "/dashboard",
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
        { label: "Proyectos", path: "/proyectos/rol-seleccion" },
        { label: "Nosotros", path: "/nosotros" },
      ],
      userNavItems: [],
      actionButtons: [
        { label: "Iniciar Sesión", variant: "outlined", path: "/login" },
        { label: "Registrarse", variant: "contained", path: "/register" },
      ],
    };
  }, [user, navigate, confirmLogout]); // 👈 Añadimos confirmLogout a deps

  // Retornamos la configuración y las props para el modal
  return { config, logoutDialogProps };
};