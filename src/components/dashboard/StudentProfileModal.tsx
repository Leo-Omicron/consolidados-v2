import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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

interface StudentProfileModalProps {
  profileData: StudentProfileData | null;
  isOpen: boolean;
  onClose: () => void;
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

const PRINTING_STUDENT_PROFILE_CLASS = 'printing-student-profile';

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

const radarOptions = {
  responsive: true,
  maintainAspectRatio: true,
  animation: false as const,
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
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  profileData,
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap: focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handlePrint = useCallback(() => {
    document.body.classList.add(PRINTING_STUDENT_PROFILE_CLASS);

    const cleanupPrintClass = () => {
      document.body.classList.remove(PRINTING_STUDENT_PROFILE_CLASS);
      window.removeEventListener('afterprint', cleanupPrintClass);
    };

    window.addEventListener('afterprint', cleanupPrintClass);
    window.print();
    window.setTimeout(cleanupPrintClass, 1000);
  }, []);

  if (!isOpen || !profileData) return null;

  const radarData = buildRadarData(profileData);
  const hasChartData = radarData !== null;

  const modalContent = (
    <div
      data-student-profile-overlay
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:static print:bg-transparent print:backdrop-blur-none"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        data-student-profile-print-root
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${profileData.studentName}`}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl print:shadow-none print:max-h-none print:w-full print:max-w-none print:rounded-none print:border-none print:overflow-visible"
      >
        {/* ── Projection Banner ── */}
        {profileData.isSimulated && (
          <div className="sticky top-0 z-10 bg-amber-100 dark:bg-amber-900/50 border-b border-amber-300 dark:border-amber-700 px-6 py-3 text-center print:hidden">
            <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide text-sm">
              ⚠️ Modo Proyección — Simulaciones Activas
            </span>
          </div>
        )}

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between print:relative">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {profileData.studentName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Grupo {profileData.grupo}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 transition-colors"
              aria-label="Imprimir Ficha"
            >
              🖨️ Imprimir Ficha
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 focus:outline-2 focus:outline-offset-2 focus:outline-slate-400 transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-6 space-y-6 print:space-y-4">
          {/* Academic Summary — Area Grades Table */}
          <section>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Rendimiento por Área
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-slate-400">
                    <th className="text-left py-2 pr-4 font-medium">Área</th>
                    <th className="text-center py-2 px-2 font-medium">Nota</th>
                    <th className="text-center py-2 pl-2 font-medium">Promedio Grupo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {Object.entries(profileData.areaGrades).map(([area, grade]) => (
                    <tr key={area}>
                      <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">
                        {area}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {grade.toFixed(2)}
                      </td>
                      <td className="py-2 pl-2 text-center font-mono text-slate-500 dark:text-slate-400">
                        {profileData.groupAverages[area]?.toFixed(2) ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Strengths & Improvement Areas */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                💪 Fortalezas
              </h4>
              {profileData.fortalezas.length > 0 ? (
                <ul className="space-y-1">
                  {profileData.fortalezas.map((area) => (
                    <li
                      key={area}
                      className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400"
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
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                📉 Puntos a Mejorar
              </h4>
              {profileData.puntosMejora.length > 0 ? (
                <ul className="space-y-1">
                  {profileData.puntosMejora.map((area) => (
                    <li
                      key={area}
                      className="flex justify-between text-sm text-amber-700 dark:text-amber-400"
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

          {/* Oracle Insight */}
          {profileData.insight && (
            <section className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔮</span>
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">
                  Oráculo — {profileData.arquetipo}
                </h4>
              </div>
              <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
                {profileData.insight}
              </p>
            </section>
          )}

          {/* Radar Chart */}
          <section>
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
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
