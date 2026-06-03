# Specification: Ficha de Estudiante (Parent Meeting Mode)

## Requirements

### Requirement: Modal Lifecycle
- El sistema DEBE proveer un componente modal que reciba como propiedad el ID de un estudiante (o el objeto `Estudiante` directamente) y una función `onClose`.
- Al abrirse, DEBE enfocar el contenido y permitir el cierre con la tecla `Escape` o haciendo clic fuera del contenedor principal.

### Requirement: Data Aggregation (Read-Only)
- El sistema DEBE obtener el promedio final del estudiante.
- El sistema DEBE calcular las "Fortalezas" (top 2 Áreas por definitiva) y "Puntos a Mejorar" (bottom 2 Áreas por definitiva, que estén por debajo de 3.5).
- El sistema DEBE reutilizar la lógica de `insightsLogic` para detectar el arquetipo del alumno, mostrando la narrativa pedagógica correspondiente.
- El sistema DEBE detectar si el estudiante tiene una simulación activa en `useSimulationStore`. De ser así, debe renderizar los datos usando la versión simulada de sus notas y mostrar un aviso indicando "Modo Proyección".
- Ninguna de estas derivaciones DEBE mutar el estado global de `useDashboardStore`.

### Requirement: Print Mode
- El sistema DEBE incluir un botón de "Imprimir Ficha" que dispare `window.print()`.
- Cuando se imprime, el modal DEBE ocupar el 100% de la página A4.
- Los elementos de navegación subyacentes, la barra de scroll y el fondo opaco del modal DEBEN ocultarse (vía `print:hidden`).
- Los gráficos y badges DEBEN retener sus colores de fondo (`print-color-adjust: exact`).
- Si la información sobrepasa una página, DEBE manejar el salto de página limpiamente sin cortar filas de texto a la mitad (`break-inside-avoid`).

### Requirement: Edge Cases & Privacy
- Si no hay datos suficientes para calcular arquetipos (menos de 2 periodos), la sección de insights DEBE ocultarse grácilmente o mostrar un texto claro de "Datos insuficientes".
- La ficha NUNCA DEBE mostrar nombres ni notas de otros compañeros, garantizando la privacidad en reuniones.
