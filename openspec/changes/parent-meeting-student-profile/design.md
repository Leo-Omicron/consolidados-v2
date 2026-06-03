# Design: Modo Reunión de Padres / Ficha Estudiante

## Architecture

### Data API (Pure Helper)
Para aislar la lógica y permitir un testing unitario robusto, se definirá el helper:
```typescript
export function buildStudentProfileData(
  studentId: string,
  baseEstudiantes: Estudiante[],
  insights: ArchetypeResult[],
  activeSimulations: Record<string, Partial<PeriodoNotas>>
): StudentProfileData | null
```
**Salida mínima esperada (`StudentProfileData`)**:
- Información del estudiante (nombre, código).
- Grupo y promedios por área del estudiante.
- Promedio grupal por área (para la comparativa).
- `fortalezas`: Top 2 áreas (definitiva >= 3.5).
- `puntosMejora`: Bottom 2 áreas (definitiva < 3.5).
- `insight` / `arquetipo`: Si aplica.
- `isSimulated`: Booleano para inyectar el banner visual.

### UI: `StudentProfileModal`
- **Renderizado**: Modal fullscreen, centrado en desktop con scroll interno si desborda, y full stretch en mobile.
- **Accesibilidad**: Cierre con tecla `Escape`, cierre al hacer clic en el backdrop/overlay, y botón explícito de cerrar. Foco manejado al abrirse.
- **Apertura**:
  - Desde `AnalysisTab`: Añadir botón o permitir clic en la fila del estudiante.
  - Desde `InsightsTab`: Añadir acción en la `ArchetypeCard`.

### Charting: Radar Chart
- **Dependencias**: Se utilizará `chart.js` y `react-chartjs-2`.
- **Ejes**: Las áreas académicas (Matemáticas, Lenguaje, etc.).
- **Data 1**: Definitivas del estudiante por área.
- **Data 2**: Definitiva promedio del grupo por área.
- **Fallbacks**: Si un estudiante carece de notas en áreas (array vacío), renderizar un Empty State claro ("No hay suficientes calificaciones para generar el gráfico") en vez de un canvas roto.

### Print Strategy (`@media print`)
- **Action**: Botón dedicado "Imprimir Ficha" que ejecute `window.print()`.
- **CSS**:
  - Usar clases de Tailwind: `print:block`, `print:hidden`, `print:absolute`, `print:inset-0`.
  - Forzar fondos y colores: `print-color-adjust: exact`.
  - Ocultar `app-navbar`, report-tabs, fondos oscuros del modal.
  - Asegurar la escala: `@page { size: A4; margin: 1cm; }`.

### Privacy Guidelines
- Absolutamente ningún nombre o nota individual de un compañero debe ser expuesto en el modal.
- El promedio del grupo se enviará al componente ya agregado y anonimizado.

### What-If Integration
- Si `useSimulationStore.getState().activeSimulations[studentId]` tiene contenido, la ficha leerá los datos inyectando la proyección (preferiblemente extrayendo la fila ya procesada por `getSimulatedRows`).
- Debe renderizarse un banner superior amarillo/naranja con la leyenda "Modo Proyección - Simulaciones Activas".

## Testing Strategy
- Tests puramente unitarios para `buildStudentProfileData`.
- Tests de componente comprobando el renderizado de `StudentProfileModal`, el cierre con `Escape`, y la protección de mutación de Zustand.
- Verificación del renderizado seguro del gráfico (mocking `react-chartjs-2` o testeando el fallback).
- Espionaje de `window.print` al hacer clic en el botón imprimir.
