import React, { useMemo, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';

export const HeatmapTab: React.FC = () => {
  const rowsAsignatura = useDashboardStore((state) => state.rowsAsignatura);
  const selectedGrupo = useDashboardStore((state) => state.selectedGrupo);
  const setGrupo = useDashboardStore((state) => state.setGrupo);
  const availableGroups = useDashboardStore((state) => state.availableGroups);
  
  const [colorMode, setColorMode] = useState<'status' | 'heatmap'>('heatmap');

  const filteredRows = useMemo(() => {
    if (selectedGrupo === 'Todos') return rowsAsignatura;
    return rowsAsignatura.filter((r) => r.grupo === selectedGrupo);
  }, [rowsAsignatura, selectedGrupo]);

  const { uniqueStudents, uniqueAsignaturas, matrix } = useMemo(() => {
    const studentsSet = new Set<string>();
    const asignaturasSet = new Set<string>();
    
    filteredRows.forEach(row => {
      studentsSet.add(row.estudiante);
      if (row.asignatura) asignaturasSet.add(row.asignatura);
    });

    const uniqueStudents = Array.from(studentsSet).sort();
    const uniqueAsignaturas = Array.from(asignaturasSet).sort();

    // Build Matrix: matrix[student][asignatura] = { value, status }
    const matrix: Record<string, Record<string, { value: number | null, text: string }>> = {};
    
    uniqueStudents.forEach(st => {
      matrix[st] = {};
    });

    filteredRows.forEach(row => {
      if (row.asignatura) {
        matrix[row.estudiante][row.asignatura] = {
          value: row.promActual,
          text: row.estado.text
        };
      }
    });

    return { uniqueStudents, uniqueAsignaturas, matrix };
  }, [filteredRows]);

  const getCellColor = (val: number | null, text: string) => {
    if (val === null || val === undefined) return 'bg-neutral-100 dark:bg-neutral-800 text-transparent';
    
    if (colorMode === 'status') {
      if (text === 'Perdido') return 'bg-rose-500 text-white';
      if (text === 'En riesgo') return 'bg-amber-400 text-amber-950';
      if (text === 'Aprobado') return 'bg-emerald-400 text-emerald-950';
      if (text === 'Excelente') return 'bg-blue-500 text-white';
      return 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200';
    } else {
      // Heatmap mode based on numeric value
      if (val < 2.0) return 'bg-red-600 text-white';
      if (val < 3.0) return 'bg-rose-400 text-rose-950';
      if (val < 3.5) return 'bg-amber-300 text-amber-950';
      if (val < 4.0) return 'bg-yellow-200 text-yellow-900';
      if (val < 4.5) return 'bg-emerald-300 text-emerald-950';
      return 'bg-emerald-500 text-white';
    }
  };

  const getDesempeno = (val: number) => {
    if (val < 3.0) return 'Bajo';
    if (val < 4.0) return 'Básico';
    if (val < 4.6) return 'Alto';
    return 'Superior';
  };

  if (filteredRows.length === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos para mostrar el Mapa de Calor.</div>;
  }

  return (
    <div className="p-6 app-text">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold app-text flex items-center gap-2">
            🗺️ Mapa de Calor de Mortalidad Académica
          </h2>
          <p className="text-sm app-text-muted mt-1">
            Visualiza de un plumazo qué asignaturas son "mata-estudiantes" y quiénes están hundidos.
          </p>
        </div>
        
        <div className="flex gap-3">
          <select 
            aria-label="Seleccionar grupo"
            className="border app-control app-focus rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-premium"
            value={selectedGrupo}
            onChange={e => setGrupo(e.target.value)}
          >
            {availableGroups.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los grupos' : `Grupo ${g}`}</option>)}
          </select>

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border app-border">
            <button
              onClick={() => setColorMode('heatmap')}
              title="Escala de colores según el promedio numérico (ej. <3.0 rojo, >=4.0 verde)"
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${colorMode === 'heatmap' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500'}`}
            >
              🔥 Calor Numérico
            </button>
            <button
              onClick={() => setColorMode('status')}
              title="Colores basados en el estado final: Aprobado, En riesgo, Perdido, etc."
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${colorMode === 'status' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-neutral-500'}`}
            >
              🚦 Estado
            </button>
          </div>
        </div>
      </div>

      <div className="app-surface rounded-xl shadow-sm border app-border overflow-hidden">
        <div className="overflow-x-auto max-h-[700px] overflow-y-auto heatmap-scroll">
          <table className="min-w-max border-collapse text-sm">
            <thead className="sticky top-0 z-20 app-surface-muted shadow-sm">
              <tr>
                <th className="sticky left-0 z-30 app-surface-muted px-4 py-3 text-left font-bold border-b border-r app-border min-w-[250px] shadow-[1px_0_0_var(--color-border)]">
                  Estudiante ({uniqueStudents.length})
                </th>
                {uniqueAsignaturas.map(asig => (
                  <th key={asig} className="px-2 py-3 border-b app-border text-center">
                    <div className="writing-vertical-rl transform rotate-180 h-32 text-xs whitespace-nowrap overflow-hidden text-ellipsis font-semibold app-text-muted">
                      {asig}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y app-divide">
              {uniqueStudents.map(student => {
                const studentData = matrix[student];
                // Check if student is generally "hundido" (failing many subjects)
                const failingCount = Object.values(studentData).filter(s => s.value !== null && s.value < 3.0).length;
                const isHundido = failingCount >= 3;

                return (
                  <tr key={student} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="sticky left-0 z-10 app-surface px-4 py-2 border-r app-border font-medium flex items-center justify-between shadow-[1px_0_0_var(--color-border)] group">
                      <span className="truncate max-w-[200px]" title={student}>{student}</span>
                      {isHundido && (
                        <span className="text-xs bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold ml-2 shrink-0">
                          {failingCount} rojas
                        </span>
                      )}
                    </td>
                    {uniqueAsignaturas.map(asig => {
                      const cell = studentData[asig];
                      if (!cell || cell.value === null) {
                        return <td key={asig} className="p-1 border-r app-border"><div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800/50 mx-auto"></div></td>;
                      }

                      const colorClass = getCellColor(cell.value, cell.text);
                      
                      return (
                        <td key={asig} className="p-1 border-r app-border last:border-r-0">
                          <div 
                            className={`w-8 h-8 mx-auto rounded flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-crosshair ${colorClass}`}
                            title={`${asig}\n${student}: ${cell.value.toFixed(2)} (${cell.text}) - Desempeño ${getDesempeno(cell.value)}`}
                          >
                            {cell.value.toFixed(1)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            {/* Footer row for Subject failing percentage */}
            <tfoot className="sticky bottom-0 z-20 app-surface-muted shadow-[0_-1px_0_var(--color-border)]">
              <tr>
                <td className="sticky left-0 z-30 app-surface-muted px-4 py-3 text-right font-bold border-t border-r app-border shadow-[1px_0_0_var(--color-border)] text-xs">
                  % Mortalidad
                </td>
                {uniqueAsignaturas.map(asig => {
                  let total = 0;
                  let failed = 0;
                  uniqueStudents.forEach(st => {
                    const cell = matrix[st][asig];
                    if (cell && cell.value !== null) {
                      total++;
                      if (cell.value < 3.0) failed++;
                    }
                  });
                  const percentage = total > 0 ? (failed / total) * 100 : 0;
                  const isMataEstudiantes = percentage > 40; // More than 40% failed

                  return (
                    <td key={asig} className="p-2 border-t border-r app-border text-center text-[10px] font-bold">
                      <div className={`rounded px-1 py-0.5 ${isMataEstudiantes ? 'bg-rose-500 text-white' : 'text-neutral-500 dark:text-neutral-400'}`} title={`${failed} perdidos de ${total}`}>
                        {percentage.toFixed(0)}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <style>
        {`
        .writing-vertical-rl {
          writing-mode: vertical-rl;
        }
        .heatmap-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .heatmap-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .heatmap-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .dark .heatmap-scroll::-webkit-scrollbar-thumb {
          background: #475569;
        }
        `}
      </style>
    </div>
  );
};
