# IEEC Consolidados V2 — Project Roadmap

This roadmap serves as the master planning and alignment document for the **Consolidados V2** project. It outlines our architectural commitments, specific goals, completed phases, and execution standards.

---

## 🗺️ Execution Roadmap

```
Phase 10 (Charts) ──> Phase 11 (UI Overhaul) ──> Phase 12 (Reports Engine) ──> Phase 13 (Export & Print) ──> System Verification
   [COMPLETED]           [COMPLETED]               [COMPLETED]                 [COMPLETED]               [NEXT UP]
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

---

## 🛠️ Next Steps

* **Phase 14: System Verification & Release**
  * **Task 1: Build & CI Audit**: Run full clean build, verify zero TS/Linter warnings in strict mode.
  * **Task 2: Browser Engine Check**: Verify print layout and flexbox containment across WebKit (Safari) and Gecko (Firefox) engines.
  * **Task 3: Release Closure**: Verify Release Please output, GitHub tag/release, Vercel deploy, and README/package/CHANGELOG version alignment.

---

## 🛠️ Execution Standards (Our Golden Rules)

1. **Strict TDD Mode**: All calculations, filtering binders, and chart-data parsers must be built RED -> GREEN -> REFACTOR.
2. **Backward Compatibility**: Do not break legacy imports; ensure Excel uploads remain perfectly integrated.
3. **No Shortcuts**: Any helper functions must have full coverage, and we compile cleanly with `tsc --noEmit` on every phase.
4. **Clean Code**: Zero manual file operations without specialized tools. No "Co-Authored-By" or AI-attribution in commits.
