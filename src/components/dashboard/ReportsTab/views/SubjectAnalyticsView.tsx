 
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export const SubjectAnalyticsView: React.FC<{ data: any, logic?: any }> = ({ data }) => {

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
              <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">Promedio</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">Reprobados</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">% Reprobación</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {subjectAnalyticsData.subjects.map((subject: any) => (
              <tr key={subject.asignatura} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-left text-slate-800 font-medium">{subject.asignatura}</td>
                <td className="px-4 py-2.5 text-center font-bold text-slate-900">{subject.average.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-center font-semibold text-rose-600">{subject.failuresCount}</td>
                <td className="px-4 py-2.5 text-center font-semibold text-rose-500">{subject.failuresRate}%</td>
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
