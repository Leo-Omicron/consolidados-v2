import React, { useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useDashboardStore } from '../../store/useDashboardStore';
import { generateAcademicRiskReport, generateTeacherFeedbackReportForGroup } from '../../services/reportEngine';
import type { AcademicRiskStudent, TeacherFeedbackReport, Estudiante } from '../../domain/types';
import { FeedbackCard } from './FeedbackCard';

export const AlertsTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const config = useDashboardStore(state => state.config);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const setGrupo = useDashboardStore(state => state.setGrupo);

  const printRef = useRef<HTMLDivElement>(null);

  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    estudiantes.forEach((s: Estudiante) => {
      if (s.grupo) groups.add(s.grupo);
    });
    return ['Todos', ...Array.from(groups).sort()];
  }, [estudiantes]);

  const riskStudents = useMemo(() => {
    let allRiskStudents: AcademicRiskStudent[] = [];
    
    if (selectedGrupo === 'Todos') {
      availableGroups.forEach(grupo => {
        if (grupo !== 'Todos') {
          const report = generateAcademicRiskReport(estudiantes, grupo, config);
          allRiskStudents = allRiskStudents.concat(report.criticalStudents);
        }
      });
    } else {
      const report = generateAcademicRiskReport(estudiantes, selectedGrupo, config);
      allRiskStudents = report.criticalStudents;
    }
    
    // Sort by most severe
    allRiskStudents.sort((a, b) => {
      if (b.impossibilityMathAreas.length !== a.impossibilityMathAreas.length) {
        return b.impossibilityMathAreas.length - a.impossibilityMathAreas.length;
      }
      if (b.failedAreasCount !== a.failedAreasCount) {
        return b.failedAreasCount - a.failedAreasCount;
      }
      return a.name.localeCompare(b.name);
    });
    
    return allRiskStudents;
  }, [estudiantes, selectedGrupo, config, availableGroups]);

  const feedbackReports = useMemo(() => {
    let allReports: TeacherFeedbackReport[] = [];
    if (selectedGrupo === 'Todos') {
      availableGroups.forEach(grupo => {
        if (grupo !== 'Todos') {
          const rep = generateTeacherFeedbackReportForGroup(estudiantes, grupo, config);
          allReports = allReports.concat(rep);
        }
      });
    } else {
      allReports = generateTeacherFeedbackReportForGroup(estudiantes, selectedGrupo, config);
    }
    
    // Only print for at-risk students to save paper, or print all? 
    // The requirement is usually to print for those in risk, but we can print all.
    // Let's print only for risk students to match the tab context.
    const riskIds = new Set(riskStudents.map(s => s.id));
    return allReports.filter(r => riskIds.has(r.studentId));
  }, [estudiantes, selectedGrupo, config, availableGroups, riskStudents]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Boletines_Riesgo_${selectedGrupo}`,
  });

  if (estudiantes.length === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos cargados.</div>;
  }

  const impossibleCount = riskStudents.filter(s => s.impossibilityMathAreas.length > 0).length;
  const severeCount = riskStudents.filter(s => s.impossibilityMathAreas.length === 0 && s.failedAreasCount >= 3).length;
  const warningCount = riskStudents.filter(s => s.impossibilityMathAreas.length === 0 && s.failedAreasCount > 0 && s.failedAreasCount < 3).length;

  return (
    <div className="p-6 app-text animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Alertas Tempranas</h2>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <label htmlFor="alerts-group" className="text-sm font-bold text-neutral-500 uppercase">Grupo</label>
            <select 
              id="alerts-group"
              className="border app-control app-focus rounded px-3 py-1.5 font-medium"
              value={selectedGrupo}
              onChange={e => setGrupo(e.target.value)}
            >
              {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button
            onClick={() => handlePrint()}
            disabled={feedbackReports.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            🖨️ Imprimir Boletines ({feedbackReports.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-red-900 dark:text-red-400 text-sm uppercase tracking-wide">Riesgo Imposible</h3>
            <p className="text-xs text-red-700 dark:text-red-500 mt-1">Requieren nota {'>'} 5.0 en alguna materia</p>
          </div>
          <div className="text-3xl font-black text-red-600 dark:text-red-500">{impossibleCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-orange-900 dark:text-orange-400 text-sm uppercase tracking-wide">Severo</h3>
            <p className="text-xs text-orange-700 dark:text-orange-500 mt-1">Repiten el año (3 o más áreas)</p>
          </div>
          <div className="text-3xl font-black text-orange-600 dark:text-orange-500">{severeCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-400 text-sm uppercase tracking-wide">Alerta</h3>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">1 o 2 áreas perdidas o en riesgo</p>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-500">{warningCount}</div>
        </div>
      </div>

      {riskStudents.length === 0 ? (
        <div className="p-8 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          🎉 ¡Excelente! No se detectaron estudiantes en riesgo para este grupo.
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-lg mb-4">Detalle de Estudiantes en Riesgo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskStudents.map(student => {
              const isImpossible = student.impossibilityMathAreas.length > 0;
              const isSevere = !isImpossible && student.failedAreasCount >= 3;
              
              let cardStyle = "border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10";
              let titleColor = "text-amber-900 dark:text-amber-400";
              let badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
              
              if (isImpossible) {
                cardStyle = "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 shadow-sm";
                titleColor = "text-red-900 dark:text-red-400";
                badgeStyle = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
              } else if (isSevere) {
                cardStyle = "border-orange-300 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20 shadow-sm";
                titleColor = "text-orange-900 dark:text-orange-400";
                badgeStyle = "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
              }

              return (
                <div key={student.id} className={`p-4 rounded-xl border ${cardStyle} transition-all duration-300 hover:shadow-md`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-bold ${titleColor} truncate mr-2`} title={student.name}>
                      {student.name}
                    </h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${badgeStyle}`}>
                      {student.failedAreasCount} ÁREAS
                    </span>
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 font-mono">
                    Promedio General: <span className="font-bold text-neutral-900 dark:text-white">{student.average.toFixed(2)}</span>
                  </div>
                  
                  {isImpossible && (
                    <div className="mb-2">
                      <div className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 mb-1">Requiere {'>'} 5.0 en:</div>
                      <div className="flex flex-wrap gap-1">
                        {student.impossibilityMathAreas.map(area => (
                          <span key={area} className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isImpossible && student.failedAreas.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">Áreas perdidas:</div>
                      <div className="flex flex-wrap gap-1">
                        {student.failedAreas.map(area => (
                          <span key={area} className="text-[10px] bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border app-border text-neutral-700 dark:text-neutral-300">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      <div className="hidden">
        <div ref={printRef} className="print-container">
          {feedbackReports.map(report => (
            <FeedbackCard key={report.studentId} report={report} />
          ))}
        </div>
      </div>
    </div>
  );
};
