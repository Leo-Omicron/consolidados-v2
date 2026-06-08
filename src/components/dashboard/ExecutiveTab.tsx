import React, { useMemo, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { generateExecutiveReport } from '../../services/executiveAnalytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="relative group inline-block ml-2 align-middle">
    <svg className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2.5 bg-slate-800 dark:bg-slate-700 text-slate-100 text-xs rounded-lg shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
    </div>
  </div>
);

export const ExecutiveTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const availableGroups = useDashboardStore(state => state.availableGroups);

  const [selectedSede, setSelectedSede] = useState<string>('Todas');
  const [selectedJornada, setSelectedJornada] = useState<string>('Todas');

  const sedes = useMemo(() => {
    const sedeSet = new Set<string>();
    estudiantes.forEach(est => {
      if (est.sede) sedeSet.add(est.sede.toUpperCase());
    });
    return Array.from(sedeSet).sort();
  }, [estudiantes]);

  const jornadas = useMemo(() => {
    const jornadaSet = new Set<string>();
    estudiantes.forEach(est => {
      if (est.jornada) jornadaSet.add(est.jornada.toUpperCase());
    });
    return Array.from(jornadaSet).sort();
  }, [estudiantes]);

  const filteredEstudiantes = useMemo(() => {
    return estudiantes.filter(est => {
      if (selectedSede !== 'Todas') {
        if (!est.sede || est.sede.toUpperCase() !== selectedSede) return false;
      }
      if (selectedJornada !== 'Todas') {
        if (!est.jornada || est.jornada.toUpperCase() !== selectedJornada) return false;
      }
      return true;
    });
  }, [estudiantes, selectedSede, selectedJornada]);

  const report = useMemo(() => {
    if (filteredEstudiantes.length === 0) return null;
    return generateExecutiveReport(filteredEstudiantes);
  }, [filteredEstudiantes]);

  if (!estudiantes || estudiantes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 app-text-muted">
        No hay datos para mostrar. Carga un archivo consolidado primero.
      </div>
    );
  }

  // Real group count inside the current filter
  const realGroupsCount = report.groups.length;

  // Chart Data: Bar Chart
  const chartData = {
    labels: report.groups.map(g => g.groupName),
    datasets: [
      {
        label: 'Promedio Grupal',
        data: report.groups.map(g => g.average),
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: '% Aprobación',
        data: report.groups.map(g => g.passRate),
        backgroundColor: 'rgba(34, 197, 94, 0.7)', // green-500
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        yAxisID: 'y1',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#888'
        }
      },
    },
    scales: {
      x: {
        ticks: { color: '#888' },
        grid: { color: 'rgba(128, 128, 128, 0.1)' }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        max: 5,
        title: {
          display: true,
          text: 'Promedio',
          color: '#888'
        },
        ticks: { color: '#888' },
        grid: { color: 'rgba(128, 128, 128, 0.1)' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: '% Aprobación',
          color: '#888'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: { color: '#888' }
      },
    },
  };

  const donutData = {
    labels: ['Aprobados', 'Recuperables', 'En Riesgo'],
    datasets: [
      {
        data: [
          report.globalStatusDistribution.ganado,
          report.globalStatusDistribution.recuperable,
          report.globalStatusDistribution.enRiesgo
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // green
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(239, 68, 68, 0.8)',  // red
        ],
        borderWidth: 0,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#888' }
      }
    },
    cutout: '70%',
  };

  return (
    <div className="p-6 app-text animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold app-text">Dashboard Global Directivo</h2>
          <p className="text-sm app-text-muted mt-1">Visión panorámica de la institución ({realGroupsCount} cursos visibles)</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-blue-500/5 border border-blue-500/20 p-2.5 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold app-text-muted">Sede:</span>
            <select 
              className="bg-transparent border app-border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none app-text"
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
            >
              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Todas">Todas las Sedes</option>
              {sedes.map(s => <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold app-text-muted">Jornada:</span>
            <select 
              className="bg-transparent border app-border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none app-text"
              value={selectedJornada}
              onChange={(e) => setSelectedJornada(e.target.value)}
            >
              <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value="Todas">Todas las Jornadas</option>
              {jornadas.map(j => <option className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!report ? (
        <div className="app-surface p-12 rounded-xl border app-border text-center">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-xl font-bold app-text mb-2">Sin resultados</h3>
          <p className="app-text-muted">
            No se encontraron estudiantes para la Sede y Jornada seleccionadas.
          </p>
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <div className="app-surface p-5 rounded-xl border app-border shadow-premium flex flex-col justify-between">
          <div className="text-sm font-semibold app-text-muted uppercase tracking-wider mb-2">
            Estudiantes Totales
            <InfoTooltip text="Número total de estudiantes en los cursos seleccionados." />
          </div>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{report.totalStudents}</div>
        </div>
        <div className="app-surface p-5 rounded-xl border app-border shadow-premium flex flex-col justify-between">
          <div className="text-sm font-semibold app-text-muted uppercase tracking-wider mb-2">
            Promedio Institucional
            <InfoTooltip text="Promedio matemático de las notas definitivas de todos los estudiantes filtrados." />
          </div>
          <div className="text-4xl font-bold app-text">{report.globalAverage}</div>
        </div>
        <div className="app-surface p-5 rounded-xl border app-border shadow-premium flex flex-col justify-between">
          <div className="text-sm font-semibold app-text-muted uppercase tracking-wider mb-2">
            Aprobación Global
            <InfoTooltip text="Porcentaje de estudiantes cuyo estado proyectado es 'Aprobado' (Ganan el año en limpio)." />
          </div>
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">{report.globalPassRate}%</div>
        </div>
        <div className="app-surface p-5 rounded-xl border app-border shadow-premium flex flex-col justify-between">
          <div className="text-sm font-semibold app-text-muted uppercase tracking-wider mb-2">
            Total en Riesgo
            <InfoTooltip text="Sumatoria de estudiantes en estado 'En riesgo' (pierden más de 2 áreas) o 'Recuperable' (pierden 1 o 2 áreas)." />
          </div>
          <div className="text-4xl font-bold text-red-600 dark:text-red-400">{report.totalAtRisk}</div>
          <p className="text-xs app-text-muted mt-2">Estudiantes que podrían perder el año</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Main Chart */}
        <div className="xl:col-span-2 app-surface p-6 rounded-xl border app-border shadow-premium">
          <h3 className="text-lg font-bold app-text mb-4">Rendimiento Comparativo por Curso</h3>
          <div className="h-[400px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Critical Areas Ranking */}
        <div className="app-surface p-6 rounded-xl border app-border shadow-premium flex flex-col">
          <h3 className="text-lg font-bold app-text mb-4">Áreas Institucionales Críticas</h3>
          <p className="text-sm app-text-muted mb-4">Sumatoria de estudiantes reprobados por área en todos los cursos.</p>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {report.criticalAreas.map((area, index) => {
              // Calculate percentage of total students failing this area
              const failRate = ((area.failureCount / report.totalStudents) * 100).toFixed(1);
              
              return (
                <div key={area.areaName} className="app-surface-muted p-3 rounded-lg flex items-center justify-between border app-border">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-sm truncate" title={area.areaName}>{area.areaName}</div>
                      <div className="text-xs app-text-muted">{area.failureCount} reprobados</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-red-500 whitespace-nowrap ml-2">
                    {failRate}%
                  </div>
                </div>
              );
            })}
            
            {report.criticalAreas.length === 0 && (
              <div className="text-center py-8 text-sm app-text-muted">
                No hay áreas perdidas en la institución.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* State Distribution Donut Chart */}
        <div className="app-surface p-6 rounded-xl border app-border shadow-premium flex flex-col">
          <h3 className="text-lg font-bold app-text mb-4">
            Distribución de Estados
            <InfoTooltip text="Proporción institucional de estudiantes según su estado académico actual." />
          </h3>
          <div className="flex-1 relative min-h-[250px]">
            <Doughnut data={donutData} options={donutOptions} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-3xl font-bold app-text">{report.totalStudents}</div>
                <div className="text-xs app-text-muted">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Honor Roll */}
        <div className="md:col-span-2 app-surface p-6 rounded-xl border app-border shadow-premium flex flex-col">
          <h3 className="text-lg font-bold app-text mb-4 flex items-center gap-2">
            🏆 Cuadro de Honor Institucional
            <InfoTooltip text="Los 5 estudiantes con el mejor promedio ponderado entre todos los cursos filtrados." />
          </h3>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b app-border text-sm app-text-muted">
                  <th className="py-3 px-4 font-semibold w-16">Puesto</th>
                  <th className="py-3 px-4 font-semibold">Estudiante</th>
                  <th className="py-3 px-4 font-semibold">Curso</th>
                  <th className="py-3 px-4 font-semibold text-right">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {report.topStudents.map((student, index) => (
                  <tr key={student.id} className="border-b app-border last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' :
                        index === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                        index === 2 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-600' :
                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        #{index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium app-text truncate max-w-[200px]" title={student.name}>
                      {student.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                        {student.grupo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-lg text-green-600 dark:text-green-400">
                        {student.average}
                      </span>
                    </td>
                  </tr>
                ))}
                {report.topStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm app-text-muted">
                      No hay estudiantes para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      )}

    </div>
  );
};
