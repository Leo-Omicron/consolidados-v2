# IEEC Consolidados V2 — Project Roadmap

This roadmap serves as the master planning and alignment document for the **Consolidados V2** project. It outlines our architectural commitments, specific goals, completed phases, and execution standards.

---

## 🗺️ Execution Roadmap

```
Phase 10 (Charts) ──> Phase 11 (UI Overhaul) ──> Phase 12 (Reports Engine) ──> Phase 13 (Export & Print) ──> Phase 14 (Verification) ──> Phase 15 (Settings) ──> System Ready
   [COMPLETED]           [COMPLETED]               [COMPLETED]                 [COMPLETED]                  [COMPLETED]              [COMPLETED]             [v1.5.0]

Phase 21/22 (Executive Dashboard) — COMPLETED (integrated in v1.4.0)
```

---

## ✅ Completed Phases

### 📊 Phase 10: Complete Charts & Visual Analytics Refactor
* **Goal**: Rebuilt `ChartsTab.tsx` under strict TDD, fully bound to the Zustand store and `useAnalysisPipeline`.
* **Features**:
  * Group-aware key KPI cards (Promedio Grupal, Aprobados, Alumnos Críticos).
  * Comparative performance bar charts (Averages per Area/Subject vs. 3.0 threshold line).
  * Status distribution doughnut charts (Ganado, Alerta, Perdido).
  * Full dual-view integration ("Áreas" vs. "Asignaturas").

### ✨ Phase 11: General UI/UX Overhaul & Visual Modernization
* **Goal**: Elevated the interface to a modern, high-fidelity dashboard.
* **Features**:
  * Custom Tailwind v4 `@theme` palette (Cool slate/indigo) with status color rules.
  * Premium card elevations, standard responsive layouts, and elegant spacing.
  * Fixed sticky headers and horizontal scrolling tables.

### 📋 Phase 12: Institutional Reports & Linter Clean-up
* **Goal**: Cleaned up all legacy ESLint linter errors and created a pure, unit-tested statistical report engine.
* **Features**:
  * Cleaned up 94 linter problems across files (no `any` casts).
  * Pure `reportEngine.ts` containing the math for Class Average, Standard Deviation, and Promotion states.
  * Interactive reports selector with details tooltips and collapsible inferred weights.

### 💾 Phase 13: Export & Downloads Suite
* **Goal**: Integrated client-side Excel downloads (SheetJS) and professional CSS print styles.
* **Features**:
  * One-click Export to Excel for the active report.
  * Consolidado Completo: downloading all 9 reports combined into a single multi-sheet Excel file, including the new Diagnóstico Pedagógico.
  * Tailored print-media CSS layouts (hidden controls, landscape optimization, robust Ficha student profiles).

### 🏆 Phase 21/22: Dashboard Directivo Institucional
* **Goal**: Implementar el panel para directivos con KPIs globales, extracción de Sedes y Jornadas y generación masiva de perfiles.
* **Features**:
  * Extracción dinámica de `Sede` y `Jornada` desde Excel vía *keywords*.
  * Dashboard Institucional (`ExecutiveTab.tsx`) con métricas globales, gráficos de aprobación y filtro Sede/Jornada.
  * Motor analítico global para generar Top 5 histórico y Áreas Críticas.
  * `StudentProfileModal` e impresión masiva de fichas.

### ⚙️ Phase 15: Settings Tab & Weight Editor
* **Goal**: Interactive configuration module for academic weight editing.
* **Features**:
  * Period weights editor (P1-P4) with auto-compensation sliders.
  * Subject weights editor (grupo → área → asignatura) with auto-compensation.
  * Institutional presets manager (preview, apply, restore).
  * Worker deep merge: user weights survive Excel re-uploads.
  * 5 new test files, 575 tests passing, strict TDD.

---

## 🛠️ Next Steps

* **Phase 14: System Verification & Release** — COMPLETED (v1.5.0 released)
* **Next Feature: Multi-Excel Historical Upload** — SDD pending
  * Explore loading files from multiple academic periods (1P, 2P, 3P, 4P).
  * Define period-over-period comparison and trend analysis requirements.
  * Validate performance implications before implementation.

---

## 🛠️ Execution Standards (Our Golden Rules)

1. **Strict TDD Mode**: All calculations, filtering binders, and chart-data parsers must be built RED -> GREEN -> REFACTOR.
2. **Backward Compatibility**: Do not break legacy imports; ensure Excel uploads remain perfectly integrated.
3. **No Shortcuts**: Any helper functions must have full coverage, and we compile cleanly with `tsc --noEmit` on every phase.
4. **Clean Code**: Zero manual file operations without specialized tools. No "Co-Authored-By" or AI-attribution in commits.
