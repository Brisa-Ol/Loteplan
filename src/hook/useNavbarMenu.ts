// src/hook/useNavbarMenu.ts
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import type { NavbarConfig, NavItem } from "../components/layout/Navbar/Navbar.types";
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
} from "@mui/icons-material";

/**
 * Hook que gestiona la configuración del navbar según el rol del usuario
 */
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
          path: "/admin/dashboard",
          icon: DashboardIcon,
        },
        {
          label: "Usuarios",
          icon: PeopleIcon,
          submenu: [
            {
              label: "Todos",
              path: "/admin/usuarios",
              icon: PeopleIcon,
            },
            {
              label: "Buscar Usuario",
              path: "/admin/usuarios/buscar",
              icon: PersonSearchIcon,
            },
            {
              label: "Activos",
              path: "/admin/usuarios/activos",
              icon: GroupAddIcon,
            },
            {
              label: "Administradores",
              path: "/admin/usuarios/admins",
              icon: AdminIcon,
            },
          ],
        },
        {
          label: "Proyectos",
          icon: ConstructionIcon,
          submenu: [
            {
              label: "Todos los Proyectos",
              path: "/admin/proyectos",
              icon: ApartmentIcon,
            },
            {
              label: "Crear Proyecto",
              path: "/admin/proyectos/crear",
              icon: PlaylistAddIcon,
            },
            {
              label: "Métricas",
              path: "/admin/proyectos/metricas",
              icon: AssessmentIcon,
            },
            { isDivider: true },
            {
              label: "Cuotas Mensuales",
              path: "/admin/cuotas",
              icon: AttachMoneyIcon,
            },
          ],
        },
        {
          label: "Lotes",
          icon: TerrainIcon,
          submenu: [
            {
              label: "Gestión de Lotes",
              path: "/admin/lotes",
              icon: TerrainIcon,
            },
            {
              label: "Lotes sin Proyecto",
              path: "/admin/lotes/sin-proyecto",
              icon: TerrainIcon,
            },
            { isDivider: true },
            {
              label: "Subastas Activas",
              path: "/admin/subastas",
              icon: GavelIcon,
            },
            {
              label: "Lotes Pendientes",
              path: "/admin/lotes/pendientes-pago",
              icon: TerrainIcon,
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
            { isDivider: true },
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
          label: "Reportes",
          icon: BarChartIcon,
          submenu: [
            {
              label: "KPIs Generales",
              path: "/admin/reportes/kpis",
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
          label: `${user.nombre} (Admin)`,
          icon: AccountCircleIcon,
          submenu: [
            {
              label: "Mi Perfil",
              path: "/admin/perfil",
              icon: AccountCircleIcon,
            },
            { isDivider: true },
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
        logoPath: "/navbar/nav.png",
        homePath: "/admin/dashboard",
        navItems: adminNavItems,
        userNavItems: adminUserNavItems,
        actionButtons: [],
      };
    }

    // ════════════════════════════════════════════════════════
    // CONFIGURACIÓN PARA CLIENTE
    // ════════════════════════════════════════════════════════
    if (user?.rol === "cliente") {
      // Verificar si el cliente tiene KYC aprobado y 2FA activado
      const isVerified = user.estado_kyc === "APROBADA" && user.is_2fa_enabled;

      const clientNavItems: NavItem[] = [
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
              path: "/cliente/suscripciones",
              icon: SupervisedUserIcon,
            },
            {
              label: "Mis Pujas",
              path: "/cliente/pujas",
              icon: GavelIcon,
            },
            { isDivider: true },
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
              label: "Pagos Mensuales",
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
          path: "/cliente/contratos",
          icon: AssignmentIcon,
        },
      ];

      const clientUserNavItems: NavItem[] = [
        {
          label: user.nombre,
          icon: AccountCircleIcon,
          submenu: [
            {
              label: "Mi Perfil",
              path: "/cliente/perfil",
              icon: AccountCircleIcon,
            },
            {
              label: "Mensajes",
              path: "/cliente/mensajes",
              icon: DescriptionIcon,
            },
            { isDivider: true },
            // Mostrar advertencia si no está verificado
            ...(!isVerified ? [
              {
                label: "⚠️ Completar Verificación",
                path: "/cliente/verificacion",
                icon: AdminIcon,
              } as NavItem,
              { isDivider: true } as NavItem,
            ] : []),
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
        logoPath: "/navbar/nav.png",
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
      logoPath: "/navbar/nav.png",
      homePath: "/",
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

// ══════════════════════════════════════════════════════════
// HELPER: Verificar si el usuario necesita onboarding
// ══════════════════════════════════════════════════════════
export const needsOnboarding = (user: any): boolean => {
  if (!user || user.rol !== "cliente") return false;
  return user.estado_kyc !== "APROBADA" || !user.is_2fa_enabled;
};

// ══════════════════════════════════════════════════════════
// HELPER: Determinar la ruta de inicio según estado del usuario
// ══════════════════════════════════════════════════════════
export const getHomePathForUser = (user: any): string => {
  if (!user) return "/";
  
  if (user.rol === "admin") {
    return "/admin/dashboard";
  }
  
  if (user.rol === "cliente") {
    // Si necesita onboarding, llevarlo allí
    if (needsOnboarding(user)) {
      return "/cliente/onboarding";
    }
    return "/cliente/inicio";
  }
  
  return "/";
};