import type { SvgIconComponent } from "@mui/icons-material";

export interface BaseNavItem {
  label: string;
  submenu?: NavItem[];
  isDivider?: boolean;
  icon?: SvgIconComponent;
}

export type NavItem =
  | (BaseNavItem & { path: string; action?: never })
  | (BaseNavItem & { action: () => void; path?: never })
  | (BaseNavItem & { submenu: NavItem[]; path?: never; action?: never });

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

// ✅ Type guard recomendado
export const hasSubmenu = (item: NavItem): item is Extract<NavItem, { submenu: NavItem[] }> => {
  return Array.isArray(item.submenu) && item.submenu.length > 0;
};
