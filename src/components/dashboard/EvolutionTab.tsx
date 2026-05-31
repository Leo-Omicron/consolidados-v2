import React, { useMemo, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { getGroupEvolution, getStudentEvolution } from '../../services/evolutionLogic';
import { useThemeStore } from '../../store/useThemeStore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const EvolutionTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const availableGroups = useDashboardStore(state => state.availableGroups);
  const setGrupo = useDashboardStore(state => state.setGrupo);
  const themeMode = useThemeStore(state => state.mode);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');

  const filteredStudents = useMemo(() => {
    if (selectedGrupo === 'Todos') return estudiantes;
    return estudiantes.filter(e => e.grupo === selectedGrupo);
  }, [estudiantes, selectedGrupo]);

  const groupEvolution = useMemo(() => {
    return getGroupEvolution(filteredStudents);
  }, [filteredStudents]);

  const studentEvolution = useMemo(() => {
    if (selectedStudentId === 'all') return null;
    const student = estudiantes.find(e => e.id === selectedStudentId);
    if (!student) return null;
    return getStudentEvolution(student);
  }, [estudiantes, selectedStudentId]);

  if (estudiantes.length === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos para visualizar. Cargue un archivo Excel.</div>;
  }

  const chartTheme = {
    text: themeMode === 'dark' ? '#cbd5e1' : '#475569',
    grid: themeMode === 'dark' ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.28)',
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: chartTheme.text }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: { color: chartTheme.text },
        grid: { color: chartTheme.grid }
      },
      x: {
        ticks: { color: chartTheme.text },
        grid: { color: chartTheme.grid }
      }
    }
  };

  // Prepare chart data
  const labels = ['P1', 'P2', 'P3', 'P4'];

  const globalChartData = {
    labels,
    datasets: [
      {
        label: studentEvolution ? `Promedio: ${studentEvolution.estudiante}` : `Promedio: Grupo ${selectedGrupo}`,
        data: studentEvolution 
          ? studentEvolution.globalEvolution.map(d => d.average)
          : groupEvolution.map(d => d.average),
        borderColor: 'rgb(99, 102, 241)', // Indigo-500
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointRadius: 5,
      }
    ]
  };

  const getAreaColors = (index: number) => {
    const colors = [
      'rgb(239, 68, 68)', // red
      'rgb(245, 158, 11)', // amber
      'rgb(16, 185, 129)', // emerald
      'rgb(59, 130, 246)', // blue
      'rgb(139, 92, 246)', // violet
      'rgb(236, 72, 153)', // pink
      'rgb(14, 165, 233)', // sky
      'rgb(249, 115, 22)', // orange
    ];
    return colors[index % colors.length];
  };

  const areasChartData = studentEvolution ? {
    labels,
    datasets: studentEvolution.areasEvolution.map((area, index) => ({
      label: area.areaName,
      data: area.data.map(d => d.average),
      borderColor: getAreaColors(index),
      backgroundColor: 'transparent',
      tension: 0.2,
      pointRadius: 3,
    }))
  } : null;

  return (
    <div className="px-6 pb-6 app-text">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold app-text tracking-tight">Tracking Longitudinal</h2>
          <p className="text-sm app-text-muted mt-1">Evolución de promedios a lo largo del año lectivo</p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <select
            value={selectedGrupo}
            onChange={(e) => {
              setGrupo(e.target.value);
              setSelectedStudentId('all');
            }}
            className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-900 border app-border text-sm font-medium shadow-sm transition-premium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="Todos">Todos los grupos</option>
            {availableGroups.map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>

          {selectedGrupo !== 'Todos' && (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-900 border app-border text-sm font-medium shadow-sm transition-premium focus:ring-2 focus:ring-indigo-500 focus:outline-none w-64"
            >
              <option value="all">Promedio del Grupo</option>
              {filteredStudents
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="app-surface p-6 rounded-2xl border app-border shadow-premium" role="region" aria-label="Evolución General">
          <h3 className="text-base font-bold app-text mb-4 text-center">Evolución General</h3>
          <div className="h-80">
            <Line data={globalChartData} options={commonOptions} />
          </div>
        </section>

        {studentEvolution ? (
          <section className="app-surface p-6 rounded-2xl border app-border shadow-premium" role="region" aria-label="Evolución por Área">
            <h3 className="text-base font-bold app-text mb-4 text-center">Desglose por Área</h3>
            <div className="h-80">
              <Line data={areasChartData!} options={commonOptions} />
            </div>
          </section>
        ) : (
          <section className="app-surface p-6 rounded-2xl border app-border shadow-premium flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold app-text mb-2">Selecciona un Estudiante</h3>
            <p className="text-sm app-text-muted max-w-sm">Para ver la evolución detallada área por área, selecciona un estudiante específico en el menú superior.</p>
          </section>
        )}
      </div>
    </div>
  );
};
