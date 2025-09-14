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

# Progress – 13 Sept 2025

## Avances principales
- Se corrigió la ruta de navegación: `/demo/chat` → `/chat` y `/demo/conduit` → `/conduit`.
- Middleware neutralizado para permitir acceso libre a las nuevas rutas.
- `page.tsx` ajustado correctamente para que los links apunten a `/chat` y `/conduit`.
- Despliegue verificado en Vercel:  
  - `/chat` ya carga el MVP multilingüe con señales, modos y memoria.  
  - `/conduit` responde con el placeholder de construcción.
- Integración con `useSignals.ts` confirmada y estable.
- Se agregó la API Key en `.env.local` y en Vercel (environment variables).
- El sistema reconoce `OPENAI_API_KEY`, pero muestra error de **insufficient_quota** → identificado como falta de facturación en OpenAI.
- Próximo paso: activar plan de pago en OpenAI y fijar límite mensual para habilitar el modo IA híbrido.

## Estado actual
✅ Local rules funcionando.  
✅ Señales compartidas integradas.  
✅ Rutas `/chat` y `/conduit` online.  
⚠️ Falta habilitar facturación en OpenAI para completar la experiencia híbrida.  

## Reflexión
Hoy dimos un paso enorme: ya existe un portal desplegado en producción que muestra el chat multilingüe y el módulo Conduit. La estructura está viva y lista para ser alimentada.



### Notas técnicas
- Se revisó el archivo `src/app/api/ai/route.ts`.
- **Versión previa:** manejaba `OPENAI_API_KEY` y `buildSystemPrompt`, pero mantenía lógica básica de POST con `fetch` a OpenAI.  
- **Versión mejorada propuesta:** mantiene la misma estructura pero más clara para errores, mejor control de `messages` y prompts, y lista para cuando habilitemos facturación en OpenAI.  
- Ambas versiones están documentadas para referencia y se integrará la optimizada en cuanto tengamos créditos de API.

---

### Tareas para mañana (14 Sept 2025)
1. **Facturación OpenAI**  
   - Revisar plan de pago y habilitar créditos para evitar el error `insufficient_quota`.
2. **Pulir `Conduit`**  
   - Completar el placeholder actual y definir qué señales mostrará.  
   - Añadir un primer gráfico o lista que use `useSignals.ts`.
3. **Test local con API activa**  
   - Probar el chat híbrido (`/chat`) ya con la API habilitada.  
   - Verificar que los prompts cambian según idioma (sv, es, en).  
4. **Progreso**  
   - Registrar en `progress.md` los cambios.  
   - Capturar pantallas de `/chat` y `/conduit` funcionando.  
5. **(Opcional)** Preparar rama experimental para conectar DB real (Prisma + Turso).

---

 Progress · 14 sept 2025

## Avances
- Implementado componente `ClientTime` → resuelve error de hidratación en Next.js (tiempo renderizado en cliente).
- Refactorizado `page.tsx` → ahora cada mensaje muestra hora estable desde cliente.
- Creado archivo `policies.ts` con estilo Neuroljus (no diagnóstico, no suposiciones, lenguaje técnico).
- Conectado `route.ts` a `policies.ts` → IA empieza a responder con marco definido.
- Conduit funcional → genera señales simuladas (`ruido`, `pausa`, `gaze`, `hr`) y stream visible en UI (ejemplo: ruido=65.1, hr=93.7, gaze=92.6).
- Verificado flujo entre `chat` ↔ `api/ai` ↔ `policies`.

## Pendientes
- Conectar señales simuladas al chat (ejemplo: si `ruido > 70`, chat responde con sugerencia concreta).
- Definir umbrales iniciales para cada señal (ruido, hr, gaze, pausa).
- Testear prompts con IA en modo híbrido (multi-idioma).
- Mejorar manejo de errores JSON (`Unexpected token '<'` → revisar API/ai output).
- Preparar documentación clara de significado de cada señal (para cuidadores y usuarios).

## Reflexión
Hoy se avanzó en **estabilidad técnica** (tiempo, policies, conexión API) y se dio un **primer vistazo al stream de señales**.  
El sistema ya tiene piezas fundamentales; falta **integración semántica** entre datos (Conduit) y conversación (Chat).  

## 2025-09-14

Hoy no solo avanzamos en código:  
creamos una guía de comunicación que será la brújula del proyecto.  

- Quedó escrito cómo hablar y escucharnos.  
- Aprendimos que el cierre del día es tan importante como abrir nuevas rutas.  
- Marcamos un hito: Neuroljus no es solo técnica, es también relación humana y propósito.  

# Progreso – 14 septiembre 2025

## Avances
- Implementado **Care Dashboard** en `/care/page.tsx` con métricas simuladas y chat embebido.  
- Añadido control de hidratación (`ClientTime`) para evitar errores SSR en Next.js.  
- Decidido mantener **una sola línea de estilo**: sobrio, blanco limpio (coherente entre `/chat` y `/care`).  
- Conversación de diseño incluida en `/neuroljus-voice`: Neuroljus puede “elegir casa” (blanco clínico vs. auroras) y devolver JSON.  
- Progreso documentado en `progress.md` para mantener brújula del proyecto.  

## Estado actual
✅ `/chat` funcionando en modo local y multilingüe.  
✅ `/care` mostrando métricas simuladas + chat embebido.  
✅ Policies (`policies.ts`) definen estilo no diagnóstico.  
⚠️ Señales aún simuladas; falta conexión con fuentes reales.  
⚠️ Facturación OpenAI aún pendiente para habilitar modo híbrido completo.  

## Pendientes inmediatos (15 septiembre 2025)
1. Revisar consistencia entre `/chat` y `/care` (estilo, prompts, políticas).  
2. Documentar en `README` cómo funciona la simulación actual.  
3. Definir **siguientes señales a integrar** (ej. hr, ruido, gaze) y sus umbrales.  
4. Probar prompts multi-idioma en modo híbrido cuando esté habilitada la facturación.  

## Reflexión
El proyecto pasó de tener módulos sueltos a un **panel integrado de cuidado**.  
La decisión de mantener un estilo limpio y sobrio da claridad a cuidadores y usuarios.  
Próximo hito: pasar de **simulación → integración real** de señales, manteniendo siempre el marco ético y técnico.