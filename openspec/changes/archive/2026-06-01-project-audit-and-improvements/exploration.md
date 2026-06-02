## Exploration: Proyecto Consolidados IEEC — Auditoría General y Propuestas de Mejora

### Current State

**Consolidados V2** es una plataforma 100% frontend (React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand) para analítica pedagógica. Procesa archivos Excel institucionales en un Web Worker, aplica lógica académica (promedios, estados, pesos inferidos) y despliega 8 reportes institucionales, visualizaciones (Chart.js), simulación "what-if" y exportación a Excel.

**Arquitectura actual:** Clean/domain-centric con tipos de dominio puros, servicios funcionales sin efectos, hooks con `useMemo` pipeline, micro-stores Zustand, y Web Worker para parsing pesado. Pruebas con Vitest + RTL con cobertura estricta (≥90% líneas, ≥80% branches).

**Fases completadas (ROADMAP.md):** Fases 10-13 (Charts, UI Overhaul, Reports Engine, Export & Print). Resta Fase 14 (System Verification & Release).

---

### Affected Areas

- `src/domain/types.ts` — Tipos compartidos; posible refactor para constantes mágicas y nuevos tipos
- `src/services/academicLogic.ts` — Lógica académica central; duplicación de detección de periodos evaluados
- `src/services/reportEngine.ts` — 8 reportes puros; umbral 3.0 hardcodeado
- `src/services/evolutionLogic.ts` — Único servicio sin cobertura de tests
- `src/components/dashboard/AnalysisTab.tsx` — 675 líneas, monolito con múltiples responsabilidades
- `src/components/dashboard/VolatilityTab.tsx` — useEffect mutando estado global (anti-patrón React)
- `src/components/dashboard/TutorsTab.tsx` — mismo anti-patrón useEffect
- `src/components/dashboard/HeatmapTab.tsx` — inline `<style>` tag en vez de Tailwind utilities
- `src/store/useDashboardStore.ts` — Persiste `estudiantes` completos en IndexedDB
- `src/services/excelWorkerClient.ts` — Termina/crea worker en cada parseo
- `src/hooks/useAnalysisPipeline.ts` — Pipeline de análisis (filtros, agrupación, ordenamiento)
- `src/index.css` — Tema CSS custom con `@utility` directives (redundancia con Tailwind)
- `index.html` — `lang="en"` incorrecto para app en español
- `openspec/config.yaml` — Archivo faltante en la estructura OpenSpec

---

### Hallazgos / Issues Identificados

#### Arquitectura y Calidad de Código

| # | Issue | Tipo | Severidad |
|---|-------|------|-----------|
| A1 | `AnalysisTab.tsx` monolítico (675 líneas) — render, filtros, simulación, tabla, expansión de áreas | Deuda técnica | Alta |
| A2 | `useEffect` mutando estado global en `VolatilityTab` y `TutorsTab` (`setGlobalGroup`) — causa renders inesperados | Bug potencial | Alta |
| A3 | Umbral `3.0` hardcodeado en ~8 lugares (reportEngine.ts, SummaryTab.tsx, KPIs, etc.) en vez de constante compartida | Deuda técnica | Media |
| A4 | Lógica de detección de periodos evaluados duplicada en 3 archivos (`academicLogic.ts`, `VolatilityTab.tsx`, `useReportsLogic.ts`) | Deuda técnica | Media |
| A5 | `useDashboardStore` persiste `estudiantes` (potencialmente miles) en IndexedDB vía Zustand persist | Performance | Media |
| A6 | `excelWorkerClient.ts` termina y recrea el Worker en cada parseo, perdiendo la ventaja de reuso | Performance | Baja |
| A7 | `HeatmapTab.tsx` usa inline `<style>` tag en vez de Tailwind utilities o CSS module | Deuda técnica | Baja |
| A8 | Redundancia entre Tailwind `@theme` y CSS custom properties con `@utility` directives | Deuda técnica | Baja |
| A9 | `toFixed(2)` extensivo sin manejo de precision edge cases (ej. 1.005 → "1.00" no "1.01") | Bug potencial | Baja |
| A10 | No hay constantes compartidas para `PASSING_GRADE` (está en academicLogic.ts pero otros módulos hardcodean `3.0`) | Deuda técnica | Media |
| A11 | `useDashboardStore` usa `JSON.parse(JSON.stringify(...))` para deep clone de `subjectWeights` | Deuda técnica | Baja |
| A12 | `openspec/config.yaml` no existe — estructura incompleta del workflow SDD | Proceso | Media |

#### UI/UX

| # | Issue | Tipo | Severidad |
|---|-------|------|-----------|
| U1 | `index.html` `lang="en"` cuando toda la app está en español | Accesibilidad | Alta |
| U2 | Lazy loading de tabs muestra solo texto "Cargando módulo..." sin skeleton | UX | Media |
| U3 | Iconos emoji/unicode sin `aria-label` (↕️ ⬇️ ⬆️ 🔗 📋 ▶️ etc.) | Accesibilidad | Alta |
| U4 | Carga de config.json falla silenciosamente si el JSON es inválido (solo console.error) | UX | Media |
| U5 | Selector de grupo duplicado en Header y dentro de tabs — puede confundir | UX | Baja |
| U6 | Sin feedback visual al copiar URL de simulación (solo `alert()` nativo) | UX | Media |
| U7 | Print CSS oculta TODOS los botones/selects globalmente — puede esconder controles necesarios | UX | Baja |
| U8 | Tema oscuro cambia con `data-theme` en `<html>` pero los report previews tienen CSS complejo para re-theme | Mantenibilidad | Media |

#### Testing

| # | Issue | Tipo | Severidad |
|---|-------|------|-----------|
| T1 | `domain/types.test.ts` solo testea TypeScript compilation, no comportamiento real | Testing | Baja |
| T2 | `evolutionLogic.ts` (único servicio) no tiene archivo de tests | Testing | Media |
| T3 | No hay tests E2E para flujo completo (upload → parse → analyze → export) | Testing | Media |
| T4 | Coverage thresholds no validan tests de componentes (no hay umbrales para branches en tests de UI) | Testing | Media |
| T5 | `evolutionLogic.ts` no tiene cobertura (0%) — no hay test file en `src/services/` | Testing | Media |

---

### Approaches

1. **Refactor por Capas** — Dividir `AnalysisTab.tsx` en submódulos, extraer constantes, eliminar useEffect anti-patrón, centralizar lógica duplicada
   - Pros: Reduce complejidad, elimina bugs latentes, mejora testabilidad
   - Cons: Requiere refactor cuidadoso para no romper funcionalidad existente
   - Effort: **Medium**

2. **Mejoras de Accesibilidad y UX** — Corregir `lang="es"`, agregar aria-labels, skeletons para lazy loading, feedback visual
   - Pros: Impacto directo en usuarios, bajo riesgo de regresión
   - Cons: Cambios puramente cosméticos (excepto lang que es crítico)
   - Effort: **Medium**

3. **Cobertura de Testing** — Agregar tests para `evolutionLogic.ts`, reemplazar `types.test.ts` con tests significativos, agregar E2E
   - Pros: Cumple estándar C4 del proyecto (90% coverage), ataja el único servicio sin cobertura
   - Cons: No aporta valor funcional directo a usuarios
   - Effort: **Low**

4. **Nuevas Funcionalidades** — Dashboard personalizable, historial multi-año, vista para padres, exportación PDF, persistencia backend opcional
   - Pros: Alto valor agregado para usuarios docentes/directivos
   - Cons: Scope grande, riesgo de desviarse del roadmap actual
   - Effort: **High**

5. **Optimización de Performance** — No persistir estudiantes en IndexedDB, reusar Web Worker, memoizar componentes pesados, virtual scroll para tablas grandes
   - Pros: Mejora experiencia con datasets grandes
   - Cons: La mayoría de escuelas tienen pocos estudiantes; puede ser premature optimization
   - Effort: **Medium**

---

### Recommendation

**Enfoque híbrido priorizado:** 

1. **Fase A (Alta prioridad — bugs y deuda crítica):** Refactor de `AnalysisTab.tsx`, corrección de `useEffect` en VolatilityTab/TutorsTab, extracción de constante `PASSING_GRADE`, corrección de `lang="es"`, y agregar `aria-label` a iconos emoji.
2. **Fase B (Testing):** Tests para `evolutionLogic.ts`, reemplazar `types.test.ts` con tests significativos.
3. **Fase C (Media — deuda y UX):** Eliminación de redundancia CSS/utility, skeleton loading, feedback visual para simulación, manejo de error para config.json.
4. **Fase D (Futuro — nuevas funcionalidades):** Seleccionar 1-2 features de alto valor (ej. exportación PDF, dashboard personalizable, historial multi-año) basado en feedback de usuarios.

La Fase A debe ir a `sdd-propose` primero para definir el alcance exacto y evitar un scope inmanejable.

---

### Risks

- **Risk 1: Regression en lógica académica** — El refactor de constantes y extracción de lógica duplicada debe mantener el comportamiento existente. Mitigación: tests existentes (270+) deben pasar, y se deben agregar tests específicos para los módulos refactorizados.
- **Risk 2: Scope creep** — La auditoría identifica ~25 issues. Intentar resolver todo en un solo cambio es peligroso. Mitigación: Múltiples propuestas (al menos 3-4 cambios independientes).
- **Risk 3: UI refactor puede romper simulaciones** — AnalysisTab maneja simulaciones activas. Cualquier cambio debe preservar el estado de simulación entre renders.
- **Risk 4: La Fase D (nuevas funcionalidades) no está validada con usuarios reales** — No implementar sin validación previa con docentes/directivos de la IEEC.
- **Risk 5: Chained PRs recomendadas** — El cambio de refactor + testing + UX excederá 400 líneas. Se recomienda `auto-chain` con slices por área (refactor, testing, accesibilidad).

---

### Ready for Proposal

**Yes.** La exploración está completa. Recomiendo al orquestrador:

1. Informar al usuario que se identificaron ~25 issues clasificados por severidad (alta/media/baja) en 4 categorías: arquitectura, UI/UX, testing, nuevas funcionalidades.
2. Preguntar si quiere abordar todo en un gran cambio o dividir en 3-4 cambios independientes.
3. Iniciar `sdd-propose` para el primer cambio (Fase A: bugs + deuda crítica), que es el de mayor impacto con menor riesgo.

Artifact generado en: `openspec/changes/project-audit-and-improvements/exploration.md`
