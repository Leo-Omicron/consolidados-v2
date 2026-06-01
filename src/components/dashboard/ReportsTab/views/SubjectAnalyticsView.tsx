/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export const SubjectAnalyticsView: React.FC<{ data: any, logic: any }> = ({ data, logic }) => {
  const {
    activeGroupToUse,
    hasP4,
    directorName,
    setDirectorName,
    periodName,
    setPeriodName
  } = logic;
  const subjectAnalyticsData = data;
  
  if (!subjectAnalyticsData) return null;

  return (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Análisis por Asignaturas - Grupo {subjectAnalyticsData.grupo}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Asignatura</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Promedio General</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Cant. Reprobados</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Porcentaje Reprobación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjectAnalyticsData.subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{sub.asignatura}</td>
                        <td className="px-4 py-2.5 text-center font-extrabold text-slate-800">{sub.average.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-rose-600">{sub.failuresCount}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-rose-500">{sub.failuresRate}%</td>
                      </tr>
                    ))}
                    {subjectAnalyticsData.subjects.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Sin datos de asignaturas cargados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          

  );
};


