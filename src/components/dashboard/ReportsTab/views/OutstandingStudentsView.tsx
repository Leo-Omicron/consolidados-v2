/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export const OutstandingStudentsView: React.FC<{ data: any, logic: any }> = ({ data, logic }) => {
  const {
    activeGroupToUse,
    hasP4,
    directorName,
    setDirectorName,
    periodName,
    setPeriodName
  } = logic;
  const outstandingStudentsData = data;
  
  if (!outstandingStudentsData) return null;

  return (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Estudiantes Destacados - Grupo {outstandingStudentsData.grupo}
              </h3>
              <p className="text-xs text-slate-500 mb-4 no-print print:hidden">Cuadro de Honor de Estudiantes con Percentil Académico superior o igual a 90% dentro de su cohorte.</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600 w-16">Puesto</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Estudiante</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Promedio</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Percentil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outstandingStudentsData.students.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2.5 text-slate-500 font-bold">
                          {student.officialRanking !== null && student.officialRanking !== undefined 
                            ? student.officialRanking 
                            : idx + 1}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-indigo-700 print:text-black">{student.name}</td>
                        <td className="px-4 py-2.5 text-center font-extrabold text-slate-800">
                          {student.officialAverage !== null && student.officialAverage !== undefined 
                            ? student.officialAverage.toFixed(2) 
                            : student.average.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-center font-semibold text-emerald-600 print:text-black">{student.percentile}%</td>
                      </tr>
                    ))}
                    {outstandingStudentsData.students.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No se registran estudiantes por encima del percentil 90% en este grupo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          

  );
};


