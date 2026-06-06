# Consolidados IEEC - Plataforma de Analítica Pedagógica

<p align="center">
  <img src="./archivos/escudo-el-carmen.jpg" width="180" alt="Escudo IE El Carmen" />
</p>

**Consolidados IEEC** transforma archivos Excel institucionales en un tablero pedagógico moderno para analizar rendimiento, detectar riesgos, preparar reportes y acompañar decisiones académicas. La plataforma está diseñada para la **Institución Educativa El Carmen** y funciona 100% en el navegador: sin backend, sin base de datos y sin enviar información estudiantil a servidores externos.

## Estado actual

| Área | Estado |
|------|--------|
| Versión | `1.2.0` |
| Frontend | React 19 + TypeScript + Vite |
| Datos | Procesamiento local de Excel con Web Worker |
| Calidad | 545 pruebas automatizadas con Vitest |
| Despliegue | Vercel |
| Privacidad | Los archivos se procesan en el equipo del usuario |


## Novedades recientes

- **Terminología institucional limpia**: la experiencia activa usa **Diagnóstico Pedagógico** de forma consistente para reemplazar nombres experimentales anteriores.
- **Ficha de estudiante más robusta para impresión**: la vista imprimible limpia su estado aunque el navegador interrumpa o falle el diálogo de impresión.
- **Reportes anchos contenidos**: Registro Oficial y Mapa de Calor mantienen el ancho de la página y desplazan la tabla dentro del reporte cuando hace falta.
- **Tarjetas de Diagnóstico Pedagógico más legibles**: el nombre del estudiante queda visible como título de cada tarjeta y el botón **Ficha** abre el perfil correspondiente.
- **Validación con datos institucionales reales**: el flujo fue verificado con 13 archivos Excel de 1P, 342 estudiantes, 3866 filas de áreas y 5814 filas de asignaturas sin incidencias de diagnóstico.

## Para qué sirve

La plataforma ayuda a docentes, directores de grupo y directivas a responder preguntas concretas:

- ¿Qué estudiantes están en riesgo académico real?
- ¿Qué áreas o asignaturas están afectando más al grupo?
- ¿Qué nota necesita un estudiante para recuperar?
- ¿Quiénes pueden actuar como mentores pares?
- ¿Qué estudiantes muestran patrones de caída, recuperación o volatilidad?
- ¿Cómo preparar una reunión de padres con información clara y accionable?
- ¿Cómo generar reportes institucionales sin rehacer cálculos manuales?

## Funcionalidades principales

| Módulo | Qué aporta |
|--------|------------|
| **Carga de Excel** | Importa consolidados escolares y procesa la información localmente con Web Worker para evitar bloqueos de pantalla. |
| **Diagnóstico de calidad** | Detecta problemas de formato, datos vacíos o inconsistencias antes de analizar resultados. |
| **Resumen ejecutivo** | Muestra promedios, aprobación, distribución de estados y comparativas entre grupos. |
| **Análisis avanzado** | Permite revisar estudiantes por área o asignatura, filtrar resultados, ordenar datos y trabajar con simulaciones académicas. |
| **Simulador What-If** | Evalúa escenarios de recuperación sin alterar la data original; soporta cambios por área/asignatura y respeta pesos configurados. |
| **Ficha de estudiante** | Genera una vista imprimible para reunión de padres con fortalezas, puntos de mejora, ranking, radar académico y estado simulado cuando aplica. |
| **Alertas tempranas** | Identifica estudiantes con riesgo recuperable, severo o matemáticamente imposible según las notas requeridas. |
| **Mentores pares** | Sugiere estudiantes destacados que pueden acompañar a compañeros en dificultad dentro de la misma área. |
| **Volatilidad académica** | Clasifica trayectorias como estable, ascenso, caída libre o montaña rusa según la evolución del desempeño. |
| **Mapa de calor** | Visualiza rápidamente el estado académico por estudiante y área/asignatura mediante colores. |
| **Diagnóstico Pedagógico** | Agrupa patrones pedagógicos como resiliente, confiado, montaña rusa o radar; cada tarjeta muestra el estudiante y permite abrir su ficha. |
| **Reportes institucionales** | Genera vistas de rendimiento grupal, destacados, riesgo académico, asignaturas, comparativa de grupos, mapa de calor, retroalimentación docente, registro oficial y diagnóstico pedagógico. |
| **Exportación e impresión** | Exporta reportes individuales a Excel, genera un consolidado completo multihoja y prepara vistas imprimibles optimizadas, incluyendo ficha de estudiante. |
| **Tema claro/oscuro** | Interfaz moderna con soporte de tema y diseño responsive. |

## Reportes disponibles

Desde el módulo **Reportes y PDF** se pueden consultar y exportar:

1. **Rendimiento grupal**: promedio, desviación estándar, tasa de promoción y áreas críticas.
2. **Estudiantes destacados**: mejores desempeños y percentiles del grupo.
3. **Riesgo académico**: estudiantes con áreas perdidas y notas requeridas para recuperar.
4. **Análisis de asignaturas**: promedios, fallos y tasa de pérdida por asignatura.
5. **Comparativa de grupos**: lectura institucional entre cursos.
6. **Mapa de calor**: matriz visual de desempeño por estudiante.
7. **Retroalimentación docente**: fortalezas, debilidades y recomendaciones por estudiante.
8. **Registro oficial**: vista consolidada para cierre académico, con periodo y director configurables.
9. **Diagnóstico Pedagógico**: tarjetas de intervención con patrón, severidad, explicación, confianza y acceso directo a la ficha del estudiante.

Además, el botón **Consolidado Completo** descarga un Excel multihoja con los reportes principales del grupo seleccionado. Las tablas anchas usan desplazamiento interno para no ensanchar toda la página.

## Flujo recomendado de uso

1. Cargar el archivo Excel institucional.
2. Revisar el diagnóstico de calidad de datos.
3. Explorar el resumen general y los indicadores críticos.
4. Usar análisis avanzado, alertas, mapa de calor e insights para priorizar intervenciones.
5. Simular escenarios What-If cuando se necesite proyectar recuperaciones.
6. Abrir la ficha de estudiante para preparar reuniones con familias.
7. Exportar o imprimir reportes institucionales según la necesidad.
8. Usar **Consolidado Completo** cuando se requiera una entrega multihoja para revisión institucional.

## Privacidad y arquitectura

Consolidados IEEC está diseñado bajo una decisión clave: **la información de estudiantes no debe salir del navegador**.

- No hay backend.
- No hay base de datos centralizada.
- No se suben archivos Excel a servicios externos.
- El procesamiento pesado ocurre en un Web Worker local.
- La persistencia de preferencias se maneja en el navegador.

Esta arquitectura reduce costos y protege datos sensibles, pero también implica que el usuario debe cargar el Excel cuando inicia una nueva sesión de análisis.

## Limitaciones conocidas

- La herramienta depende de la estructura del Excel institucional. Cambios fuertes en el formato pueden requerir ajustes del parser.
- El cálculo predictivo depende de pesos, periodos y datos disponibles en el consolidado.
- Al no existir backend, no hay sincronización multiusuario ni historial centralizado.
- Las simulaciones What-If son proyecciones pedagógicas; no reemplazan el criterio académico del docente o directivo.

## Stack técnico

| Capa | Tecnología |
|------|------------|
| UI | React 19 |
| Lenguaje | TypeScript |
| Build | Vite |
| Estado | Zustand |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js + react-chartjs-2 |
| Excel | SheetJS `xlsx` |
| Impresión | react-to-print + CSS print media |
| PWA | vite-plugin-pwa |
| Testing | Vitest + Testing Library + jsdom |

## Desarrollo local

```bash
npm install
npm run dev
```

Validación completa:

```bash
npm run lint
npm run build
npm run test
```

## Estándares de trabajo

- Mantener commits convencionales.
- Arquitectura de flujo (MANDATORIO): Usar el modelo de **Doble Worktree** (Santuario para `master` / Laboratorio en detached HEAD para el código) para proteger la rama principal.
- Planificación limpia: Usar **SDD + Engram** para la planificación. No ensuciar el repositorio con archivos markdown en `.openspec/` u otros temporales; todo va a la memoria persistente del agente.
- Actualizar este README cuando una mejora cambie la experiencia del usuario, el flujo de trabajo o las capacidades principales.
- Mantener las pruebas junto a la lógica que verifican. La baseline actual exige mantener todo en verde (`npm test -- --run`).
- Evitar cálculos duplicados: la lógica académica canónica vive en los servicios del dominio.
- No agregar atribución de IA ni `Co-Authored-By` en commits.

## Roadmap cercano

- Mantener el README y el roadmap sincronizados con cada release o cambio visible de producto.
- Seguir fortaleciendo pruebas sobre lógica académica, reportes, exportaciones e impresión.
- Revisar periódicamente compatibilidad de formatos Excel institucionales.
- Continuar puliendo experiencia de usuario para docentes y directivas.

---

Construido con foco en privacidad, claridad pedagógica y decisiones académicas basadas en datos.
