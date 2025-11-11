// src/components/layout/AdminBreadcrumbs.tsx
import React from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useLocation, Link as RouterLink } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const routeLabels: Record<string, string> = {
  admin: "Panel de Admin",
  dashboard: "Dashboard",
  proyectos: "Proyectos",
  users: "Usuarios",
  kyc: "Verificaciones KYC",
};

export const AdminBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
      <Link component={RouterLink} to="/" color="inherit">
        Inicio
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const label = routeLabels[value] ?? value;

        return isLast ? (
          <Typography color="text.primary" key={to}>
            {label}
          </Typography>
        ) : (
          <Link component={RouterLink} to={to} color="inherit" key={to}>
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};
