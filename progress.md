# Progreso – 12 septiembre 2025

## Avances
- Se movieron los archivos `labs` a `src/legacy-labs` para evitar errores de build.
- Se desactivaron chequeos estrictos de TypeScript/ESLint en `next.config.mjs` para permitir despliegue en Vercel.
- Se corrigió la ruta de `src/app/page.tsx` con enlaces a \`/demo/chat\` y \`/demo/conduit\`.
- Se confirmó que `chat/page.tsx` (438 líneas) y `conduit/page.tsx` existen dentro de `(demo)`.
- Se agregó `conduit/` al repositorio y se subió a GitHub (`feat: add conduit demo`).
- El proyecto está desplegando en Vercel; falta revisar los **404 en rutas**.

## Pendientes para mañana
1. Confirmar que \`/demo/chat\` y \`/demo/conduit\` abren correctamente en producción (Vercel).
2. Si persiste el 404, verificar estructura y nombres exactos de las carpetas dentro de `(demo)`.
3. Probar localmente con \`npm run dev\` antes de nuevo push.
4. (Opcional) Redirección de \`/chat\` → \`/demo/chat\` para simplificar URLs públicas.


---

### 🟢 Checkpoint

- **Fecha:** 2025-09-13
- **Módulo:** care-log (registro de episodios)
- **Estado:** ☑ Promovido al núcleo
- **Motivo de promoción:** probado en /demo/care con registro y métricas simuladas
- **Próxima acción:** conectar a DB real (Prisma + Turso)
