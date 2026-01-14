// src/utils/secureStorage.ts

/**
 * Gestión segura de tokens con validación y expiración
 */
class SecureStorage {
  private readonly TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token';
  private readonly TOKEN_METADATA_KEY = `${this.TOKEN_KEY}_meta`;
  
  /**
   * Guarda token con metadata de seguridad
   */
  setToken(token: string): void {
    try {
      const metadata = {
        timestamp: Date.now(),
        expiresIn: 55 * 60 * 1000, // 55 minutos (antes de que expire el JWT de 1h)
        userAgent: navigator.userAgent, // Detectar cambios de navegador
      };
      
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.TOKEN_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error guardando token:', error);
    }
  }

  /**
   * Obtiene token solo si es válido
   */
  getToken(): string | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const metadataStr = localStorage.getItem(this.TOKEN_METADATA_KEY);
      
      if (!token || !metadataStr) return null;

      const metadata = JSON.parse(metadataStr);
      
      // Validar expiración
      if (Date.now() - metadata.timestamp > metadata.expiresIn) {
        this.clearToken();
        return null;
      }

      // Validar User-Agent (detectar robo de token)
      if (metadata.userAgent !== navigator.userAgent) {
        console.error('⚠️ Sesión comprometida: User-Agent diferente');
        this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      this.clearToken();
      return null;
    }
  }

  /**
   * Limpia tokens
   */
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_METADATA_KEY);
  }

  /**
   * Verifica si hay sesión válida
   */
  hasValidSession(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Obtiene tiempo restante de sesión (en ms)
   */
  getTimeRemaining(): number {
    const metadataStr = localStorage.getItem(this.TOKEN_METADATA_KEY);
    if (!metadataStr) return 0;

    const metadata = JSON.parse(metadataStr);
    const remaining = metadata.expiresIn - (Date.now() - metadata.timestamp);
    return Math.max(0, remaining);
  }
}

export const secureStorage = new SecureStorage();