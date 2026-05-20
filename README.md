# Loteplan Frontend

Este repositorio contiene la aplicación frontend de `Loteplan`, construida con React, TypeScript y Vite.

## Descripción general

- Framework principal: `React 19`
- Compilador/bundler: `Vite`
- UI: `@mui/material`, `styled-components`, `swiper`
- Gestión de datos: `axios`, `@tanstack/react-query`
- Validación: `formik` + `yup`
- Integración PDF/QR: `react-pdf`, `pdf-lib`, `qrcode`

## Requisitos

- Node.js 18+ recomendado
- npm 10+ (o compatible con el ecosistema de Node)

## Instalación

1. Abre una terminal en la carpeta del proyecto:

```bash
cd Loteplan
```

2. Instala dependencias:

```bash
npm install
```

## Comandos disponibles

- `npm run dev`
  - Inicia el servidor de desarrollo en modo HMR.
- `npm run build`
  - Construye la aplicación para producción.
- `npm run preview`
  - Previsualiza la versión de producción localmente.
- `npm run lint`
  - Ejecuta ESLint sobre el código fuente.

## Estructura de carpetas

```
Loteplan/
├─ public/                # Archivos estáticos y recursos públicos
│  ├─ assets/
│  ├─ Comofunciona/
│  ├─ Home/
│  ├─ navbar/
│  └─ nosotros/
├─ src/                   # Código fuente principal
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ index.css
│  ├─ core/               # Lógica central, servicios y auth
│  │  ├─ api/
│  │  │  ├─ httpService.ts
│  │  │  └─ services/     # Servicios HTTP por dominio
│  │  ├─ auth/
│  │  ├─ config/
│  │  ├─ context/
│  │  ├─ theme/
│  │  └─ types/
│  ├─ features/           # Páginas y hooks por funcionalidad
│  │  ├─ admin/
│  │  ├─ auth/
│  │  ├─ client/
│  │  └─ public/
│  ├─ layouts/            # Layouts y navegación
│  │  ├─ admin/
│  │  ├─ client/
│  │  └─ Footer.tsx
│  ├─ routes/             # Enrutamiento de la aplicación
│  └─ shared/             # Componentes comunes, hooks y utilidades
│     ├─ components/
│     ├─ hooks/
│     └─ utils/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ eslint.config.js
└─ README.md
```

### Carpeta `src/core`

- `api/`: cliente HTTP y servicios para recursos como auth, contratos, pagos, etc.
- `auth/`: utilidades y control de acceso.
- `config/`: variables de entorno y configuración.
- `context/`: providers de React para auth y snackbar.
- `theme/`: estilos globales.
- `types/`: DTOs y tipos compartidos.

### Carpeta `src/features`

- `admin/`: páginas y hooks exclusivos para la administración.
- `auth/`: páginas y lógica de login, registro y seguridad.
- `client/`: páginas y hooks para usuarios clientes.
- `public/`: páginas públicas como `Home`, `ComoFunciona` y `Nosotros`.

### Carpeta `src/layouts`

- Layouts principales para admin y cliente.
- Componentes de navegación y estructura de páginas.

### Carpeta `src/shared`

- Componentes de UI reutilizables.
- Hooks personalizados (`useConfirmDialog`, `useModal`, `useSnackbar`).
- Utilidades comunes.

## Alias de importación

El archivo `vite.config.ts` define un alias para `@`:

```ts
alias: {
  '@': path.resolve(__dirname, './src'),
}
```

Esto permite importaciones como:

```ts
import { useSnackbar } from '@/shared/hooks/useSnackbar'
```

## Notas de build

- `npm run build` ejecuta primero `tsc -b` y luego `vite build`.
- El bundle está configurado para separar chunks de vendor y librerías pesadas como React, MUI, Formik/Yup y PDF/QR.

## Buenas prácticas

- Usa `npm run lint` antes de confirmar cambios.
- Mantén los tipos en `src/core/types` actualizados cuando agregues nuevos servicios.
- Usa los hooks de `src/shared/hooks` para lógica de UI reusable.

## Recursos útiles

- Vite: https://vitejs.dev/
- React: https://react.dev/
- MUI: https://mui.com/
- React Router: https://reactrouter.com/
- React Query: https://tanstack.com/query


> Loteplan es una Aplicacion Web con un sistema de crowdfunding que permite a inversores participar mediante inversiones directas, pujas en subastas, y suscripciones mensuales con gestión automatizada de pagos.

### 🏠 [Homepage](http://localhost:5173/)

## Install

```sh
npm install
```

## Usage

```sh
npm run dev
```

## 📞 Contacto

- **Repositorio:** [GitHub - Loteplan](https://github.com/Brisa-Ol/Loteplan)
- **Issues:** [Reportar Bug](https://github.com/Brisa-Ol/Loteplan/issues)


## Show your support

Give a ⭐️ if this project helped you!

***

- React: https://react.dev/
- MUI: https://mui.com/
- React Router: https://reactrouter.com/
- React Query: https://tanstack.com/query
