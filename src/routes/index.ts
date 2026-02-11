export const ROUTES = {
  // --- Auth ---
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CONFIRM_EMAIL: '/confirm-email',
  UNAUTHORIZED: '/unauthorized',

  // --- Rutas Públicas ---
  PUBLIC: {
    HOME: '/',
    COMO_FUNCIONA: '/como-funciona',
    NOSOTROS: '/nosotros',
    PREGUNTAS: '/preguntas',
  },

  // --- Proyectos (Públicos) ---
  PROYECTOS: {
    SELECCION_ROL: '/proyectos/rol-seleccion',
    DETALLE: '/proyectos/:id',
  },

  // --- Área Cliente (Protegida) ---
  CLIENT: {
    DASHBOARD: '/client/dashboard',
    
    // Sub-sección Finanzas
    FINANZAS: {
      PAGOS: '/client/finanzas/pagos',
      INVERSIONES: '/client/finanzas/inversiones',
      SUSCRIPCIONES: '/client/finanzas/suscripciones',
      PUJAS: '/client/finanzas/pujas',
      TRANSACCIONES: '/client/finanzas/transacciones',
      RESUMENES: '/client/finanzas/resumenes',
      PAGO_ESTADO: '/client/finanzas/pago-estado', // Callback MP
    },

    // Sub-sección Cuenta
    CUENTA: {
      PERFIL: '/client/perfil',
      KYC: '/client/verificacion',
      MENSAJES: '/client/mensajes',
      SEGURIDAD: '/client/seguridad',
      FAVORITOS: '/client/favoritos',
      CONTRATOS: '/client/contratos',
    },

    // Sub-sección Lotes
    LOTES: {
      DETALLE: '/client/lotes/:id',
    }
  },

  // --- Área Admin (Protegida) ---
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    
    USUARIOS: {
      LISTA: '/admin/usuarios',
      KYC: '/admin/kyc',
      PERFIL: '/admin/perfil',
      CONFIGURACION: '/admin/configuracion',
    },
    
    PROYECTOS: {
      LISTA: '/admin/proyectos',
      PLANES_AHORRO: '/admin/suscripciones',
      INVERSIONES: '/admin/inversiones',
    },
    
    LOTES: {
      LISTA: '/admin/lotes',
      PAGOS: '/admin/lote-pagos',
      PUJAS: '/admin/pujas',
    },
    
    CONTRATOS: {
      PLANTILLAS: '/admin/plantillas',
      FIRMADOS: '/admin/firmados',
    },
    
    FINANZAS: {
      PAGOS: '/admin/pagos',
      TRANSACCIONES: '/admin/transacciones',
      RESUMENES: '/admin/resumenes',
    }
  }
};