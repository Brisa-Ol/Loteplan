// src/components/layout/Navbar/Navbar.types.ts (CORREGIDO)
import type { SvgIconComponent } from "@mui/icons-material";

// ══════════════════════════════════════════════════════════
// DEFINICIONES DE ITEMS DE NAVEGACIÓN
// (Esta es la corrección: separamos los tipos en lugar de usar BaseNavItem)
// ══════════════════════════════════════════════════════════

interface CommonItemProps {
  label: string;
  icon?: SvgIconComponent;
}

// 1. Un item que es un link
interface PathItem extends CommonItemProps {
  path: string;
  action?: never;
  submenu?: never;
  isDivider?: never;
}

// 2. Un item que ejecuta una acción (ej. Logout)
interface ActionItem extends CommonItemProps {
  action: () => void;
  path?: never;
  submenu?: never;
  isDivider?: never;
}

// 3. Un item que tiene un submenú
interface SubmenuItem extends CommonItemProps {
  submenu: NavItem[];
  path?: never;
  action?: never;
  isDivider?: never;
}

// 4. Un item que es solo un divisor
interface DividerItem {
  isDivider: true;
  label?: never;
  path?: never;
  action?: never;
  submenu?: never;
  icon?: never;
}

// NavItem es la unión de todas las posibilidades
export type NavItem = PathItem | ActionItem | SubmenuItem | DividerItem;

// ══════════════════════════════════════════════════════════
// OTROS TIPOS (Sin cambios)
// ══════════════════════════════════════════════════════════

export interface ActionButton {
  label: string;
  variant: "outlined" | "contained";
  path?: string;
  action?: () => void;
}

export interface NavbarConfig {
  logoPath: string;
  homePath: string;
  navItems: NavItem[];
  userNavItems: NavItem[];
  actionButtons: ActionButton[];
}

// Type guard (Sigue funcionando)
export const hasSubmenu = (item: NavItem): item is SubmenuItem => {
  return 'submenu' in item && Array.isArray(item.submenu) && item.submenu.length > 0;
};