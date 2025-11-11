// src/components/layout/Navbar/Navbar.tsx
import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavbarMenu } from "../../../hook/useNavbarMenu";
import NavbarBase from "./NavbarBase";
import { Skeleton, AppBar, Toolbar, Container, Box } from "@mui/material";

/**
 * Componente principal del Navbar que decide qué mostrar según el estado de autenticación
 * - Muestra skeleton mientras carga
 * - Delega toda la lógica de menús al hook useNavbarMenu
 * - Usa un único componente base (NavbarBase) para todos los casos
 */
const Navbar: React.FC = () => {
  const { isLoading } = useAuth();
  const navbarConfig = useNavbarMenu();

  // Mostrar skeleton mientras carga
  if (isLoading) {
    return (
      <>
        <AppBar position="fixed" color="secondary" elevation={1}>
          <Container maxWidth="lg">
            <Toolbar 
              disableGutters 
              sx={{ 
                minHeight: { xs: 64, md: 70 },
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              {/* Logo skeleton */}
              <Skeleton variant="rectangular" width={150} height={40} />
              
              {/* Nav items skeleton (desktop) */}
              <Box sx={{ 
                display: { xs: "none", md: "flex" }, 
                gap: 2, 
                flex: 1, 
                justifyContent: "center" 
              }}>
                <Skeleton variant="text" width={80} height={40} />
                <Skeleton variant="text" width={120} height={40} />
                <Skeleton variant="text" width={90} height={40} />
              </Box>
              
              {/* Action buttons skeleton (desktop) */}
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
                <Skeleton variant="rounded" width={120} height={36} />
              </Box>

              {/* Menu icon skeleton (mobile) */}
              <Box sx={{ display: { xs: "flex", md: "none" } }}>
                <Skeleton variant="circular" width={32} height={32} />
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
        <Box sx={{ height: { xs: 64, md: 70 } }} />
      </>
    );
  }

  // Renderizar navbar con la configuración obtenida del hook
  return (
    <NavbarBase
      logoPath={navbarConfig.logoPath}
      homePath={navbarConfig.homePath}
      navItems={navbarConfig.navItems}
      userNavItems={navbarConfig.userNavItems}
      actionButtons={navbarConfig.actionButtons}
    />
  );
};

export default Navbar;