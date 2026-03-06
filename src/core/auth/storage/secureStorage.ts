import { env } from "@/core/config/env";

class SecureStorage {
  private readonly TOKEN_KEY = env.authTokenKey;

  setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ Error guardando token:', error);
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  hasValidSession(): boolean {
    return this.getToken() !== null;
  }
}

export const secureStorage = new SecureStorage();