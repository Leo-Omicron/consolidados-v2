import React, { useMemo } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAnalysisPipeline } from '../../hooks/useAnalysisPipeline';
import { roundToOneDecimal } from '../../services/academicLogic';
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
const thresholdLinePlugin = {
  id: 'thresholdLine',
  afterDraw: (chart: any) => {
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

export const ChartsTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const rowsAsignatura = useDashboardStore(state => state.rowsAsignatura);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const viewMode = useDashboardStore(state => state.viewMode);

  // Active dataset for the pipeline
  const activeRows: any[] = viewMode === 'area' ? rowsArea : rowsAsignatura;

  // Empty filters as we want full group-isolated aggregation in the dashboard view
  const emptyFilters = useMemo(() => ({ search: '', area: '', status: '' }), []);

  const { groupedAndSorted, kpis } = useAnalysisPipeline(
    activeRows,
    selectedGrupo,
    emptyFilters,
    null,
    viewMode
  );

  // Compute stats for KPI cards
  const totalStudents = groupedAndSorted.length;
  const aprobadosCount = groupedAndSorted.filter(g => {
    const avg = g.aggregates.promActual;
    return avg !== null && avg >= 3.0;
  }).length;

  const aprobadosPorcentaje = totalStudents > 0
    ? (aprobadosCount / totalStudents) * 100
    : 0;

  const alumnosCriticosCount = groupedAndSorted.filter(g => g.isReprobado === true).length;

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
      const key = viewMode === 'area' ? row.area : row.asignatura;
      if (key) {
        if (!itemAverages[key]) {
          itemAverages[key] = { total: 0, count: 0 };
        }
        if (row.promActual !== null && row.promActual !== undefined) {
          itemAverages[key].total += row.promActual;
          itemAverages[key].count += 1;
        }
      }

      if (row.estado && (row.estado.color === 'green' || row.estado.text === 'Ganado')) {
        aprobados++;
      } else {
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

  if (estudiantes.length === 0) {
    return <div className="p-8 text-center text-gray-500">No hay datos para visualizar. Cargue un archivo Excel.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-6">Visualización de Rendimiento</h2>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-premium flex flex-col justify-between transition-all duration-300 hover:scale-[1.025] hover:shadow-md hover:border-slate-300/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promedio Grupal</span>
          <span className="text-4xl font-extrabold text-slate-900 mt-3 tracking-premium">{roundToOneDecimal(kpis.promedioGeneral).toFixed(1)}</span>
          <span className="text-[11px] font-semibold text-slate-400 mt-2">Media aritmética del grupo activo</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-premium flex flex-col justify-between transition-all duration-300 hover:scale-[1.025] hover:shadow-md hover:border-slate-300/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aprobados</span>
          <span className="text-4xl font-extrabold text-emerald-600 mt-3 tracking-premium">{aprobadosPorcentaje.toFixed(1)}%</span>
          <span className="text-[11px] font-semibold text-slate-400 mt-2">{aprobadosCount} de {totalStudents} alumnos con promedio ≥ 3.0</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-premium flex flex-col justify-between transition-all duration-300 hover:scale-[1.025] hover:shadow-md hover:border-slate-300/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos Críticos</span>
          <span className="text-4xl font-extrabold text-rose-600 mt-3 tracking-premium">{alumnosCriticosCount}</span>
          <span className="text-[11px] font-semibold text-slate-400 mt-2">Con 3 o más áreas perdidas (Regla de Oro)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">
            {viewMode === 'area' ? 'Promedio General por Área' : 'Promedio General por Asignatura'}
          </h3>
          <div className="h-64">
            <Bar 
              data={areaChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 5
                  }
                }
              }} 
              plugins={[thresholdLinePlugin]}
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">Distribución de Estados ({viewMode === 'area' ? 'Por Área' : 'Por Asignatura'})</h3>
          <div className="h-64 flex justify-center">
            <Pie 
              data={statusChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false 
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
