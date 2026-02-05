// src/routes/index.ts

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CONFIRM_EMAIL: '/confirm-email',
  UNAUTHORIZED: '/unauthorized',

  // Rutas Públicas
  PUBLIC: {
    HOME: '/',
    COMO_FUNCIONA: '/como-funciona',
    NOSOTROS: '/nosotros',
    PREGUNTAS: '/preguntas',
  },

  // ✅ Proyectos (PÚBLICOS - Cualquiera puede ver)
  PROYECTOS: {
    SELECCION_ROL: '/proyectos/rol-seleccion',
    DETALLE: '/proyectos/:id', // ✅ Ahora es público
  },

  // Área Cliente
  CLIENT: {
    DASHBOARD: '/client/dashboard',
    FINANZAS: {
      PAGOS: '/client/finanzas/pagos',
      INVERSIONES: '/client/finanzas/inversiones',
      SUSCRIPCIONES: '/client/finanzas/suscripciones',
      PUJAS: '/client/finanzas/pujas',
      TRANSACCIONES: '/client/finanzas/transacciones',
      RESUMENES: '/client/finanzas/resumenes',
      PAGO_ESTADO: '/client/finanzas/pago-estado',
    },
    CUENTA: {
      PERFIL: '/client/perfil',
      KYC: '/client/verificacion',
      MENSAJES: '/client/mensajes',
      SEGURIDAD: '/client/seguridad',
      FAVORITOS: '/client/favoritos',
      CONTRATOS: '/client/contratos',
    },
    LOTES: {
      DETALLE: '/client/lotes/:id', // ✅ Este sigue protegido
    }
  },

  // Área Admin
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