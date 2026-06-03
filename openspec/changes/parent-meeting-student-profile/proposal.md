# Proposal: Modo Reunión de Padres / Ficha Estudiante (parent-meeting-student-profile)

## Intent
Proveer una vista de "Ficha de Estudiante" orientada a reuniones con padres o acudientes, con un enfoque claro y visual que pueda imprimirse de manera profesional desde el navegador, sin distraer con el resto de la interfaz del dashboard.

## Context
Los profesores suelen utilizar los consolidados para reuniones con padres. Mostrarles el dashboard completo o una tabla gigante de Excel genera fricción, viola la privacidad de otros alumnos y carece de un enfoque pedagógico fácil de entender para alguien externo. Se necesita una vista aislada por alumno que condense toda su historia clínica académica del año.

## Proposed Approach
- Crear un componente modal o vista tipo "pantalla completa" (`StudentProfileModal`) que se puede abrir haciendo clic en un estudiante desde el `AnalysisTab` o el `InsightsTab`.
- La ficha reutilizará los datos del `useDashboardStore`, `useInsights`, y `useSimulationStore`.
- Contendrá:
  - Información básica: nombre, grupo.
  - Resumen de notas y faltas.
  - Fortalezas (áreas con mejor rendimiento) y Debilidades (áreas con peor rendimiento).
  - Un gráfico tipo Radar (Chart.js) comparando al alumno con la media de su grupo.
  - Integración con "El Oráculo": si tiene un arquetipo pedagógico detectado, mostrarlo de forma amigable (o una versión suavizada del texto).
  - Integración con "Simulaciones": Si hay una simulación activa en `What-If`, mostrar la proyección.
- Utilizar consultas `@media print` en Tailwind para asegurar que al darle Ctrl+P se imprima solo el modal (escondiendo el navbar y otros controles), formateado en tamaño A4.
- No se incorporarán librerías de PDF como `jspdf` o `html2canvas` para evitar el engrosamiento del bundle.
