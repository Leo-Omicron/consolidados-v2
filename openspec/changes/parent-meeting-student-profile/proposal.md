# Proposal: Modo Reunión de Padres / Ficha Estudiante (parent-meeting-student-profile)

## Intent
Proveer una vista de "Ficha de Estudiante" orientada a reuniones con padres o acudientes, con un enfoque claro y visual que pueda imprimirse de manera profesional desde el navegador, sin distraer con el resto de la interfaz del dashboard, cuidando la privacidad de los demás alumnos y garantizando que las simulaciones previas sean transparentes.

## Context
Los profesores suelen utilizar los consolidados para reuniones con padres. Mostrarles el dashboard completo o una tabla gigante de Excel genera fricción, viola la privacidad de otros alumnos y carece de un enfoque pedagógico fácil de entender para alguien externo. Se necesita una vista aislada por alumno que condense toda su historia clínica académica del año.

## Proposed Approach
- **Capa de Datos Pura**: Crear un helper puro `buildStudentProfileData(...)` que reciba el estudiante, el contexto del grupo, insights y simulaciones, retornando un objeto pre-digerido.
- **Capa UI (Modal Fullscreen)**: Crear `StudentProfileModal` accesible (cierre con Escape, overlay click, tab-trap básico si aplica). El modal se podrá abrir desde `AnalysisTab` y `InsightsTab`.
- **Análisis Comparativo (Radar Chart)**: Incluir un gráfico de tipo Radar (usando `chart.js` / `react-chartjs-2`) que compare el rendimiento del alumno por áreas contra el promedio de su grupo. Esto da contexto sin exponer las notas exactas ni los nombres de los compañeros (privacidad).
- **Proyecciones (What-If)**: Si el estudiante tiene simulaciones activas, la ficha debe reflejar las proyecciones y mostrar un banner ineludible de "Modo Proyección".
- **Ficha Imprimible (Print-Ready)**: La vista debe formatearse automáticamente para impresión (hoja A4) mediante reglas `@media print`. Solo la ficha se imprimirá (sin navbar, sin controles). Todo manejado nativamente por el navegador, evitando librerías pesadas como generadores de PDF.