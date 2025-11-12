// src/components/layout/Navbar/NavbarBase.tsx (CORREGIDO)
import React, { useCallback, useMemo, useState } from "react";
import {
  AppBar, Box, Toolbar, Container, Button, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemText,
  Menu, MenuItem, Divider, MenuList, ListItemIcon
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import type { NavItem, ActionButton } from "./Navbar.types";
import { hasSubmenu } from "./Navbar.types";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";

// ══════════════════════════════════════════════════════════
// INTERFACES
// ══════════════════════════════════════════════════════════

interface NavbarBaseProps {
  logoPath: string;
  homePath: string;
  navItems: NavItem[];
  userNavItems: NavItem[];
  actionButtons: ActionButton[];
}

// ══════════════════════════════════════════════════════════
// SUBCOMPONENTES MEMOIZADOS
// ══════════════════════════════════════════════════════════

const Logo = React.memo<{
  src: string;
  onClick: () => void;
  isMobile?: boolean;
}>(({ src, onClick, isMobile = false }) => (
  <Box
    component="img"
    src={src}
    alt="Logo"
    onClick={onClick}
    sx={{
      height: isMobile ? 40 : { xs: 40, md: 50 },
      cursor: "pointer",
      mr: isMobile ? 0 : 2,
    }}
  />
));
Logo.displayName = "Logo";

const SubMenuItem = React.memo<{
  item: NavItem;
  onClose: () => void;
  onClick: (item: NavItem) => void;
}>(({ item, onClose, onClick }) => {
  if (item.isDivider) {
    return <Divider sx={{ my: 0.5 }} />;
  }

  const IconComponent = item.icon;

  return (
    <MenuItem
      onClick={() => {
        onClick(item);
        onClose();
      }}
      disabled={!item.path && !item.action}
    >
      {IconComponent && (
        <ListItemIcon sx={{ minWidth: "32px" }}>
          <IconComponent fontSize="small" />
        </ListItemIcon>
      )}
      <ListItemText>{item.label}</ListItemText>
    </MenuItem>
  );
});
SubMenuItem.displayName = "SubMenuItem";

const NavButton = React.memo<{
  item: NavItem;
  onClick: (item: NavItem) => void;
  navButtonSx: object;
  theme: any;
}>(({ item, onClick, navButtonSx, theme }) => {
  // ❗ Si es un divisor, no renderizamos nada (los divisores solo van en submenús)
  if (item.isDivider) return null; 

  const isMiCuentaButton = item.label === "Mi Cuenta" || item.label.includes("(Admin)");

  const buttonSx = isMiCuentaButton
    ? {
        ...navButtonSx,
        color: theme.palette.primary.contrastText,
        px: 2.5,
        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
          opacity: 1,
        },
      }
    : navButtonSx;

  if (hasSubmenu(item)) {
    return (
      <PopupState variant="popover" popupId={`popup-menu-${item.label}`}>
        {(popupState) => (
          <>
            <Button
              {...bindTrigger(popupState)}
              endIcon={<ArrowDropDownIcon />}
              variant={isMiCuentaButton ? "contained" : "text"}
              color={isMiCuentaButton ? "primary" : "inherit"}
              sx={buttonSx}
            >
              {item.label}
            </Button>
            <Menu
              {...bindMenu(popupState)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  minWidth: 180,
                },
              }}
            >
              <MenuList dense sx={{ p: 0 }}>
                {item.submenu.map((sub, index) => (
                  <SubMenuItem
                    key={sub.isDivider ? `divider-${index}` : sub.label}
                    item={sub}
                    onClose={popupState.close}
                    onClick={onClick}
                  />
                ))}
              </MenuList>
            </Menu>
          </>
        )}
      </PopupState>
    );
  }

  // Botón simple
  return (
    <Button
      onClick={() => onClick(item)}
      sx={navButtonSx}
      disabled={!item.path && !item.action}
    >
      {item.label}
    </Button>
  );
});
NavButton.displayName = "NavButton";

const MobileNavItem = React.memo<{
  item: NavItem;
  onClick: (item: NavItem) => void;
}>(({ item, onClick }) => {
  if (hasSubmenu(item)) {
    return (
      <Box>
        <ListItem disablePadding>
          <ListItemButton disabled>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: 600, fontSize: "1.1rem" }}
            />
          </ListItemButton>
        </ListItem>

        {item.submenu.map((sub, index) => {
          if (sub.isDivider) {
            return <Divider key={`divider-mob-${index}`} sx={{ my: 0.5 }} />;
          }
          const IconComponent = sub.icon;
          return (
            <ListItem key={sub.label} disablePadding sx={{ pl: 2 }}>
              <ListItemButton
                onClick={() => onClick(sub)}
                disabled={!sub.path && !sub.action}
              >
                {IconComponent && (
                  <ListItemIcon sx={{ minWidth: "40px" }}>
                    <IconComponent fontSize="small" />
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={sub.label}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: "1rem",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </Box>
    );
  }

  // ❗ Si es un divisor, no renderizamos nada (los divisores solo van en submenús)
  if (item.isDivider) return null;

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => onClick(item)}
        disabled={!item.path && !item.action}
      >
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontWeight: 600, fontSize: "1.05rem" }}
        />
      </ListItemButton>
    </ListItem>
  );
});
MobileNavItem.displayName = "MobileNavItem";

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════

const NavbarBase: React.FC<NavbarBaseProps> = ({
  logoPath,
  homePath,
  navItems,
  userNavItems,
  actionButtons,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Callbacks
  const handleDrawerToggle = useCallback((open: boolean) => {
    setDrawerOpen(open);
  }, []);

  const handleItemClick = useCallback(
    (item: NavItem) => {
      // No hacer nada si es un divisor (aunque no deberían llegar aquí)
      if (item.isDivider) return; 
      
      setDrawerOpen(false);
      if (item.action) {
        item.action();
      } else if (item.path) {
        navigate(item.path);
      }
    },
    [navigate]
  );

  const handleLogoClick = useCallback(() => {
    // ❗ CORRECCIÓN: Forzamos el tipo para que coincida con NavItem
    handleItemClick({ label: "Home", path: homePath } as NavItem);
  }, [homePath, handleItemClick]);

  // Estilos
  const navButtonSx = useMemo(
    () => ({
      color: theme.palette.text.primary,
      fontWeight: 600,
      textTransform: "none" as const,
      fontSize: "1rem",
      "&:hover": {
        opacity: 0.7,
        backgroundColor: "transparent",
      },
    }),
    [theme.palette.text.primary]
  );

  const allNavItems = useMemo(
    () => [...navItems, ...userNavItems],
    [navItems, userNavItems]
  );

  // Botones de Acción
  const ActionButtons = useCallback(
    ({ fullWidth = false }: { fullWidth?: boolean }) => {
      if (actionButtons.length === 0) return null;
      return (
        <>
          {actionButtons.map((btn) => (
            <Button
              key={btn.label}
              variant={btn.variant}
              color="primary"
              fullWidth={fullWidth}
              onClick={
                btn.path
                  // ❗ CORRECCIÓN: Forzamos el tipo para que coincida con NavItem
                  ? () => handleItemClick({ label: btn.label, path: btn.path } as NavItem)
                  : btn.action
              }
              sx={{
                fontSize: "1rem",
                textTransform: "none",
                px: 2,
              }}
            >
              {btn.label}
            </Button>
          ))}
        </>
      );
    },
    [actionButtons, handleItemClick]
  );

  return (
    <>
      <AppBar position="fixed" color="secondary" elevation={1}>
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: { xs: 64, md: 70 },
            }}
          >
            {/* Logo */}
            <Logo src={logoPath} onClick={handleLogoClick} />

            {/* Navegación Desktop (Centro) */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                gap: 2,
                flex: 1,
                justifyContent: "center",
              }}
            >
              {/* ❗ CORRECCIÓN DE KEY */}
              {navItems.map((item, index) => (
                <NavButton
                  key={item.isDivider ? `divider-${index}` : item.label}
                  item={item}
                  onClick={handleItemClick}
                  navButtonSx={navButtonSx}
                  theme={theme}
                />
              ))}
            </Box>

            {/* Navegación Usuario y Acciones (Derecha) */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                gap: 2,
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {/* ❗ CORRECCIÓN DE KEY */}
              {userNavItems.map((item, index) => (
                <NavButton
                  key={item.isDivider ? `divider-${index}` : item.label}
                  item={item}
                  onClick={handleItemClick}
                  navButtonSx={navButtonSx}
                  theme={theme}
                />
              ))}
              <ActionButtons />
            </Box>

            {/* Botón Menú Mobile */}
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => handleDrawerToggle(true)}
              sx={{ display: { xs: "flex", md: "none" } }}
              aria-label="Abrir menú"
            >
              <MenuIcon
                sx={{
                  fontSize: 32,
                  color: theme.palette.text.primary,
                }}
              />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer Mobile */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => handleDrawerToggle(false)}
      >
        <Box
          sx={{
            width: 280,
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            bgcolor: "secondary.main",
          }}
        >
          {/* Header del Drawer */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Logo src={logoPath} onClick={handleLogoClick} isMobile />
            <IconButton
              onClick={() => handleDrawerToggle(false)}
              aria-label="Cerrar menú"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Lista de Navegación Mobile */}
          <List sx={{ flex: 1 }}>
            {/* ❗ CORRECCIÓN DE KEY */}
            {allNavItems.map((item, index) => (
              <MobileNavItem
                key={item.isDivider ? `divider-${index}` : item.label}
                item={item}
                onClick={handleItemClick}
              />
            ))}
          </List>

          {/* Botones de Acción Mobile */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <ActionButtons fullWidth />
          </Box>
        </Box>
      </Drawer>

      {/* Espaciado para AppBar Fijo */}
      <Box sx={{ height: { xs: 64, md: 70 } }} />
    </>
  );
};

NavbarBase.displayName = "NavbarBase";

export default React.memo(NavbarBase);