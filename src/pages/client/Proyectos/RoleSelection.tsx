// src/pages/Proyectos/RoleSelection.tsx
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Savings as SavingsIcon, AttachMoney as AttachMoneyIcon } from "@mui/icons-material";
import { PageContainer, PageHeader } from "../../../components/common";
// 1. Eliminamos el import de useAuth
import { RoleCard } from "./components/RoleCard";

interface Role {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  isPrimary: boolean;
}

const roles: Role[] = [
  {
    key: "ahorrista",
    title: "Ahorrista",
    description: "Comprá tu lote en cuotas sin interés y construí tu casa propia.",
    icon: <SavingsIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    route: "/proyectos/ahorrista",
    isPrimary: false,
  },
  {
    key: "inversionista",
    title: "Inversionista",
    description: "Invertí en terrenos y obtené retornos con la revalorización del capital.",
    icon: <AttachMoneyIcon sx={{ fontSize: 40, color: "white" }} />,
    route: "/proyectos/inversionista",
    isPrimary: true,
  },
];

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  // 2. Eliminamos la llamada al hook useAuth

  // 3. Lógica simplificada: Navegación directa
  const handleCardClick = (route: string) => {
    navigate(route); 
  };

  return (
    <PageContainer maxWidth="md">
      <Box textAlign="center">
        <PageHeader
          title="Elige tu camino financiero"
          subtitle="Selecciona el rol que mejor se adapte a tus metas y comienza a invertir hoy."
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={4}
          justifyContent="center"
          alignItems="stretch"
          sx={{ mt: 4 }}
        >
          {roles.map((role) => (
            <RoleCard
              key={role.key}
              role={role}
              onCardClick={() => handleCardClick(role.route)}
            />
          ))}
        </Stack>
      </Box>
    </PageContainer>
  );
};

export default RoleSelection;