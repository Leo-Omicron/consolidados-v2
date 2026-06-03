# Design: Modo Reunión de Padres / Ficha Estudiante

## Architecture

### UI Component: `StudentProfileModal`
Un modal responsive que ocupa toda la pantalla en móvil y se centra en desktop.
- Implementado usando un portal o condicional en el nivel superior de `AnalysisTab` / `InsightsTab`.
- **Estado de UI local:** `selectedStudentId` (string | null). Si es distinto de null, se renderiza el modal.

### Integration with Existing Logic
- **`useDashboardStore`**: Obtiene el estudiante seleccionado y las medias del grupo. No se muta el estado.
- **`insightsLogic`**: Se evaluará en el momento si el estudiante seleccionado tiene un arquetipo. En lugar de un Hook, se llamará a la lógica pura o se leerá del hook si ya está montado en el contexto superior.
- **`simulationLogic`**: Se inyectan las notas base o simuladas según el estado de `useSimulationStore`.

### Charting
- Uso de `react-chartjs-2` y `chart.js` (si ya están en el proyecto, o agregarlos limitando el scope).
- Se mostrará un `RadarChart` cruzando las `definitiva` de cada Área vs el promedio del Área en el grupo.

### Print CSS Strategy
- Aplicar clases Tailwind específicas para impresión: `print:block`, `print:hidden`, `print:p-0`, `print:m-0`, `print:shadow-none`.
- Forzar el tamaño de la hoja en el CSS (`@page { size: A4; margin: 1cm; }`).
- Garantizar que los colores de fondo del gráfico o los badges se impriman usando clases que fuercen color (`print-color-adjust: exact`).

## Questions Resolved
- **Desde dónde se abre**: Al hacer clic en un estudiante en el `StudentGroupTable` o en la `ArchetypeCard` del `InsightsTab`.
- **Formato**: Modal fullscreen (overlay encima de la app).
- **Qué pasa sin datos**: Secciones vacías mostrarán "Sin datos suficientes para este reporte" en lugar de errores o gráficos vacíos.
- **Modo de impresión**: Exclusivamente usando las herramientas de impresión nativas del navegador, activadas por un botón `Imprimir Ficha`.
