import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  Business as BusinessIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountBox as AccountBoxIcon,
  Assignment as ProjectIcon,
  Layers as LotesIcon,
  VerifiedUser as KYCIcon,
  Logout as LogoutIcon,
  Payment as PaymentIcon,
  Subscriptions as SubscriptionsIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
  Help as HelpIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import type { NavbarConfig, NavItem } from "../components/layout/Navbar/Navbar.types";


export const useNavbarMenu = (): NavbarConfig => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ══════════════════════════════════════════════════════════
  // 1. NAVEGACIÓN PRINCIPAL (Centro/Izquierda)
  // ══════════════════════════════════════════════════════════

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];

    // A. PÚBLICO (Visitante)
    if (!isAuthenticated) {
      items.push(
        { label: "Inicio", path: "/" },
        {
          label: "Cómo Funciona",
          submenu: [
            // ⚠️ Rutas corregidas (minúsculas, coinciden con App.tsx)
            { label: "Para Ahorristas", path: "/ahorrista", icon: HomeIcon },
            { label: "Para Inversionistas", path: "/inversionista", icon: BusinessIcon },
          ],
        },
        { label: "Nosotros", path: "/nosotros" },
        { label: "Ayuda", path: "/preguntas" }
      );
    }

    // B. ADMINISTRADOR
    if (isAuthenticated && user?.rol === "admin") {
      items.push(
        { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon },
        { 
          label: "Gestión", 
          submenu: [
            { label: "Usuarios", path: "/admin/usuarios", icon: PeopleIcon },
            { label: "Verificaciones KYC", path: "/admin/kyc", icon: KYCIcon }, 
          ]
        },
        { 
          label: "Negocio", 
          submenu: [
            { label: "Proyectos", path: "/admin/proyectos", icon: ProjectIcon },
            { label: "Lotes & Subastas", path: "/admin/lotes", icon: LotesIcon },
          ]
        }
      );
    }

    // C. CLIENTE
    if (isAuthenticated && user?.rol === "cliente") {
      items.push(
        { label: "Mi Panel", path: "/dashboard", icon: DashboardIcon }, // ⚠️ Ruta real del dashboard
        { 
          label: "Invertir", 
          submenu: [
            // ⚠️ Rutas corregidas (apuntan al catálogo privado)
            { label: "Catálogo Ahorro", path: "/proyectos/ahorrista", icon: HomeIcon },
            { label: "Catálogo Inversión", path: "/proyectos/inversionista", icon: BusinessIcon },
          ]
        },
        { label: "Ayuda", path: "/preguntas", icon: HelpIcon }
      );
    }

    return items;
  }, [isAuthenticated, user?.rol]);

  // ══════════════════════════════════════════════════════════
  // 2. MENÚ DE USUARIO (Avatar/Derecha)
  // ══════════════════════════════════════════════════════════

  const userNavItems: NavItem[] = useMemo(() => {
    if (!isAuthenticated) return [];

    const userName = user?.nombre || "Usuario";
    const displayName = userName.split(' ')[0]; 
    const label = user?.rol === "admin" ? `${displayName} (Admin)` : displayName;

    // Menú Base (Perfil)
    const submenu: NavItem[] = [
      { label: "Mi Perfil", path: "/perfil", icon: AccountBoxIcon },
    ];

    // Menú Extendido para CLIENTE
    if (user?.rol === "cliente") {
      // Verificar estado de validación (KYC/2FA)
      // Nota: 'estado_kyc' puede no venir en el UserDto básico, usar con cuidado o extender DTO
      const isVerified = user.confirmado_email && user.is_2fa_enabled; 

      submenu.push(
        // Alerta visual si falta validar
        ...(!isVerified ? [
             { label: "⚠️ Validar Identidad", path: "/verificacion-kyc", icon: KYCIcon } as NavItem,
             { isDivider: true } as NavItem
           ] : []),

        // ⚠️ RUTAS PLANAS CORREGIDAS (Coinciden con App.tsx)
        { label: "Mis Pagos", path: "/mis-pagos", icon: PaymentIcon },
        { label: "Mis Suscripciones", path: "/mis-suscripciones", icon: SubscriptionsIcon },
        { label: "Mis Subastas", path: "/mis-pujas", icon: GavelIcon },
        
        { isDivider: true },
        
        { label: "Mis Contratos", path: "/mis-documentos", icon: DescriptionIcon }
      );
    }

    submenu.push(
      { isDivider: true },
      { label: "Cerrar Sesión", action: handleLogout, icon: LogoutIcon }
    );

    return [{ label, submenu }];
  }, [isAuthenticated, user, handleLogout]);

  // ══════════════════════════════════════════════════════════
  // 3. BOTONES DE ACCIÓN (Público)
  // ══════════════════════════════════════════════════════════

  const actionButtons = useMemo(() => {
    if (isAuthenticated) return [];
    return [
      { label: "Ingresar", variant: "outlined" as const, path: "/login" },
      { label: "Crear Cuenta", variant: "contained" as const, path: "/register" },
    ];
  }, [isAuthenticated]);

  return {
    logoPath: "/navbar/nav.png", // Ajusta según public
    homePath: isAuthenticated && user?.rol === "cliente" ? "/dashboard" : "/",
    navItems,
    userNavItems,
    actionButtons,
  };
};

// ══════════════════════════════════════════════════════════
// HELPERS EXPORTABLES (Opcional, si los usas en App.tsx para redirección)
// ══════════════════════════════════════════════════════════

export const needsOnboarding = (user: any): boolean => {
  if (!user || user.rol !== "cliente") return false;
  // Ajusta 'estado_kyc' al nombre real en tu DTO si es diferente (ej: 'kyc_aprobado')
  return user.is_2fa_enabled === false; 
};

export const getHomePathForUser = (user: any): string => {
  if (!user) return "/";
  
  if (user.rol === "admin") {
    return "/admin/dashboard";
  }
  
  if (user.rol === "cliente") {
    if (needsOnboarding(user)) {
      return "/verificacion-kyc"; // ⚠️ Redirigir a KYC si falta
    }
    return "/dashboard";
  }
  
  return "/";
};