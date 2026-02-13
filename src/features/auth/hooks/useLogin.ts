import { useAuth } from "@/core/context/AuthContext";
import { ROUTES } from "@/routes";
import { useFormik } from "formik";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";

type LocalErrorType = 'invalid_credentials' | 'account_not_activated' | 'session_expired' | 'generic';

export const useLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendConfirmation, clearError, isLoading, isInitializing, isAuthenticated, user, requires2FA, verify2FA, logout } = useAuth();

  // Estados locales
  const [localError, setLocalError] = useState<{ type: LocalErrorType; msg: string } | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Referencias y Historial
  const state = location.state as { from?: { pathname: string } | string; sessionExpired?: boolean };
  const from = state?.from ? (typeof state.from === 'string' ? state.from : state.from.pathname) : null;
  const vieneDeProyecto = from?.includes('/proyectos/');

  // 1. Detectar sesión expirada al montar
  useEffect(() => {
    if (state?.sessionExpired) {
      setIsSessionExpired(true);
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  // 2. Limpieza de errores al desmontar
  const clearErrorRef = useRef(clearError);
  useEffect(() => {
    clearErrorRef.current = clearError;
  }, [clearError]);

  useEffect(() => () => clearErrorRef.current?.(), []);

  // 3. Redirección automática
  useEffect(() => {
    if (!isInitializing && isAuthenticated && user && !requires2FA) {
      const destino = from && from !== ROUTES.PUBLIC.HOME
        ? from
        : (user.rol === 'admin' ? ROUTES.ADMIN.DASHBOARD : ROUTES.CLIENT.DASHBOARD);
      navigate(destino, { replace: true });
    }
  }, [isInitializing, isAuthenticated, user, requires2FA, navigate, from]);

  // Helper de errores
  const parseError = (err: any) => {
    console.error("Login Error:", err);
    let rawMsg = typeof err === 'string' ? err : err?.response?.data?.message || err?.message || "Error inesperado.";
    const msgLower = rawMsg.toLowerCase();
    
    if (msgLower.includes('credenciales') || msgLower.includes('401')) {
      setLocalError({ type: 'invalid_credentials', msg: "Credenciales incorrectas." });
    } else if (msgLower.includes('no activada') || msgLower.includes('verificar')) {
      setLocalError({ type: 'account_not_activated', msg: "Cuenta no activada." });
    } else if (msgLower.includes('sesión') || msgLower.includes('token')) {
      setLocalError({ type: 'session_expired', msg: "Sesión expirada." });
    } else {
      setLocalError({ type: 'generic', msg: rawMsg });
    }
  };

  // Formulario
  const formik = useFormik({
    initialValues: { identificador: "", password: "" },
    validationSchema: Yup.object({
      identificador: Yup.string().required("Ingresá tu email o usuario"),
      password: Yup.string().required("Ingresá tu contraseña"),
    }),
    onSubmit: async (values) => {
      setResendSuccess(false);
      setIsSessionExpired(false);
      setLocalError(null);
      try {
        await login({ identificador: values.identificador, contraseña: values.password });
      } catch (err) {
        parseError(err);
      }
    },
  });

  const handleResendEmail = async () => {
    setResendSuccess(false);
    try {
      await resendConfirmation(formik.values.identificador);
      setResendSuccess(true);
      setLocalError(null);
    } catch (e) { /* Error manejado globalmente o ignorado */ }
  };

  return {
    formik,
    status: {
      isLoading,
      isInitializing,
      isSessionExpired,
      resendSuccess,
      localError,
      requires2FA,
      showPassword,
      vieneDeProyecto,
      isAuthenticated // Añadido para mostrar alerta info
    },
    actions: {
      togglePassword: () => setShowPassword(!showPassword),
      handleResendEmail,
      verify2FA,
      logout,
      clearErrors: () => { clearError(); setLocalError(null); },
      closeSessionExpired: () => setIsSessionExpired(false),
      closeResendSuccess: () => setResendSuccess(false)
    }
  };
};