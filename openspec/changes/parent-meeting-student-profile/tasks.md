# Tasks: Modo Reunión de Padres / Ficha Estudiante

- [ ] Crear el esqueleto del componente `StudentProfileModal` con Tailwind (incluyendo el botón de cerrar).
- [ ] Conectar el estado local para abrir el modal desde `StudentGroupTable` y `ArchetypeCard`.
- [ ] Desarrollar la sección de "Información Básica" (Nombre, Grupo, Notas actuales).
- [ ] Desarrollar la sección de "Fortalezas y Debilidades" extrayendo los top/bottom promedios de área.
- [ ] Desarrollar la integración con "El Oráculo": llamar a `insightsLogic` para un solo estudiante y mostrar un banner suave si tiene arquetipo.
- [ ] Desarrollar la integración con `What-If`: leer `useSimulationStore` y mostrar proyecciones si aplican.
- [ ] Implementar el gráfico de Radar (instalación de dependencias de chart si fuera necesario, o reutilización si ya existen).
- [ ] Implementar el `@media print` CSS: Ocultar todo lo que no sea el modal, ajustar márgenes, forzar impresión de colores de fondo.
- [ ] Escribir tests unitarios asegurando que el modal no muta el store de Zustand.
- [ ] Realizar una prueba visual manual simulando la impresión (Ctrl+P).
