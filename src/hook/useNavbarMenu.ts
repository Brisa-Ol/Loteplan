// src/hook/useNavbarMenu.ts
// (REORGANIZADO: Usuarios y KYC en rutas separadas)

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
  HelpOutline as HelpIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountBox as AccountBoxIcon,
  Assignment as ProjectIcon,
  Layers as LotesIcon,
  VerifiedUser as KYCIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  Subscriptions as SubscriptionsIcon,
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
  // ITEMS DE NAVEGACIÓN SEGÚN ROL
  // ══════════════════════════════════════════════════════════

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [];

    // Items públicos
    if (!isAuthenticated) {
      items.push(
        { label: "Inicio", path: "/" },
        {
          label: "¿Cómo funciona?",
          submenu: [
            { label: "Para Ahorristas", path: "/ahorrista", icon: HomeIcon },
            { label: "Para Inversionistas", path: "/inversionista", icon: BusinessIcon },
          ],
        },
        { label: "Nosotros", path: "/nosotros" },
        { label: "Preguntas", path: "/preguntas" }
      );
    }

    // Items para ADMIN
    if (isAuthenticated && user?.rol === "admin") {
      items.push(
        { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon },
        { label: "Usuarios", path: "/admin/usuarios", icon: PeopleIcon },
        { label: "Proyectos", path: "/admin/proyectos", icon: ProjectIcon },
        { label: "Lotes", path: "/admin/lotes", icon: LotesIcon },
        { label: "KYC", path: "/admin/kyc", icon: KYCIcon }
      );
    }

    // Items para CLIENTE
    if (isAuthenticated && user?.rol === "cliente") {
      items.push(
        { label: "Inicio", path: "/" },
        { label: "Proyectos", path: "/proyectos" },
        { label: "Nosotros", path: "/nosotros" },
        { label: "Preguntas", path: "/preguntas" }
      );
    }

    return items;
  }, [isAuthenticated, user?.rol]);

  // ══════════════════════════════════════════════════════════
  // ITEMS DE USUARIO (Mi Cuenta / Login)
  // ══════════════════════════════════════════════════════════

  const userNavItems: NavItem[] = useMemo(() => {
    if (!isAuthenticated) return [];

    const userName = user?.nombre || "Usuario";
    const label = user?.rol === "admin" ? `${userName} (Admin)` : userName;

    const submenu: NavItem[] = [
      { label: "Mi Perfil", path: "/mi-cuenta/perfil", icon: AccountBoxIcon },
    ];

    // Opciones específicas para CLIENTE
    if (user?.rol === "cliente") {
      submenu.push(
        { label: "Mis Pagos", path: "/mi-cuenta/pagos", icon: PaymentIcon },
        { label: "Mis Suscripciones", path: "/mi-cuenta/suscripciones", icon: SubscriptionsIcon }
      );
    }

    submenu.push(
      { isDivider: true },
      { label: "Configuración", path: "/mi-cuenta/configuracion", icon: SettingsIcon },
      { label: "Cerrar Sesión", action: handleLogout, icon: LogoutIcon }
    );

    return [{ label, submenu }];
  }, [isAuthenticated, user, handleLogout]);

  // ══════════════════════════════════════════════════════════
  // BOTONES DE ACCIÓN (Login/Register)
  // ══════════════════════════════════════════════════════════

  const actionButtons = useMemo(() => {
    if (isAuthenticated) return [];
    return [
      { label: "Iniciar Sesión", variant: "outlined" as const, path: "/login" },
      { label: "Registrarse", variant: "contained" as const, path: "/register" },
    ];
  }, [isAuthenticated]);

  return {
    logoPath: "/logo.png",
    homePath: "/",
    navItems,
    userNavItems,
    actionButtons,
  };
};