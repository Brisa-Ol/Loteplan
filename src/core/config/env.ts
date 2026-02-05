
class EnvConfig {
  // API
  readonly apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  readonly apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL || 'http://localhost:3000';

  // Auth
  readonly authTokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token';

  // App
  readonly appName = import.meta.env.VITE_APP_NAME || 'Sistema de Gestión';
  readonly appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
  readonly appEnv = import.meta.env.VITE_APP_ENV || 'development';

  // Notificaciones
  readonly snackbarDuration = Number(import.meta.env.VITE_SNACKBAR_DURATION) || 4000;
  readonly enableDebugLogs = import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true';

  // Queries
  readonly queryRefetchInterval = Number(import.meta.env.VITE_QUERY_REFETCH_INTERVAL) || 30000;
  readonly queryStaleTime = Number(import.meta.env.VITE_QUERY_STALE_TIME) || 60000;

  // Archivos
  readonly maxFileSize = Number(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880; // 5MB
  readonly allowedKycFileTypes = import.meta.env.VITE_ALLOWED_KYC_FILE_TYPES?.split(',') ||
    ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  readonly maxImageSize = Number(import.meta.env.VITE_MAX_IMAGE_SIZE) || 10485760; // 10MB

  // Locale
  readonly defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'es-AR';
  readonly timezone = import.meta.env.VITE_TIMEZONE || 'America/Argentina/Buenos_Aires';
  readonly defaultCurrency = import.meta.env.VITE_DEFAULT_CURRENCY || 'ARS';

  // Feature Flags
  readonly maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  readonly enableRegistration = import.meta.env.VITE_ENABLE_REGISTRATION !== 'false';
  readonly enableSocialLogin = import.meta.env.VITE_ENABLE_SOCIAL_LOGIN === 'true';
  readonly enableDarkMode = import.meta.env.VITE_ENABLE_DARK_MODE !== 'false';

  // Performance
  readonly enableLazyLoading = import.meta.env.VITE_ENABLE_LAZY_LOADING !== 'false';
  readonly enableImageCompression = import.meta.env.VITE_ENABLE_IMAGE_COMPRESSION !== 'false';
  readonly defaultPageSize = Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 10;

  // Helpers
  get isDevelopment() {
    return this.appEnv === 'development';
  }

  get isProduction() {
    return this.appEnv === 'production';
  }

  /**
   * Valida que todas las variables críticas estén presentes
   */
  validate() {
    const required = ['VITE_API_BASE_URL'];
    const missing = required.filter(key => !import.meta.env[key]);

    if (missing.length > 0) {
      throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
    }
  }
}

export const env = new EnvConfig();

// Validar en desarrollo
if (env.isDevelopment) {
  try {
    env.validate();
  } catch (error) {
    console.error('❌ Error de configuración:', error);
  }
}