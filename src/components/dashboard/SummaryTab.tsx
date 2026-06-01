import React, { useMemo } from 'react';
import type { RowArea, RowAsignatura, PeriodConfig } from '../../domain/types';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useThemeStore, type ThemeMode } from '../../store/useThemeStore';
import { useAnalysisPipeline } from '../../hooks/useAnalysisPipeline';
import { roundToOneDecimal } from '../../services/academicLogic';
import { generateGroupComparisonReport } from '../../services/reportEngine';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Threshold line custom plugin drawing a horizontal dashed line at 3.0 passing grade
// eslint-disable-next-line react-refresh/only-export-components
export const thresholdLinePlugin = {
  id: 'thresholdLine',
  afterDraw: (chart: ChartJS) => {
    const { ctx, chartArea: { left, right }, scales: { y } } = chart;
    const yVal = y.getPixelForValue(3.0);
    
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red-500
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]); // Dashed line
    
    ctx.beginPath();
    ctx.moveTo(left, yVal);
    ctx.lineTo(right, yVal);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.font = '12px sans-serif';
    ctx.fillText('Mínimo: 3.0', left + 8, yVal - 6);
    ctx.restore();
  }
};

const chartThemeByMode: Record<ThemeMode, { text: string; grid: string }> = {
  light: {
    text: '#475569',
    grid: 'rgba(148, 163, 184, 0.28)',
  },
  dark: {
    text: '#cbd5e1',
    grid: 'rgba(148, 163, 184, 0.22)',
  },
};

export const SummaryTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const rowsAsignatura = useDashboardStore(state => state.rowsAsignatura);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const viewMode = useDashboardStore(state => state.viewMode);
  const themeMode = useThemeStore(state => state.mode);
  const chartTheme = chartThemeByMode[themeMode];

  // Active dataset for the pipeline
  const activeRows: (RowArea | RowAsignatura)[] = viewMode === 'area' ? rowsArea : rowsAsignatura;

  // Empty filters as we want full group-isolated aggregation in the dashboard view
  const emptyFilters = useMemo(() => ({ search: '', area: '', status: '' }), []);

  const { kpis } = useAnalysisPipeline(
    activeRows,
    selectedGrupo,
    emptyFilters,
    null,
    rowsArea || [],
    viewMode
  );

  // Compute stats for KPI cards using actual students
  const filteredStudents = useMemo(() => {
    if (selectedGrupo === 'Todos') return estudiantes;
    return estudiantes.filter(e => e.grupo === selectedGrupo);
  }, [estudiantes, selectedGrupo]);

  const studentKPIs = useMemo(() => {
    let aprobados = 0;
    let perdidos = 0;

    filteredStudents.forEach(student => {
      let failedAreasCount = 0;
      Object.values(student.areas).forEach(area => {
        if (area.areaStats && area.areaStats.promedioActual < 3.0) {
          failedAreasCount++;
        }
      });

      if (failedAreasCount === 0) aprobados++;
      if (failedAreasCount >= 3) perdidos++;
    });

    return {
      aprobadosCount: aprobados,
      aprobadosPorcentaje: filteredStudents.length > 0 ? (aprobados / filteredStudents.length) * 100 : 0,
      alumnosCriticosCount: perdidos,
      totalStudents: filteredStudents.length
    };
  }, [filteredStudents]);

  // Compute dataset for charts based on filteredRows (activeRows after group filtering)
  const filteredRows = useMemo(() => {
    return activeRows.filter(row => {
      if (selectedGrupo !== 'Todos' && row.grupo !== selectedGrupo) {
        return false;
      }
      return true;
    });
  }, [activeRows, selectedGrupo]);

  const { areaChartData, statusChartData } = useMemo(() => {
    const itemAverages: Record<string, { total: number; count: number }> = {};
    let aprobados = 0;
    let reprobados = 0;

    filteredRows.forEach(row => {
      const key = viewMode === 'area' ? (row as RowArea).area : (row as RowAsignatura).asignatura;
      if (key) {
        if (!itemAverages[key]) {
          itemAverages[key] = { total: 0, count: 0 };
        }
        if (row.promActual !== null && row.promActual !== undefined) {
          itemAverages[key].total += row.promActual;
          itemAverages[key].count += 1;
        }
      }

      if (row.promActual !== null && row.promActual >= 3.0) {
        aprobados++;
      } else if (row.promActual !== null && row.promActual < 3.0) {
        reprobados++;
      }
    });

    const labels = Object.keys(itemAverages).sort();
    const data = labels.map(label => 
      itemAverages[label].count > 0 
        ? roundToOneDecimal(itemAverages[label].total / itemAverages[label].count) 
        : 0
    );

    return {
      areaChartData: {
        labels,
        datasets: [
          {
            label: viewMode === 'area' ? 'Promedio por Área' : 'Promedio por Asignatura',
            data,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
          },
        ],
      },
      statusChartData: {
        labels: ['Aprobados', 'Reprobados'],
        datasets: [
          {
            data: [aprobados, reprobados],
            backgroundColor: [
              'rgba(34, 197, 94, 0.5)',
              'rgba(239, 68, 68, 0.5)',
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(239, 68, 68)',
            ],
            borderWidth: 1,
          },
        ],
      }
    };
  }, [filteredRows, viewMode]);

  const groupComparisonChartData = useMemo(() => {
    // We pass an empty config as PeriodConfig is not heavily used in this basic aggregation
    const report = generateGroupComparisonReport(estudiantes, {} as unknown as PeriodConfig);
    
    // Sort groups alphanumerically
    const sortedGroups = report.groups.sort((a, b) => a.grupo.localeCompare(b.grupo));
    
    const labels = sortedGroups.map(g => `Grupo ${g.grupo}`);
    const data = sortedGroups.map(g => g.average);
    
    return {
      labels,
      datasets: [
        {
          label: 'Promedio General del Grupo',
          data,
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1,
        }
      ]
    };
  }, [estudiantes]);

  if (estudiantes.length === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos para visualizar. Cargue un archivo Excel.</div>;
  }

  const barChartTitle = viewMode === 'area' ? 'Promedio General por Área' : 'Promedio General por Asignatura';
  const statusChartTitle = `Distribución de Estados ${viewMode === 'area' ? 'Por Área' : 'Por Asignatura'}`;
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTheme.text,
        },
      },
    },
  };

  return (
    <div className="px-6 pb-6 app-text">
      <h2 className="text-lg font-medium mb-6 app-text">Visualización de Rendimiento</h2>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="app-surface p-6 rounded-2xl border app-border shadow-premium flex flex-col justify-between transition-all duration-300 hover:scale-[1.025] hover:shadow-md">
          <span className="text-xs font-bold app-text-muted uppercase tracking-wider">Promedio Grupal</span>
          <span className="text-4xl font-extrabold app-text mt-3 tracking-premium">{roundToOneDecimal(kpis.promedioGeneral).toFixed(1)}</span>
          <span className="text-[11px] font-semibold app-text-muted mt-2">Media aritmética del grupo activo</span>
        </div>
        <div className="app-surface p-6 rounded-2xl border app-border shadow-premium flex flex-col justify-between transition-all duration-300 hover:scale-[1.025] hover:shadow-md">
          <span className="text-xs font-bold app-text-muted uppercase tracking-wider">Aprobados</span>
          <span className="text-4xl font-extrabold text-emerald-600 mt-3 tracking-premium">{studentKPIs.aprobadosPorcentaje.toFixed(1)}%</span>
          <span className="text-[11px] font-semibold app-text-muted mt-2">{studentKPIs.aprobadosCount} de {studentKPIs.totalStudents} alumnos con 0 áreas perdidas</span>
        </div>
        <div className="app-surface p-6 rounded-2xl border app-border shadow-premium flex flex-col justify-between transition-all duration-300 hover:scale-[1.025] hover:shadow-md">
          <span className="text-xs font-bold app-text-muted uppercase tracking-wider">Alumnos Críticos</span>
          <span className="text-4xl font-extrabold text-rose-600 mt-3 tracking-premium">{studentKPIs.alumnosCriticosCount}</span>
          <span className="text-[11px] font-semibold app-text-muted mt-2">Con 3 o más áreas perdidas (Regla de Oro)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="app-surface p-4 rounded-lg border app-border shadow-sm" role="region" aria-label={barChartTitle}>
          <h3 className="text-sm font-medium app-text mb-4 text-center">
            {barChartTitle}
          </h3>
          <div className="h-64">
            <Bar 
              data={areaChartData} 
              options={{ 
                ...commonChartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                      color: chartTheme.text,
                    },
                    grid: {
                      color: chartTheme.grid,
                    },
                  },
                  x: {
                    ticks: {
                      color: chartTheme.text,
                    },
                    grid: {
                      color: chartTheme.grid,
                    },
                  }
                }
              }} 
              plugins={[thresholdLinePlugin]}
            />
          </div>
        </section>
        <section className="app-surface p-4 rounded-lg border app-border shadow-sm" role="region" aria-label={statusChartTitle}>
          <h3 className="text-sm font-medium app-text mb-4 text-center">Distribución de Estados ({viewMode === 'area' ? 'Por Área' : 'Por Asignatura'})</h3>
          <div className="h-64 flex justify-center">
            <Pie 
              data={statusChartData} 
              options={commonChartOptions} 
            />
          </div>
        </section>
      </div>

      <div className="mt-8">
        <section className="app-surface p-4 rounded-lg border app-border shadow-sm" role="region" aria-label="Comparativa de Grupos">
          <h3 className="text-sm font-medium app-text mb-4 text-center">Comparativa de Promedios entre Grupos</h3>
          <div className="h-72">
            <Bar 
              data={groupComparisonChartData} 
              options={{ 
                ...commonChartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                      color: chartTheme.text,
                    },
                    grid: {
                      color: chartTheme.grid,
                    },
                  },
                  x: {
                    ticks: {
                      color: chartTheme.text,
                    },
                    grid: {
                      color: chartTheme.grid,
                    },
                  }
                }
              }} 
              plugins={[thresholdLinePlugin]}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
