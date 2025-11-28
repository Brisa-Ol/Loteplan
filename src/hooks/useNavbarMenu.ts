import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Ajusta la ruta si es necesario
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Construction as ConstructionIcon,
  Terrain as TerrainIcon,
  Paid as PaidIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  PersonSearch as PersonSearchIcon,
  GroupAdd as GroupAddIcon,
  AdminPanelSettings as AdminIcon,
  Apartment as ApartmentIcon,
  PlaylistAdd as PlaylistAddIcon,
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
// 2. EL HOOK
// ==========================================

export const useNavbarMenu = (): NavbarConfig => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return useMemo(() => {
    // ════════════════════════════════════════════════════════
    // CONFIGURACIÓN PARA ADMINISTRADOR
    // ════════════════════════════════════════════════════════
    if (user?.rol === "admin") {
      const adminNavItems: NavItem[] = [
        {
          label: "Dashboard",
          path: "/Admin/Dashboard/AdminDashboard",
          icon: DashboardIcon,
        },
        {
          label: "Gestión de Usuarios",
          path: "Admin/Usuarios/AdminUsuarios",
          icon: PersonIcon,
        },
        {
          label: "Gestion de Proyectos",
          path: "/Admin/Proyectos/AdminProyectos",
          icon: ConstructionIcon,
        },


        {
          label: "Lotes",
          icon: TerrainIcon,
          submenu: [
            {
              label: "Gestión de Lotes",
              path: "/Admin/Lotes/AdminLotes",
              icon: TerrainIcon,
            },
            {
              label: "Monitor de Impagos",
              path: "/Admin/Lotes/AdminDashboardImpagos",
              icon: TerrainIcon,
            },

            { isDivider: true, label: "" },
            {
              label: "Subastas",
              path: "/Admin/Lotes/AdminSubastas",
              icon: GavelIcon,
            },
          ],
        },
        {
          label: "Finanzas",
          icon: PaidIcon,
          submenu: [
            {
              label: "Inversiones",
              path: "/admin/inversiones",
              icon: AttachMoneyIcon,
            },
            {
              label: "Transacciones",
              path: "/admin/transacciones",
              icon: ReceiptIcon,
            },
            {
              label: "Pagos Mensuales",
              path: "/admin/pagos",
              icon: CalendarIcon,
            },
            { isDivider: true, label: "" },
            {
              label: "Suscripciones",
              path: "/admin/suscripciones",
              icon: SupervisedUserIcon,
            },
            {
              label: "Pujas",
              path: "/admin/pujas",
              icon: GavelIcon,
            },
            {
              label: "Resúmenes de Cuenta",
              path: "/admin/resumenes",
              icon: AccountBalanceIcon,
            },
          ],
        },
        {
          label: "Contratos",
          icon: AssignmentIcon,
          submenu: [
            {
              label: "Plantillas",
              path: "/admin/contratos/plantillas",
              icon: DescriptionIcon,
            },
            {
              label: "Contratos Firmados",
              path: "/admin/contratos/firmados",
              icon: AssignmentIcon,
            },
          ],
        },
        {
          label: "Verificacion Documentos",
          icon: BarChartIcon,
          submenu: [
            {
              label: "Solicitudes",
              path: "/Admin/Usuarios/AdminKYC",
              icon: BarChartIcon,
            },
            {
              label: "Reportes Avanzados",
              path: "/admin/reportes/avanzados",
              icon: AssessmentIcon,
            },
          ],
        },
      ];

      const adminUserNavItems: NavItem[] = [
        {
          // CORRECCIÓN 1: Fallback para evitar undefined
          label: user?.nombre || "Admin",
          icon: AccountCircleIcon,
          submenu: [
            {
              label: "Mi Perfil",
              path: "/admin/perfil",
              icon: AccountCircleIcon,
            },
            {
              label: "Seguridad",
              path: "/client/MiCuenta/SecuritySettings",
              icon: SettingsIcon,
            },
            {
              label: "Verificacion de identidad",
              path: "/client/MiCuenta/VerificacionKYC",
              icon: SettingsIcon,
            },
            { isDivider: true, label: "" },
            {
              label: "Cerrar Sesión",
              icon: LogoutIcon,
              action: () => {
                logout();
                navigate("/login");
              },
            },
          ],
        },
      ];

      return {
        logoPath: "/logo.svg",
        homePath: "/admin",
        navItems: adminNavItems,
        userNavItems: adminUserNavItems,
        actionButtons: [],
      };
    }

    // ════════════════════════════════════════════════════════
    // CONFIGURACIÓN PARA CLIENTE
    // ════════════════════════════════════════════════════════
    if (user?.rol === "cliente") {
      // CORRECCIÓN 2: Casting 'as any' para evitar error si el DTO no tiene la propiedad
      // y valor por defecto 'SIN_INICIAR'
      const kycStatus = (user as any).estado_kyc || 'SIN_INICIAR';
      const isVerified = kycStatus === "APROBADA" && user.is_2fa_enabled;

      const clientNavItems: NavItem[] = [
        {
          label: "Dashboard",
          path: "/client/UserDashboard/UserDashboard",
        },
        {
          label: "Como Funciona",
          icon: DescriptionIcon,
          submenu: [
            {
              label: "Para Ahorristas",
              path: "/ComoFunciona/Ahorrista/Ahorrista",
              icon: AccountCircleIcon,
            },
            {
              label: "Para Inversionistas",
              path: "/ComoFunciona/Inversionista/Inversionista",
              icon: AttachMoneyIcon,
            },
          ],
        },
        {
          label: "Proyectos",
          path: "/client/Proyectos/RoleSelection",
        },
        {
          label: "Mi Portafolio",
          icon: AccountBalanceIcon,
          submenu: [
            {
              label: "Mis Inversiones",
              path: "/cliente/inversiones",
              icon: AttachMoneyIcon,
            },
            {
              label: "Mis Suscripciones",
              path: "/client/MiCuenta/Suscripciones",
              icon: SupervisedUserIcon,
            },
            {
              label: "Mis Subastas",
              path: "/pages/client/MiCuenta/MisSubastas",
              icon: GavelIcon,
            },
            { isDivider: true, label: "" },
            {
              label: "Estado de Cuenta",
              path: "/cliente/estado-cuenta",
              icon: AccountBalanceIcon,
            },
          ],
        },
        {
          label: "Pagos",
          icon: PaidIcon,
          submenu: [
            {
              label: "Pagos ",
              path: "/cliente/pagos",
              icon: CalendarIcon,
            },
            {
              label: "Transacciones",
              path: "/cliente/transacciones",
              icon: ReceiptIcon,
            },
          ],
        },
        {
          label: "Mis Contratos",
          path: "/client/MiCuenta/Contratos",
          icon: AssignmentIcon,
        },
      ];

      const clientUserNavItems: NavItem[] = [
        {
          // CORRECCIÓN 1: Fallback para evitar undefined
          label: user?.nombre || "Usuario",
          icon: AccountCircleIcon,
          submenu: [
            {
              label: "Mi Perfil",
              path: "/client/MiCuenta/Perfil",
              icon: AccountCircleIcon,
            },
            {
              label: "Mensajes",
              path: "/client/MiCuenta/MensajesPage",
              icon: DescriptionIcon,
            },
            { isDivider: true, label: "" },
            // Mostrar advertencia si no está verificado
            ...(!isVerified ? [
              {
                label: kycStatus === 'PENDIENTE' ? "⏳ Verificación en Proceso" : "⚠️ Completar Verificación kyc",
                path: "/cliente/verificacion",
                icon: AdminIcon,
              } as NavItem,
              { isDivider: true, label: "" } as NavItem,
            ] : []),
  {
              label: "Seguridad con Token",
              path: "/client/MiCuenta/SecuritySettings",
              icon: AdminPanelSettingsIcon ,
            },
            {
              label: "Cerrar Sesión",
              icon: LogoutIcon,
              action: () => {
                logout();
                navigate("/login");
              },
            },
          ],
        },
      ];

      return {
        logoPath: "/logo.svg",
        homePath: "/cliente/inicio",
        navItems: clientNavItems,
        userNavItems: clientUserNavItems,
        actionButtons: [],
      };
    }

    // ════════════════════════════════════════════════════════
    // CONFIGURACIÓN PARA NO AUTENTICADOS
    // ════════════════════════════════════════════════════════
    const publicNavItems: NavItem[] = [
      {
        label: "Inicio",
        path: "/",
      },
      {
        label: "Como Funciona",
        icon: DescriptionIcon,
        submenu: [
          {
            label: "Para Ahorristas",
            path: "/ahorrista",
            icon: AccountCircleIcon,
          },
          {
            label: "Para Inversionistas",
            path: "/inversionista",
            icon: AttachMoneyIcon,
          },
        ],
      },
      {
        label: "Proyectos",
        path: "/proyectos",
      },
      {
        label: "Nosotros",
        path: "/nosotros",
      },
      {
        label: "Contacto",
        path: "/contacto",
      },
    ];

    return {
      logoPath: "/",
      homePath: "/public/navbar/nav.png",
      navItems: publicNavItems,
      userNavItems: [],
      actionButtons: [
        {
          label: "Iniciar Sesión",
          variant: "outlined",
          path: "/login",
        },
        {
          label: "Registrarse",
          variant: "contained",
          path: "/register",
        },
      ],
    };
  }, [user, logout, navigate]);
};