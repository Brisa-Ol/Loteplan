// src/components/layout/Navbar/Navbar.types.ts
import type { SvgIconComponent } from "@mui/icons-material";

// ══════════════════════════════════════════════════════════
// TIPOS BASE DE NAVEGACIÓN
// ══════════════════════════════════════════════════════════

interface CommonItemProps {
  label: string;
  icon?: SvgIconComponent;
}

// Item con path (link directo)
interface PathItem extends CommonItemProps {
  path: string;
  action?: never;
  submenu?: never;
  isDivider?: never;
}

// Item con acción (ej. logout, abrir modal)
interface ActionItem extends CommonItemProps {
  action: () => void;
  path?: never;
  submenu?: never;
  isDivider?: never;
}

// Item con submenú desplegable
interface SubmenuItem extends CommonItemProps {
  submenu: NavItem[];
  path?: never;
  action?: never;
  isDivider?: never;
}

// Divisor visual en menús
interface DividerItem {
  isDivider: true;
  label?: never;
  path?: never;
  action?: never;
  submenu?: never;
  icon?: never;
}

// Unión de todos los tipos posibles
export type NavItem = PathItem | ActionItem | SubmenuItem | DividerItem;

// ══════════════════════════════════════════════════════════
// BOTONES DE ACCIÓN
// ══════════════════════════════════════════════════════════

export interface ActionButton {
  label: string;
  variant: "outlined" | "contained";
  path?: string;
  action?: () => void;
}

// ══════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL NAVBAR
// ══════════════════════════════════════════════════════════

export interface NavbarConfig {
  logoPath: string;
  homePath: string;
  navItems: NavItem[];        // Navegación principal (centro)
  userNavItems: NavItem[];    // Navegación de usuario (derecha)
  actionButtons: ActionButton[];
}

// ══════════════════════════════════════════════════════════
// TYPE GUARDS
// ══════════════════════════════════════════════════════════

export const hasSubmenu = (item: NavItem): item is SubmenuItem => {
  return 'submenu' in item && Array.isArray(item.submenu) && item.submenu.length > 0;
};

export const isPathItem = (item: NavItem): item is PathItem => {
  return 'path' in item && typeof item.path === 'string';
};

export const isActionItem = (item: NavItem): item is ActionItem => {
  return 'action' in item && typeof item.action === 'function';
};

export const isDividerItem = (item: NavItem): item is DividerItem => {
  return 'isDivider' in item && item.isDivider === true;
};