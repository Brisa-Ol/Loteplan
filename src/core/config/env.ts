// src/core/config/env.ts

class EnvConfig {
  // API
  readonly apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  readonly apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL;

  // Auth
  readonly authTokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token';
  readonly sessionExpiredKey = import.meta.env.VITE_SESSION_EXPIRED_KEY || 'session_expired';

  // App
  readonly appName = import.meta.env.VITE_APP_NAME || 'Mi App';
  readonly appVersion = import.meta.env.VITE_APP_VERSION;
  readonly appEnv = import.meta.env.VITE_APP_ENV;

  // Notificaciones
  readonly snackbarDuration = Number(import.meta.env.VITE_SNACKBAR_DURATION) || 5000;
  readonly enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

  // Queries
  readonly queryRefetchInterval = Number(import.meta.env.VITE_QUERY_REFETCH_INTERVAL) || 0;
  readonly queryStaleTime = Number(import.meta.env.VITE_QUERY_STALE_TIME) || 300000;

  // Archivos
  readonly maxFileSize = Number(import.meta.env.VITE_MAX_FILE_SIZE) || 52428800; // 50MB
  readonly maxImageSize = Number(import.meta.env.VITE_MAX_IMAGE_SIZE) || 10485760; // 10MB
  readonly allowedKycFileTypes = import.meta.env.VITE_ALLOWED_KYC_FILE_TYPES?.split(',') ||
    ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  // Locale
  readonly defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'es-AR';
  readonly timezone = import.meta.env.VITE_TIMEZONE || 'America/Argentina/Buenos_Aires';
  readonly defaultCurrency = import.meta.env.VITE_DEFAULT_CURRENCY || 'ARS';

  // Performance & Network
  readonly uploadTimeout = Number(import.meta.env.VITE_UPLOAD_TIMEOUT) || 60000; // 👈 SOLUCIÓN AL ERROR
  readonly defaultPageSize = Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 10;
  readonly enableLazyLoading = import.meta.env.VITE_ENABLE_LAZY_LOADING === 'true';

  // Feature Flags
  readonly maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  readonly enableRegistration = import.meta.env.VITE_ENABLE_REGISTRATION === 'true';

  // Helpers
  get isDevelopment() { return this.appEnv === 'development'; }
  get isProduction() { return this.appEnv === 'production'; }

  validate() {
    const required = ['VITE_API_BASE_URL'];
    const missing = required.filter(key => !import.meta.env[key]);
    if (missing.length > 0) {
      throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
    }
  }
}

export const env = new EnvConfig();