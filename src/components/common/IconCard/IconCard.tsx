// Card con icono arriba
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";


interface IconCardProps {
  title: string;
  description: string | React.ReactNode;
  icon: SvgIconComponent;
}

export const IconCard: React.FC<IconCardProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <Card
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        textAlign: "center",
        height: "100%",
      }}
    >
      <Icon sx={{ color: "primary.main", fontSize: 60, mb: 2 }} />
      <CardContent sx={{ flexGrow: 1, p: 0 }}>
        <Typography variant="h5" color="primary.main" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};