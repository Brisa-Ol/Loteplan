import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Gavel as GavelIcon,
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

// ==========================================
// 2. EL HOOK CORREGIDO
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
    if (user?.rol === "admin") {
      const adminNavItems: NavItem[] = [
        { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon },
         { label: "Gestión de Usuarios",
          icon: PersonIcon, 
          submenu: [
            { label: "Control de Usuarios", path: "/admin/usuarios", icon: ConstructionIcon },
            { label: "Verificacion de usuarios", path: "/admin/KYC", icon: ConstructionIcon },
          ],},
       
        { label: "Proyectos",
          icon: ConstructionIcon, 
          submenu: [
            { label: "Inventario Proyectos", path: "/admin/Proyectos", icon: ConstructionIcon },
            { label: "Gestion de suscripciones", path: "/admin/suscripciones", icon: ConstructionIcon },
            { label: "Control de Cancelaciones", path: "/admin/cancelaciones", icon: ConstructionIcon },
            { label: "Gestion de Inversiones", path: "/admin/Inversiones", icon: ConstructionIcon },
          ],


        },
        {
          label: "Lotes",
          icon: TerrainIcon,
          submenu: [
            { label: "Gestión de Lotes", path: "/admin/Lotes", icon: TerrainIcon },
            { label: "Lote Pagos", path: "/admin/LotePagos", icon: TerrainIcon },
            { isDivider: true, label: "" },
            { label: "Sala de Pujas", path: "/admin/SalaControlPujas", icon: GavelIcon },
          ],
        },
        

{
          label: "Contratos",
          icon: PaidIcon,
          submenu: [
            { label: "Plantillas", path: "/admin/Plantillas", icon: AttachMoneyIcon },
            { label: "Firmados", path: "/admin/Firmados", icon: ReceiptIcon },
            // ... otros items
          ],
        },


        {
          label: "Finanzas",
          icon: PaidIcon,
          submenu: [
            { label: "Control de Pagos", path: "/admin/Pagos", icon: AttachMoneyIcon },
            { label: "Transacciones", path: "/admin/transacciones", icon: ReceiptIcon },
            // ... otros items
          ],
        },
        // ... (resto de tus items admin)
      ];

      const adminUserNavItems: NavItem[] = [
        {
          label: user?.nombre || "Admin",
          icon: AccountCircleIcon,
          submenu: [
            { label: "Mi Perfil", path: "/admin/perfil", icon: AccountCircleIcon },
            { isDivider: true, label: "" },
            {
              label: "Cerrar Sesión",
              icon: LogoutIcon,
              // ✅ 3. La acción abre el modal en lugar de salir directo
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
      const kycStatus = (user as any).estado_kyc || 'SIN_INICIAR';
      const isVerified = kycStatus === "APROBADA" && user.is_2fa_enabled;

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
            label: "Mi Portafolio",
            icon: AccountBalanceIcon,
            submenu: [
                { label: "Mis Inversiones", path: "/client/inversiones", icon: AttachMoneyIcon },
                { label: "Mis Suscripciones", path: "/client/suscripciones", icon: SupervisedUserIcon },
                { label: "Mis Subastas", path: "/client/subastas", icon: GavelIcon },
                { label: "Mis Favoritos", path: "/client/Favoritos", icon: GavelIcon },
            ]
        },
        // ... resto de items cliente
      ];

      const clientUserNavItems: NavItem[] = [
        {
          label: user?.nombre || "Usuario",
          icon: AccountCircleIcon,
          submenu: [
            { label: "Mi Perfil", path: "/client/perfil", icon: AccountCircleIcon },
            { label: "Mensajes", path: "/client/mensajes", icon: DescriptionIcon },
            { isDivider: true, label: "" },
            ...(!isVerified ? [
                { label: "⚠️ Completar Verificación", path: "/client/kyc", icon: AdminIcon } as NavItem,
                { isDivider: true, label: "" } as NavItem,
            ] : []),
            { label: "Seguridad", path: "/client/seguridad", icon: AdminPanelSettingsIcon },
            {
              label: "Cerrar Sesión",
              icon: LogoutIcon,
              // ✅ 3. Acción corregida
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
        { label: "Proyectos", path: "/lotes/activos" },
        { label: "Nosotros", path: "/nosotros" },
      ],
      userNavItems: [],
      actionButtons: [
        { label: "Iniciar Sesión", variant: "outlined", path: "/login" },
        { label: "Registrarse", variant: "contained", path: "/register" },
      ],
    };
  }, [user, navigate]); // Eliminé 'logout' de deps porque ahora lo usamos fuera del useMemo

  // ✅ 4. Retornamos la estructura que ClientNavbar espera
  return { config, logoutProps };
};