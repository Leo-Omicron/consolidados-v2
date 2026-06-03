# Tasks: Modo Reunión de Padres / Ficha Estudiante

- [x] 1. Crear helper puro de perfil (`buildStudentProfileData`) que extraiga notas, promedios grupales, fortalezas y debilidades, junto a tests unitarios rigurosos.
- [x] 2. Crear componente `StudentProfileModal` accesible (Escape, Overlay, Focus) y sus respectivos tests de interfaz (DOM).
- [x] 3. Integrar apertura del modal desde `AnalysisTab` (por ejemplo, clic en el nombre del estudiante o botón de acción).
- [x] 4. Integrar apertura del modal desde `InsightsTab` (en las `ArchetypeCard`).
- [x] 5. Agregar Radar chart con fallback (utilizando `react-chartjs-2`), comprobando su estado vacío ante la falta de datos.
- [x] 6. Agregar CSS de impresión (Tailwind `print:*`) y testear espionaje de la llamada a `window.print()`.
- [x] 7. Verificar privacidad (que el cálculo grupal no filtre información) y conexión con What-If (banner de simulación activa).
- [x] 8. Ejecutar gates finales: Lint, Build, y verificación de los tests automáticos (100% pasando).