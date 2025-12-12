# Guía de Implementación - Visualización de Lotes con Imágenes

## Resumen Ejecutivo

Se ha implementado un sistema completo de visualización de lotes con sus imágenes asociadas para pantalla de cliente. El sistema es **responsive**, **accesible** y maneja casos de error automáticamente.

## Cambios Realizados

### 1. Componentes Nuevos Creados

#### `src/pages/client/Lotes/components/LoteCard.tsx`
- Tarjeta individual de lote con imagen principal
- Muestra estado de la subasta (Vendido, Activo, Próxima)
- Integra botón de favorito
- Información del precio
- Acceso rápido a galería completa de imágenes

#### `src/pages/client/Lotes/components/GaleriaImagenesLote.tsx`
- Galería interactiva de imágenes por lote
- Miniaturas seleccionables
- Modal de visualización expandida
- Navegación con flechas entre imágenes
- Soporte para descripciones de imágenes
- Manejo automático de errores de carga

#### `src/pages/client/Lotes/components/index.ts`
- Índice para exportación limpia de componentes

### 2. Componentes Modificados

#### `src/pages/client/Lotes/ListaLotesProyecto.tsx`
**Cambios principales:**
- ✅ Ahora permite visualización para usuarios no autenticados
- ✅ Refactorizado para usar componente `LoteCard`
- ✅ Integración mejorada de galería de imágenes
- ✅ Query actualizada: `enabled: !!idProyecto` (sin restricción de autenticación)
- ✅ Mejor manejo de estados de carga y error

#### `src/pages/client/Lotes/DetalleLote.tsx`
- ✅ Integración de `GaleriaImagenesLote` para mejor visualización
- ✅ Reemplazo de galería básica por componente avanzado

## Flujo de Datos

```
┌─────────────────────────────────┐
│   DetalleProyecto.tsx           │
│   (Página de Proyecto)          │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│  ListaLotesProyecto.tsx         │
│  - Obtiene lotes por proyecto   │
│  - LoteService.getByProject()   │
└──────────────┬──────────────────┘
               │
          ┌────┴────┐
          ↓         ↓
    ┌──────────┐  ┌──────────┐
    │LoteCard  │  │LoteCard  │ ... (Grid de 1-3 cols)
    │  .tsx    │  │  .tsx    │
    └─────┬────┘  └─────┬────┘
          │              │
          └──────┬───────┘
                 ↓
    ┌─────────────────────────────┐
    │ GaleriaImagenesLote.tsx     │
    │ - Miniaturas               │
    │ - Modal expandible         │
    │ - Navegación entre imágenes│
    └─────────────────────────────┘
```

## Visualización en Diferentes Pantallas

### 📱 Mobile (< 600px)
```
┌─────────────────────┐
│      Lote 1         │
│   [Imagen]          │
│   Nombre            │
│   ○ Miniaturas      │
│   USD Precio        │
│   [Pujar Ahora]     │
└─────────────────────┘
(1 columna)
```

### 💻 Tablet (600px - 960px)
```
┌──────────────┐  ┌──────────────┐
│   Lote 1     │  │   Lote 2     │
│  [Imagen]    │  │  [Imagen]    │
│  Nombre      │  │  Nombre      │
│  ○ Galería   │  │  ○ Galería   │
│  Precio      │  │  Precio      │
│  [Pujar]     │  │  [Pujar]     │
└──────────────┘  └──────────────┘
(2 columnas)
```

### 🖥️ Desktop (> 960px)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Lote 1     │  │  Lote 2     │  │  Lote 3     │
│ [Imagen]    │  │ [Imagen]    │  │ [Imagen]    │
│ Nombre      │  │ Nombre      │  │ Nombre      │
│ ○ Galería   │  │ ○ Galería   │  │ ○ Galería   │
│ Precio      │  │ Precio      │  │ Precio      │
│ [Pujar]     │  │ [Pujar]     │  │ [Pujar]     │
└─────────────┘  └─────────────┘  └─────────────┘
(3 columnas)
```

## Características Implementadas

### 🖼️ Galería de Imágenes
- **Miniaturas**: Todas las imágenes disponibles en horizontal scrolleable
- **Modal expandido**: Click en cualquier miniatura abre galería grande
- **Navegación**: Flechas anterior/siguiente o click en miniaturas
- **Indicador**: Muestra "Imagen X de Y"
- **Descripción**: Muestra descripción si existe

### 🎨 Estados Visuales
```
┌─ Estado: VENDIDO ─┐
│ [Imagen gris]      │
│ "Vendido"          │
│ [Ver Detalles]     │
└────────────────────┘

┌─ Estado: ACTIVO ─┐
│ [Imagen color]     │
│ "Activo" ✓         │
│ [Pujar Ahora]      │
└────────────────────┘

┌─ Estado: PRÓXIMA ─┐
│ [Imagen azulada]   │
│ "Próxima" ⏰       │
│ [Ver Detalles]     │
└────────────────────┘
```

### 🔐 Control de Acceso
| Acción | Usuario Logueado | Visitante |
|--------|------------------|-----------|
| Ver lotes | ✅ Sí | ✅ Sí |
| Ver imágenes | ✅ Sí | ✅ Sí |
| Ver precios | ✅ Sí | ✅ Sí |
| Pujar | ✅ Sí | ❌ No (Redirige a login) |
| Favorito | ✅ Sí | ❌ No |

### ⚡ Performance
- Lazy loading de imágenes
- Resolución automática de URLs
- Manejo eficiente de errores
- Fallbacks automáticos a placeholders

## Requisitos Backend

### Endpoint: `GET /lotes/proyecto/:id`
**Response esperado:**
```json
[
  {
    "id": 1,
    "nombre_lote": "Lote A - Sector Premium",
    "precio_base": 50000,
    "estado_subasta": "activa",
    "id_proyecto": 5,
    "proyecto": {
      "id": 5,
      "nombre_proyecto": "Proyecto Residencial"
    },
    "imagenes": [
      {
        "id": 101,
        "url": "/uploads/imagenes/lote-1-img-1.jpg",
        "descripcion": "Vista frontal",
        "es_principal": true,
        "activo": true
      },
      {
        "id": 102,
        "url": "/uploads/imagenes/lote-1-img-2.jpg",
        "descripcion": "Vista lateral",
        "activo": true
      }
    ]
  }
]
```

## Archivos Afectados

### Creados:
```
src/pages/client/Lotes/
├── components/
│   ├── GaleriaImagenesLote.tsx  (Componente de galería)
│   ├── LoteCard.tsx            (Tarjeta de lote)
│   └── index.ts                (Índice)
├── README.md                    (Documentación)
```

### Modificados:
```
src/pages/client/Lotes/
├── ListaLotesProyecto.tsx     (Refactorizado)
└── DetalleLote.tsx            (Integración de galería)
```

## Pruebas Recomendadas

### Checklist Visual
- [ ] Lotes se muestran en grid responsivo
- [ ] Imágenes cargan correctamente
- [ ] Miniaturas son seleccionables
- [ ] Modal de galería abre y cierra
- [ ] Navegación entre imágenes funciona
- [ ] Estados visuales son correctos
- [ ] Botón "Pujar" está habilitado solo en estado "activa"
- [ ] Usuario no logueado ve aviso de login

### Checklist Funcional
- [ ] `LoteService.getByProject()` retorna imagenes
- [ ] URLs de imagenes se resuelven correctamente
- [ ] Placeholders se muestran si hay error
- [ ] Favoritos funcionan
- [ ] Modal de puja se abre correctamente

## Ejemplos de Uso

### En una página de Proyecto:
```tsx
import { ListaLotesProyecto } from '../Lotes/ListaLotesProyecto';

<CustomTabPanel value={tabValue} index={2}>
  <Typography variant="h6">Lotes Disponibles</Typography>
  <ListaLotesProyecto idProyecto={projectId} />
</CustomTabPanel>
```

### En página de Detalle de Lote:
```tsx
import { GaleriaImagenesLote } from './components/GaleriaImagenesLote';

<Box mb={4}>
  <GaleriaImagenesLote 
    imagenes={lote.imagenes} 
    nombre_lote={lote.nombre_lote}
  />
</Box>
```

## Notas Importantes

1. **Resolución de URLs**: El servicio `ImagenService.resolveImageUrl()` maneja automáticamente rutas relativas y absolutas.

2. **Fallback de Imágenes**: Asegúrate de tener `/public/assets/placeholder-lote.jpg` en tu proyecto.

3. **Respaldo de Backend**: Si el backend no retorna imágenes, aparecerá el placeholder automáticamente.

4. **Descripciones**: Las descripciones de imágenes se muestran en el modal si existen.

5. **Estados de Subasta**: Solo se puede pujar en subastas con estado `"activa"`.

## Soporte Técnico

**Errores comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| Imágenes no cargan | URL mal formada | Verificar `ImagenService.resolveImageUrl()` |
| No aparecen lotes | Backend no retorna datos | Verificar endpoint `/lotes/proyecto/:id` |
| Galería vacía | No hay imagenes en BD | Asignar imágenes al lote en admin |
| Botón pujar inactivo | Usuario no autenticado | Mostrar aviso de login |
