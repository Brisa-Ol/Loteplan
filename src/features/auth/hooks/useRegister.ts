import { useAuth } from "@/core/context/AuthContext";
import type { RegisterRequestDto } from "@/core/types/dto/auth.dto";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

// Definimos el esquema fuera del hook para evitar recrearlo en cada render
const validationSchema = Yup.object({
  nombre: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  apellido: Yup.string().min(2, "Mínimo 2 caracteres").required("Requerido"),
  email: Yup.string().email("Formato inválido").required("Requerido"),
  dni: Yup.string().matches(/^\d+$/, "Solo números").min(7, "Mínimo 7 dígitos").max(8, "Máximo 8 dígitos").required("Requerido"),
  nombre_usuario: Yup.string().min(4, "Mínimo 4 caracteres").required("Requerido"),
  numero_telefono: Yup.string().matches(/^\d+$/, "Solo números").min(10, "Mínimo 10 dígitos").required("Requerido"),
  contraseña: Yup.string().min(8, "Mínimo 8 caracteres").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Requiere mayúscula, minúscula y número").required("Requerida"),
  confirmPassword: Yup.string().oneOf([Yup.ref("contraseña")], "Las contraseñas no coinciden").required("Confirma tu contraseña"),
});

export const useRegister = () => {
  const navigate = useNavigate();
  const { register, isLoading, isInitializing, error, clearError, resendConfirmation } = useAuth();

  // Estados locales de UI
  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<{ loading: boolean; msg: string | null }>({ loading: false, msg: null });

  // Limpieza automática de errores
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);

  const formik = useFormik({
    initialValues: {
      nombre: "", apellido: "", email: "", dni: "",
      nombre_usuario: "", numero_telefono: "", contraseña: "", confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      clearError();
      // Mapeo explicito para limpiar campos extra (confirmPassword)
      const data: RegisterRequestDto = {
        nombre: values.nombre,
        apellido: values.apellido,
        email: values.email,
        contraseña: values.contraseña,
        dni: values.dni,
        nombre_usuario: values.nombre_usuario,
        numero_telefono: values.numero_telefono,
      };

      try {
        await register(data);
        setRegisteredEmail(values.email);
        setModalOpen(true);
      } catch (err) {
        // Error manejado por AuthContext
      }
    },
  });

  const handleResend = async () => {
    setResendStatus({ loading: true, msg: null });
    try {
      await resendConfirmation(registeredEmail);
      setResendStatus({ loading: false, msg: "Email reenviado correctamente." });
    } catch {
      setResendStatus({ loading: false, msg: "Error al reenviar. Intente nuevamente." });
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    navigate("/login");
  };

  return {
    formik,
    status: {
      isLoading,
      isInitializing,
      error,
      showPassword,
      modalOpen,
      registeredEmail,
      resendStatus
    },
    actions: {
      togglePassword: () => setShowPassword(!showPassword),
      closeModal: handleCloseModal,
      handleResend,
      navigateToLogin: () => navigate("/login")
    }
  };
};