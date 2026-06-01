 
import React from 'react';
import type { TeacherFeedbackReport } from '../../../../domain/types';
import { useReportsLogic } from '../useReportsLogic';

export const TeacherFeedbackView: React.FC<{ data: TeacherFeedbackReport[] | null, logic: ReturnType<typeof useReportsLogic> }> = ({ data, logic }) => {
  const {
    activeGroupToUse
  } = logic;
  const teacherFeedbackData = data;
  
  if (!teacherFeedbackData) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4 no-print print:hidden">
        Fichas de Retroalimentación de Alumnos - Grupo {activeGroupToUse}
      </h3>
      
      <div className="space-y-6 print:space-y-12">
        {teacherFeedbackData.map(student => (
          <div key={student.studentId} className="border border-slate-200/80 rounded-2xl p-6 bg-white shadow-sm break-inside-avoid print:border print:border-slate-400 print:p-6 print:rounded-2xl">
            <div className="flex justify-between items-start border-b border-slate-100 print:border-slate-300 pb-3 mb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900 print:text-black">{student.studentName}</h4>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identificación: {student.studentId}</span>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                  student.overallStatus === 'Aprobado'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : student.overallStatus === 'Compromisos'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {student.overallStatus}
                </span>
              </div>
            </div>

            {/* KPIs Pedagógicos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 print:grid-cols-4 print:gap-3">
              <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl text-center print:bg-white print:border-slate-300">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Promedio <span className="text-[8px] text-amber-600 dark:text-amber-400 font-bold">(Ofic.)</span></span>
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200 print:text-black">
                  {(student.promedioActual || 0).toFixed(2)}
                </span>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl text-center print:bg-white print:border-slate-300">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Puesto <span className="text-[8px] text-amber-600 dark:text-amber-400 font-bold">(Ofic.)</span></span>
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200 print:text-black">
                  {student.puestoGrupo} <span className="text-xs font-normal text-slate-400">/ {student.totalEstudiantesGrupo}</span>
                </span>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl text-center print:bg-white print:border-slate-300">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Media Grupal</span>
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200 print:text-black">
                  {(student.promedioGrupo || 0).toFixed(2)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl text-center print:bg-white print:border-slate-300">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Carga Académica</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 print:text-black block mt-1">
                  {student.totalAreasCount - student.failedAreasCount} / {student.totalAreasCount} Aprobados
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100/40 dark:border-emerald-900/30 print:bg-white print:border-slate-300">
                <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5">💪 Áreas de Fortaleza (Refuerzo Positivo)</span>
                {student.strengths.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                    {student.strengths.map(area => <li key={area}>{area}</li>)}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-400 italic">No se listan fortalezas con nota superior a 4.0</span>
                )}
              </div>
              <div className="bg-rose-50/30 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-100/40 dark:border-rose-900/30 print:bg-white print:border-slate-300">
                <span className="block text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1.5">⚠️ Plan de Mejora Prioritario</span>
                {student.weaknessesDetail.length > 0 ? (
                  <div className="space-y-1.5">
                    {student.weaknessesDetail.map(w => (
                      <div key={w.areaName} className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-800 dark:text-slate-300 print:text-black">{w.areaName} <span className="text-rose-600 dark:text-rose-400">({(w.grade || 0).toFixed(1)})</span></span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          w.isImpossible
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50 print:bg-white print:text-rose-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 print:bg-white print:text-amber-800'
                        }`}>
                          {w.isImpossible ? 'IRRECUPERABLE' : `Nota Req: ${(w.requiredGrade || 0).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-400 italic block mt-1">¡Ninguna! Felicitaciones, no presenta áreas con reprobación.</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 print:bg-white print:border-slate-300">
              <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">📝 Recomendaciones y Tutoría del Docente</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 italic leading-relaxed print:text-black">"{student.adviceText}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
