import { env } from "@/core/config/env";

/**
 * Metadata guardada junto al token para validaciones de seguridad
 */
interface TokenMetadata {
  timestamp: number;
  expiresIn: number;
  userAgent: string;
}

class SecureStorage {
  private readonly TOKEN_KEY = env.authTokenKey;
  private readonly TOKEN_METADATA_KEY = `${this.TOKEN_KEY}_meta`;

  /**
   * Guarda el token con metadata de seguridad (User-Agent y Timestamp)
   * @param token - El JWT recibido del backend
   */
  setToken(token: string): void {
    try {
      const metadata: TokenMetadata = {
        timestamp: Date.now(),
        // Usamos 55 min como seguridad antes de la hora típica de expiración del JWT
        expiresIn: 55 * 60 * 1000, 
        userAgent: navigator.userAgent, // Previene robo de sesión copiando LocalStorage a otro PC
      };

      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.TOKEN_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('❌ Error guardando token:', error);
    }
  }

  /**
   * Recupera el token validando expiración e integridad del navegador
   */
  getToken(): string | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const metadataStr = localStorage.getItem(this.TOKEN_METADATA_KEY);

      if (!token || !metadataStr) return null;

      const metadata: TokenMetadata = JSON.parse(metadataStr);

      // 1. Validación de Expiración
      if (Date.now() - metadata.timestamp > metadata.expiresIn) {
        this.clearToken();
        return null; // Sesión expirada
      }

      // 2. Validación de User-Agent (Detectar cambio de navegador/PC)
      if (metadata.userAgent !== navigator.userAgent) {
        console.warn('⚠️ Sesión invalidada: User-Agent diferente (posible robo de token)');
        this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      // Si el JSON está corrupto, limpiamos todo por seguridad
      this.clearToken();
      return null;
    }
  }

  /**
   * Elimina el token y su metadata (Logout)
   */
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_METADATA_KEY);
  }

  /**
   * Chequeo rápido de existencia de sesión
   */
  hasValidSession(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Devuelve milisegundos restantes de sesión válida (útil para mostrar timers en UI)
   */
  getTimeRemaining(): number {
    const metadataStr = localStorage.getItem(this.TOKEN_METADATA_KEY);
    if (!metadataStr) return 0;

    try {
      const metadata: TokenMetadata = JSON.parse(metadataStr);
      const remaining = metadata.expiresIn - (Date.now() - metadata.timestamp);
      return Math.max(0, remaining);
    } catch {
      return 0;
    }
  }
}

export const secureStorage = new SecureStorage();