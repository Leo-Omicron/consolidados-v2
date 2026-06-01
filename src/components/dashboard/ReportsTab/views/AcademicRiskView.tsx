 
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export const AcademicRiskView: React.FC<{ data: any, logic?: any }> = ({ data }) => {

  const academicRiskData = data;
  
  if (!academicRiskData) return null;

  return (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Estudiantes en Riesgo Académico - Grupo {academicRiskData.grupo}
              </h3>
              <p className="text-xs text-slate-500 mb-4 no-print print:hidden">Visualización de estudiantes con asignaturas perdidas o que presentan imposibilidad matemática de aprobar en la proyección restante.</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Estudiante</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">Promedio</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">Áreas Perdidas</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Detalle de Alerta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {academicRiskData.criticalStudents.map((student: any) => (
                      <tr key={student.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 font-semibold text-slate-800">{student.name}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{student.average.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600">{student.failedAreasCount}</td>
                        <td className="px-4 py-3 text-xs space-y-1">
                          {student.failedAreas.length > 0 && (
                            <div>
                              <span className="font-bold text-rose-700 uppercase tracking-wide">Reprueba: </span>
                              <span className="text-slate-600 font-medium">{student.failedAreas.join(', ')}</span>
                            </div>
                          )}
                          {student.impossibilityMathAreas.length > 0 && (
                            <div className="mt-1">
                              <span className="font-bold text-amber-700 uppercase tracking-wide">⚠️ Imposibilidad P3/P4: </span>
                              <span className="text-slate-600 font-medium">{student.impossibilityMathAreas.join(', ')}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {academicRiskData.criticalStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">¡Excelente! Cero estudiantes en situación de riesgo en este grupo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          

  );
};


