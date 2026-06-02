import React, { useMemo, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAnalysisPipeline } from '../../hooks/useAnalysisPipeline';
import { useThemeStore } from '../../store/useThemeStore';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { roundToOneDecimal, PASSING_GRADE } from '../../services/academicLogic';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export const BattleTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const availableGroups = useDashboardStore(state => state.availableGroups);
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const themeMode = useThemeStore(state => state.mode);

  const [groupA, setGroupA] = useState<string>(availableGroups[0] || '');
  const [groupB, setGroupB] = useState<string>(availableGroups[1] || availableGroups[0] || '');

  const emptyFilters = useMemo(() => ({ search: '', area: '', status: '' }), []);

  const { kpis: kpisA } = useAnalysisPipeline(rowsArea, groupA, emptyFilters, null, rowsArea || [], 'area');
  const { kpis: kpisB } = useAnalysisPipeline(rowsArea, groupB, emptyFilters, null, rowsArea || [], 'area');

  const chartTheme = {
    text: themeMode === 'dark' ? '#cbd5e1' : '#475569',
    grid: themeMode === 'dark' ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.28)',
    angleLines: themeMode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)',
  };

  if (availableGroups.length < 2) {
    return (
      <div className="p-8 text-center app-text-muted">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Batalla de Grupos no disponible</h2>
        <p>Necesitas cargar un archivo que contenga al menos 2 grupos diferentes para poder compararlos.</p>
      </div>
    );
  }

  // Calculate radar chart data (Averages by Area)
  const getAreaAverages = (rows: typeof rowsArea, groupFilter: string) => {
    const areaSums: Record<string, { total: number; count: number }> = {};
    rows.forEach(r => {
      if (r.grupo === groupFilter && r.promActual !== null && r.promActual !== undefined) {
        if (!areaSums[r.area]) areaSums[r.area] = { total: 0, count: 0 };
        areaSums[r.area].total += r.promActual;
        areaSums[r.area].count += 1;
      }
    });
    return areaSums;
  };

  const avgA = getAreaAverages(rowsArea, groupA);
  const avgB = getAreaAverages(rowsArea, groupB);

  // Union of all areas
  const allAreas = Array.from(new Set([...Object.keys(avgA), ...Object.keys(avgB)])).sort();

  const radarData = {
    labels: allAreas.map(a => a.length > 15 ? a.substring(0, 15) + '...' : a),
    datasets: [
      {
        label: `Grupo ${groupA}`,
        data: allAreas.map(a => avgA[a] ? roundToOneDecimal(avgA[a].total / avgA[a].count) : 0),
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      },
      {
        label: `Grupo ${groupB}`,
        data: allAreas.map(a => avgB[a] ? roundToOneDecimal(avgB[a].total / avgB[a].count) : 0),
        backgroundColor: 'rgba(239, 68, 68, 0.2)', // Red
        borderColor: 'rgb(239, 68, 68)',
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(239, 68, 68)'
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: chartTheme.angleLines },
        grid: { color: chartTheme.grid },
        pointLabels: { color: chartTheme.text, font: { size: 11 } },
        ticks: { color: chartTheme.text, backdropColor: 'transparent', min: 0, max: 5 }
      }
    },
    plugins: {
      legend: { labels: { color: chartTheme.text } }
    }
  };

  // Stacked Bar Data for Distribution based on Students
  const getStudentDistribution = (groupFilter: string) => {
    const students = estudiantes.filter(s => s.grupo === groupFilter);
    let aprobados = 0;
    let enRiesgo = 0;
    let perdidos = 0;

    students.forEach(student => {
      let failedAreasCount = 0;
      Object.values(student.areas).forEach(area => {
        if (area.areaStats && area.areaStats.promedioActual < PASSING_GRADE) {
          failedAreasCount++;
        }
      });

      if (failedAreasCount === 0) aprobados++;
      else if (failedAreasCount <= 2) enRiesgo++;
      else perdidos++;
    });

    const total = students.length || 1;
    return {
      Ganado: (aprobados / total) * 100,
      Riesgo: (enRiesgo / total) * 100,
      Perdido: (perdidos / total) * 100,
      countGanado: aprobados,
      countPerdido: perdidos
    };
  };

  const distA = getStudentDistribution(groupA);
  const distB = getStudentDistribution(groupB);

  const barData = {
    labels: [`Grupo ${groupA}`, `Grupo ${groupB}`],
    datasets: [
      {
        label: 'Aprobados (%)',
        data: [distA.Ganado, distB.Ganado],
        backgroundColor: 'rgba(34, 197, 94, 0.7)', // Emerald
      },
      {
        label: 'En Riesgo (%)',
        data: [distA.Riesgo, distB.Riesgo],
        backgroundColor: 'rgba(245, 158, 11, 0.7)', // Amber
      },
      {
        label: 'Perdidos (%)',
        data: [distA.Perdido, distB.Perdido],
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: { color: chartTheme.text },
        grid: { display: false }
      },
      y: {
        stacked: true,
        max: 100,
        ticks: { color: chartTheme.text },
        grid: { color: chartTheme.grid }
      }
    },
    plugins: {
      legend: { labels: { color: chartTheme.text } },
      tooltip: {
        callbacks: {
          label: function(context: { dataset: { label?: string }; raw: unknown }) {
            return `${context.dataset.label}: ${(context.raw as number).toFixed(1)}%`;
          }
        }
      }
    }
  };

  return (
    <div className="px-6 pb-6 app-text">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold app-text tracking-tight flex items-center gap-2">
            <span>⚔️</span> Batalla de Grupos
          </h2>
          <p className="text-sm app-text-muted mt-1">Comparativa directa de rendimiento y métricas</p>
        </div>

        <div className="flex gap-4 items-center bg-white dark:bg-neutral-900 p-2 rounded-xl border app-border shadow-sm">
          <select
            value={groupA}
            onChange={(e) => setGroupA(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-none font-bold shadow-sm focus:ring-0 cursor-pointer"
          >
            {availableGroups.map((g) => <option key={g} value={g} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">Grupo {g}</option>)}
          </select>
          <span className="font-black text-neutral-300 dark:text-neutral-600 italic">VS</span>
          <select
            value={groupB}
            onChange={(e) => setGroupB(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-none font-bold shadow-sm focus:ring-0 cursor-pointer"
          >
            {availableGroups.map((g) => <option key={g} value={g} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">Grupo {g}</option>)}
          </select>
        </div>
      </div>

      {/* Versus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="app-surface p-5 rounded-2xl border app-border shadow-premium flex flex-col items-center">
          <span className="text-[10px] font-bold app-text-muted uppercase tracking-wider mb-2">Promedio General</span>
          <div className="flex items-center w-full justify-between mt-2">
            <span className={`text-3xl font-black ${kpisA.promedioGeneral > kpisB.promedioGeneral ? 'text-blue-500' : 'app-text-muted'}`}>
              {kpisA.promedioGeneral.toFixed(2)}
            </span>
            <span className="text-sm font-bold text-neutral-300">VS</span>
            <span className={`text-3xl font-black ${kpisB.promedioGeneral > kpisA.promedioGeneral ? 'text-rose-500' : 'app-text-muted'}`}>
              {kpisB.promedioGeneral.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="app-surface p-5 rounded-2xl border app-border shadow-premium flex flex-col items-center">
          <span className="text-[10px] font-bold app-text-muted uppercase tracking-wider mb-2">Alumnos Críticos</span>
          <div className="flex items-center w-full justify-between mt-2">
            <span className={`text-3xl font-black ${distA.countPerdido < distB.countPerdido ? 'text-blue-500' : 'app-text-muted'}`}>
              {distA.countPerdido}
            </span>
            <span className="text-sm font-bold text-neutral-300">VS</span>
            <span className={`text-3xl font-black ${distB.countPerdido < distA.countPerdido ? 'text-rose-500' : 'app-text-muted'}`}>
              {distB.countPerdido}
            </span>
          </div>
        </div>

        <div className="app-surface p-5 rounded-2xl border app-border shadow-premium flex flex-col items-center">
          <span className="text-[10px] font-bold app-text-muted uppercase tracking-wider mb-2">Tasa de Aprobación</span>
          <div className="flex items-center w-full justify-between mt-2">
            <span className={`text-3xl font-black ${distA.Ganado > distB.Ganado ? 'text-blue-500' : 'app-text-muted'}`}>
              {distA.Ganado.toFixed(0)}%
            </span>
            <span className="text-sm font-bold text-neutral-300">VS</span>
            <span className={`text-3xl font-black ${distB.Ganado > distA.Ganado ? 'text-rose-500' : 'app-text-muted'}`}>
              {distB.Ganado.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="app-surface p-6 rounded-2xl border app-border shadow-premium" role="region" aria-label="Fortalezas por Área">
          <h3 className="text-sm font-bold app-text mb-4 text-center uppercase tracking-wider">Radar de Fortalezas por Área</h3>
          <div className="h-80">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </section>

        <section className="app-surface p-6 rounded-2xl border app-border shadow-premium" role="region" aria-label="Distribución de Estados">
          <h3 className="text-sm font-bold app-text mb-4 text-center uppercase tracking-wider">Proporción de Aprobados vs Reprobados</h3>
          <div className="h-80">
            <Bar data={barData} options={barOptions} />
          </div>
        </section>
      </div>
    </div>
  );
};
