# Consolidados IEEC - Plataforma de Analítica Pedagógica

<p align="center">
  <img src="./archivos/escudo-el-carmen.jpg" width="180" alt="Escudo IE El Carmen" />
</p>

Plataforma cliente-servidor (100% frontend) diseñada para la **Institución Educativa El Carmen**. Empodera a docentes y directivas al transformar reportes de Excel crudos en tableros de control interactivos, simuladores de rendimiento y sistemas de alertas tempranas, respetando al máximo la privacidad de los datos y manteniendo costos operativos en cero.

## 🚀 Impacto y Filosofía

- **Privacidad Absoluta:** Los archivos Excel de los estudiantes NUNCA salen del computador. Todo se procesa en el navegador (Web Worker).
- **Cero Costos:** Sin base de datos, sin backend. Alojado de forma gratuita en Vercel.
- **Decisiones Basadas en Datos:** Adiós a las percepciones. Hola a las proyecciones matemáticas exactas.

## ✨ Funcionalidades Brutales (Lo Bueno)

| Módulo | Utilidad Pedagógica |
|--------|---------------------|
| **Parseo Web Worker** | Procesa Excels pesados con miles de celdas en milisegundos sin congelar la pantalla. |
| **Diagnóstico de Calidad** | Auditoría automática. Detecta notas atípicas, vacíos de información o formatos rotos antes de analizar. |
| **Alertas Tempranas** | Detecta al instante estudiantes en "Riesgo Imposible" (necesitan > 5.0) o "Severo" y genera reportes para intervención. |
| **Mentores Pares** | Identifica a los estudiantes más sobresalientes de cada área para asignarlos como tutores de sus compañeros en riesgo. ¡Aprendizaje colaborativo! |
| **Volatilidad Académica** | Mide la consistencia del rendimiento a lo largo del año. Detecta estudiantes "En Caída Libre" o en "Montaña Rusa" analizando la desviación estándar de sus notas. |
| **Mapa de Calor** | Matriz visual de todo el salón. Colores intuitivos para detectar de un vistazo en qué asignaturas está fallando el grupo entero o qué estudiante requiere atención. |
| **Estadísticas Generales** | Resumen directivo con promedios generales, tasas de aprobación y comparación competitiva entre diferentes grupos. |
| **Reportes y Exportación** | Generación de consolidados completos en Excel, vistas imprimibles y análisis de rendimiento detallado. |
| **Soporte Legacy & Dinámico** | Detecta plantillas antiguas automáticamente (fallback) y adapta todas las proyecciones y gráficos según si el año tiene 3, 4 o N periodos activos. |

## ⚠️ Limitaciones Conocidas (Lo Malo)

- **Sin Persistencia Centralizada:** Al no haber base de datos, el docente debe arrastrar el archivo Excel cada vez que abre la plataforma. 
- **Acoplamiento al Formato:** La herramienta depende de la estructura del Excel escolar. Aunque cuenta con un parser secundario para formatos antiguos (legacy fallback), cambios drásticos futuros requerirán actualización de la lógica de extracción.
- **Cálculo de Pesos Inferidos:** La plataforma debe deducir los pesos porcentuales (ej. 25/25/50 en Sociales) leyendo los promedios. Anomaílas en el reporte original impactan la predicción.

## 🛠️ Tech Stack & Ingeniería

- **Core:** React 19 + TypeScript + Vite.
- **Estado:** Zustand (arquitectura de micro-stores).
- **Estilos:** Tailwind CSS 4.
- **Datos y Gráficos:** SheetJS (xlsx) + Chart.js.
- **Calidad:** TDD estricto con Vitest y React Testing Library (100% de cobertura en lógica académica).

## 🚦 Pasos Rápidos (Desarrollo)

1. `npm install`
2. `npm run dev` (Levanta el servidor local)
3. `npm test -- --run` (Corre la barrera de validación con más de 270 tests)
4. `npm run build` (Prepara para Vercel)

---
*Construido con disciplina, TDD estricto y código limpio. Zero Vibecoding.*
