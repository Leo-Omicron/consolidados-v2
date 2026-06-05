# Specification: Ficha de Estudiante (Parent Meeting Mode)

## Requirements

### Requirement: Data API purity
- El sistema DEBE exponer una función pura para construir el contexto de la ficha del estudiante: `buildStudentProfileData()`.
- La función NO DEBE mutar el estado global (Zustand) ni generar efectos secundarios.
- La función DEBE calcular las "Fortalezas" (top 2 Áreas por definitiva) y "Puntos a Mejorar" (bottom 2 Áreas por definitiva, que estén por debajo de 3.5).
- La función DEBE inyectar el insight de Diagnóstico Pedagógico si el estudiante tiene uno asignado en la evaluación general.
- La función DEBE devolver el promedio consolidado del grupo para las áreas en las que el estudiante tiene calificaciones, protegiendo la privacidad de los demás estudiantes mediante la agregación anónima.

### Requirement: Modal Lifecycle & Accessibility
- El sistema DEBE proveer un componente `StudentProfileModal`.
- El modal DEBE abrirse superponiendo la vista principal del dashboard.
- El modal DEBE cerrarse al presionar la tecla `Escape`, al hacer clic fuera del contenedor (overlay), o mediante el botón "X" / "Cerrar".
- Las vistas `AnalysisTab` y `InsightsTab` DEBEN tener un disparador claro para abrir este modal pasando el `studentId`.

### Requirement: Charting & Fallbacks
- El sistema DEBE presentar un gráfico tipo Radar cruzando el rendimiento del estudiante contra la media de su grupo en las distintas Áreas.
- Si el estudiante carece de notas evaluadas en sus áreas, el sistema NO DEBE renderizar el canvas vacío o lanzar un error; DEBE renderizar un empty state amigable.

### Requirement: Print Mode
- El sistema DEBE incluir un botón de "Imprimir Ficha" que dispare la API del navegador `window.print()`.
- Cuando se dispara la impresión, las reglas CSS `@media print` DEBEN asegurar que:
  - Solo el contenido de la ficha es visible (`print:block` vs `print:hidden`).
  - Los gráficos, insignias y colores de fondo retengan su estilo (`print-color-adjust: exact`).
  - El diseño ocupe todo el espacio de la hoja (A4), eliminando márgenes de navegación.

### Requirement: What-If Integration
- Si existe una simulación activa en `useSimulationStore` para el estudiante seleccionado, la ficha DEBE renderizar sus datos basados en dicha simulación.
- DEBE aparecer un banner ineludible en el encabezado del modal indicando: "Modo Proyección - Simulaciones Activas" para evitar que el usuario asuma que esas son las calificaciones reales registradas.
