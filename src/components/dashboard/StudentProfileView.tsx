import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { StudentProfileData } from '../../services/studentProfileService';

// Register Chart.js components for radar charts
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StudentProfileViewProps {
  profileData: StudentProfileData;
  /** Disables Chart.js animations, useful for batch printing */
  disableAnimations?: boolean;
}

// ---------------------------------------------------------------------------
// Chart Helpers
// ---------------------------------------------------------------------------

const CHART_COLORS = {
  student: 'rgba(59, 130, 246, 0.8)', // blue
  studentFill: 'rgba(59, 130, 246, 0.15)',
  group: 'rgba(239, 68, 68, 0.7)', // red
  groupFill: 'rgba(239, 68, 68, 0.1)',
};

function buildRadarData(profile: StudentProfileData) {
  const labels = Object.keys(profile.areaGrades);
  if (labels.length === 0) return null;

  return {
    labels,
    datasets: [
      {
        label: profile.studentName,
        data: labels.map((area) => profile.areaGrades[area]),
        borderColor: CHART_COLORS.student,
        backgroundColor: CHART_COLORS.studentFill,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: CHART_COLORS.student,
      },
      {
        label: `Promedio grupo ${profile.grupo}`,
        data: labels.map((area) => profile.groupAverages[area] ?? 0),
        borderColor: CHART_COLORS.group,
        backgroundColor: CHART_COLORS.groupFill,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 3,
        pointBackgroundColor: CHART_COLORS.group,
      },
    ],
  };
}

const getRadarOptions = (disableAnimations: boolean) => ({
  responsive: true,
  maintainAspectRatio: true,
  animation: disableAnimations ? (false as const) : undefined,
  scales: {
    r: {
      beginAtZero: true,
      min: 0,
      max: 5,
      ticks: {
        stepSize: 1,
        font: { size: 11 },
        backdropColor: 'transparent',
      },
      pointLabels: {
        font: { size: 12, weight: 'bold' as const },
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.3)',
      },
    },
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: { size: 12 },
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: { dataset: { label?: string }; raw: unknown }) => {
          return `${ctx.dataset.label}: ${(ctx.raw as number).toFixed(2)}`;
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  profileData,
  disableAnimations = false,
}) => {
  const radarData = buildRadarData(profileData);
  const hasChartData = radarData !== null;
  const radarOptions = React.useMemo(() => getRadarOptions(disableAnimations), [disableAnimations]);

  return (
    <div className="px-6 py-6 space-y-6 print:space-y-4 print:p-0">
      {/* Academic Summary — Area Grades Table */}
      <section>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Rendimiento por Área
        </h3>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-slate-400">
                <th className="text-left py-2 pr-4 font-medium">Área</th>
                <th className="text-center py-2 px-2 font-medium">Nota</th>
                <th className="text-center py-2 pl-2 font-medium">Promedio Grupo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 print:divide-slate-200">
              {Object.entries(profileData.areaGrades).map(([area, grade]) => (
                <tr key={area}>
                  <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200 print:text-slate-900">
                    {area}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 print:text-slate-800">
                    {grade.toFixed(2)}
                  </td>
                  <td className="py-2 pl-2 text-center font-mono text-slate-500 dark:text-slate-400 print:text-slate-600">
                    {profileData.groupAverages[area]?.toFixed(2) ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strengths & Improvement Areas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-6">
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 print:border-emerald-300 print:bg-emerald-50/50">
          <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 print:text-emerald-900 mb-2">
            💪 Fortalezas
          </h4>
          {profileData.fortalezas.length > 0 ? (
            <ul className="space-y-1">
              {profileData.fortalezas.map((area) => (
                <li
                  key={area}
                  className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400 print:text-emerald-800"
                >
                  <span>{area}</span>
                  <span className="font-mono font-semibold">
                    {profileData.areaGrades[area]?.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Sin áreas destacadas por encima de 3.5.</p>
          )}
        </div>
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 print:border-amber-300 print:bg-amber-50/50">
          <h4 className="font-semibold text-amber-800 dark:text-amber-300 print:text-amber-900 mb-2">
            📉 Puntos a Mejorar
          </h4>
          {profileData.puntosMejora.length > 0 ? (
            <ul className="space-y-1">
              {profileData.puntosMejora.map((area) => (
                <li
                  key={area}
                  className="flex justify-between text-sm text-amber-700 dark:text-amber-400 print:text-amber-800"
                >
                  <span>{area}</span>
                  <span className="font-mono font-semibold">
                    {profileData.areaGrades[area]?.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No hay áreas por debajo de 3.5.</p>
          )}
        </div>
      </section>

      {/* Pedagogical insight */}
      {profileData.insight && (
        <section className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-4 print:border-indigo-300 print:bg-indigo-50/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔮</span>
            <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 print:text-indigo-900">
              Diagnóstico Pedagógico — {profileData.arquetipo}
            </h4>
          </div>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 print:text-indigo-800 leading-relaxed">
            {profileData.insight}
          </p>
        </section>
      )}

      {/* Radar Chart */}
      <section className="print:break-inside-avoid">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Comparativa vs Grupo
        </h3>
        {hasChartData ? (
          <div className="w-full max-w-md mx-auto">
            <Radar data={radarData} options={radarOptions} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed border-slate-300 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-800/50">
            <span className="text-3xl mb-2">📊</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No hay suficientes calificaciones para generar el gráfico.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
