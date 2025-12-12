// src/pages/Proyectos/RoleSelection.tsx (Limpio y Centralizado)
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Box, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Savings as SavingsIcon, AttachMoney as AttachMoneyIcon } from "@mui/icons-material";
import { PageContainer, PageHeader } from "../../../components/common";
import { useAuth } from "../../../context/AuthContext";
import { RoleCard } from "./components/RoleCard";
// ❗ 1. Importamos el componente limpio


// Esta interface ahora incluye la 'route' que el padre debe saber
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

// Componente principal (Ahora es el "inteligente")
const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // 👈 2. La lógica de Auth vive aquí

  // ❗ 3. LÓGICA CENTRALIZADA
  // Esta función decide QUÉ hacer cuando se hace clic en CUALQUIER tarjeta
  const handleCardClick = (route: string) => {
    if (isAuthenticated) {
      navigate(route);
    } else {
      navigate("/login");
    }
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
            // ❗ 4. Pasamos la lógica como prop
            <RoleCard
              key={role.key}
              role={role} // Le pasamos el 'role' (el componente usará title, desc, etc.)
              onCardClick={() => handleCardClick(role.route)} // Le decimos QUÉ HACER al hacer click
            />
          ))}
        </Stack>
      </Box>
    </PageContainer>
  );
};

// ❗ 5. No olvides el export default
export default RoleSelection;