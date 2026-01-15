import type { SvgIconComponent } from "@mui/icons-material";

export interface NavSubItem {
  label: string;
  path?: string;
  icon?: SvgIconComponent | React.ElementType;
  action?: () => void;
  isDivider?: boolean;
  badge?: number;
}

export interface NavItem {
  label: string;
  path?: string;
  icon?: SvgIconComponent | React.ElementType;
  submenu?: NavSubItem[];
  badge?: number;
}