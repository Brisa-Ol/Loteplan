import { useAuth } from "@/core/context/AuthContext";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

// Esquema estático fuera del componente
const validationSchema = Yup.object({
  email: Yup.string().email("Email inválido").required("Ingresá tu email"),
});

export const useForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  // Limpieza de errores al montar/desmontar
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema,
    onSubmit: async (values) => {
      clearError();
      try {
        await forgotPassword(values.email);
        setSuccessEmail(values.email);
      } catch (err) {
        // El error ya es manejado por el contexto Auth
      }
    },
  });

  return {
    formik,
    status: {
      isLoading,
      error,
      successEmail
    },
    actions: {
      handleBackToLogin: () => navigate("/login")
    }
  };
};