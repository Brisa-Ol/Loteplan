// src/components/common/FavoriteButton/FavoriteButton.tsx
import React, { useState, useEffect } from "react";
import { IconButton, Tooltip, CircularProgress } from "@mui/material";
import { Favorite, FavoriteBorder } from "@mui/icons-material";

import { useAuth } from "../../../context/AuthContext";

interface FavoriteButtonProps {
  loteId: number;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ loteId }) => {
  const { isAuthenticated } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Verifica si el lote ya está en favoritos al cargar
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchStatus = async () => {
      try {
        const res = await Favorite(loteId);
        setIsFav(res.esFavorito);
      } catch (err) {
        console.error("Error verificando favorito:", err);
      }
    };
    fetchStatus();
  }, [loteId, isAuthenticated]);

  // ❤️ Toggle favorito / no favorito
  const handleToggle = async () => {
    if (!isAuthenticated) {
      alert("Tenés que iniciar sesión para agregar favoritos ❤️");
      return;
    }
    setLoading(true);
    try {
      const res = await toggleFavorito(loteId);
      setIsFav(res.agregado);
    } catch (err) {
      console.error("Error al cambiar favorito:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}>
      <span>
        <IconButton onClick={handleToggle} disabled={loading}>
          {loading ? (
            <CircularProgress size={20} />
          ) : isFav ? (
            <Favorite color="error" />
          ) : (
            <FavoriteBorder color="action" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};
