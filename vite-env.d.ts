/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ==========================================
  // 🔧 CONFIGURACIÓN DE API
  // ==========================================
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_PUBLIC_URL: string;

  // ==========================================
  // 🔐 AUTENTICACIÓN
  // ==========================================
  readonly VITE_AUTH_TOKEN_KEY: string;
  readonly VITE_TOKEN_EXPIRY_TIME?: string;

  // ==========================================
  // 🎨 CONFIGURACIÓN DE APP
  // ==========================================
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  // Podemos ser específicos con los valores permitidos aquí:
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';

  // ==========================================
  // 📱 UI / NOTIFICACIONES
  // ==========================================
  readonly VITE_SNACKBAR_DURATION: string; // "4000" (se convierte a number luego)
  readonly VITE_ENABLE_DEBUG_LOGS: string; // "true" | "false"

  // ==========================================
  // 🗺️ MAPAS & ANALYTICS (Opcionales)
  // ==========================================
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_SENTRY_DSN?: string;

  // ==========================================
  // 🔄 REACT QUERY (CACHE)
  // ==========================================
  readonly VITE_QUERY_REFETCH_INTERVAL: string;
  readonly VITE_QUERY_STALE_TIME: string;

  // ==========================================
  // 📁 ARCHIVOS & UPLOAD
  // ==========================================
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_KYC_FILE_TYPES: string; // "image/png,image/jpeg"
  readonly VITE_MAX_IMAGE_SIZE: string;

  // ==========================================
  // 🌐 LOCALIZACIÓN
  // ==========================================
  readonly VITE_DEFAULT_LOCALE: string;
  readonly VITE_TIMEZONE: string;
  readonly VITE_DEFAULT_CURRENCY: string;

  // ==========================================
  // 🧪 FEATURE FLAGS (BOOLEANOS COMO STRING)
  // ==========================================
  readonly VITE_MAINTENANCE_MODE: string;
  readonly VITE_ENABLE_REGISTRATION: string;
  readonly VITE_ENABLE_SOCIAL_LOGIN: string;
  readonly VITE_ENABLE_DARK_MODE: string;

  // ==========================================
  // 🚀 PERFORMANCE
  // ==========================================
  readonly VITE_ENABLE_LAZY_LOADING: string;
  readonly VITE_ENABLE_IMAGE_COMPRESSION: string;
  readonly VITE_DEFAULT_PAGE_SIZE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}