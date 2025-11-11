// Card para mostrar pasos numerados
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  image: string;
  imageHeight?: number;
}

export const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  description,
  image,
  imageHeight = 200,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        mx: { xs: 0, md: 2 },
        mb: { xs: 6, md: 0 },
        zIndex: 2,
        flex: 1,
      }}
    >
      {/* Círculo con número de paso */}
      <Box
        sx={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          backgroundColor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: 24,
          margin: "0 auto 16px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {stepNumber}
      </Box>

      {/* Card */}
      <Card
        sx={{
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box
          sx={{
            height: imageHeight,
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <CardContent
          sx={{
            flexGrow: 1,
            textAlign: "center",
            pt: 4,
            pb: 4,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}
          >
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};