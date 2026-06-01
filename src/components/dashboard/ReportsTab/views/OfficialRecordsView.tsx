/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export const OfficialRecordsView: React.FC<{ data: any, logic: any }> = ({ data, logic }) => {
  const {
    activeGroupToUse,
    hasP4,
    directorName,
    setDirectorName,
    periodName,
    setPeriodName
  } = logic;
  const officialRecordsData = data;
  
  if (!officialRecordsData) return null;

  return (
            <div>
              <div className="flex justify-between items-center mb-4 no-print print:hidden">
                <h3 className="text-lg font-bold text-slate-900">
                  Registro de Calificaciones Oficial - Grupo {officialRecordsData.grupo}
                </h3>
              </div>

              {/* Input details for Director/Period: hidden when printing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 no-print print:hidden">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                    👤 Nombre del Director de Curso:
                  </label>
                  <input
                    type="text"
                    value={directorName}
                    onChange={e => setDirectorName(e.target.value)}
                    placeholder="Ej. Prof. María Clara Gómez"
                    className="border border-slate-200 hover:border-slate-300 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                    📅 Nombre del Periodo Académico:
                  </label>
                  <input
                    type="text"
                    value={periodName}
                    onChange={e => setPeriodName(e.target.value)}
                    placeholder="Ej. Periodo 1, Primer Trimestre"
                    className="border border-slate-200 hover:border-slate-300 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs print:table-layout-fixed">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-2 py-3 text-center font-bold text-slate-600 w-12 print:w-[35px] print:min-w-0 print:text-[8px] print:px-1">Puesto</th>
                      <th className="px-3 py-3 text-left font-bold text-slate-600 w-44 print:w-[110px] print:min-w-0 print:text-[8px] print:px-1">Estudiante</th>
                      {Object.keys(officialRecordsData.rows[0]?.grades || {}).map(area => (
                        <th key={area} className="px-2 py-3 text-center font-bold text-slate-600 max-w-[120px] print:min-w-0 print:w-auto print:text-[7.5px] print:px-1" title={area}>
                          {area.length > 15 ? `${area.substring(0, 15)}.` : area}
                        </th>
                      ))}
                      <th className="px-2 py-3 text-center font-bold text-slate-700 w-16 print:w-[45px] print:min-w-0 print:text-[8px] print:px-1">Promedio</th>
                      {hasP4 && (
                        <th className="px-2 py-3 text-center font-bold text-slate-600 w-12">P4</th>
                      )}
                      <th className="px-2 py-3 text-center font-bold text-slate-600 w-16 print:w-[35px] print:min-w-0 print:text-[8px] print:px-1">Fallas</th>
                      <th className="px-3 py-3 text-center font-bold text-slate-700 w-24 print:w-[50px] print:min-w-0 print:text-[8px] print:px-1">Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {officialRecordsData.rows.map(row => (
                      <tr key={row.studentId} className="hover:bg-slate-50/40">
                        <td className="px-2 py-2 text-center font-bold text-slate-500 print:w-[35px] print:min-w-0 print:text-[8px] print:px-1">{row.ranking}</td>
                        <td className="px-3 py-2 font-bold text-slate-800 print:w-[110px] print:min-w-0 print:text-[8px] print:px-1">{row.studentName}</td>
                        {Object.entries(row.grades).map(([areaName, grade]) => {
                          const isFailed = grade !== null && grade < 3.0;
                          return (
                            <td key={areaName} className={`px-2 py-2 text-center print:min-w-0 print:w-auto print:text-[8px] print:px-1 ${isFailed ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                              {grade?.toFixed(1) ?? '-'}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center font-extrabold text-slate-900 bg-slate-50/30 print:w-[45px] print:min-w-0 print:text-[8px] print:px-1">{row.promActual.toFixed(2)}</td>
                        {hasP4 && (
                          <td className="px-2 py-2 text-center text-slate-500">P4</td>
                        )}
                        <td className="px-2 py-2 text-center font-bold text-slate-600 print:w-[35px] print:min-w-0 print:text-[8px] print:px-1">{row.failedAreasCount}</td>
                        <td className="px-3 py-2 text-center print:w-[50px] print:min-w-0 print:text-[8px] print:px-1">
                          <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full ${
                            row.decision === 'Aprobado'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : row.decision === 'Compromisos'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {row.decision}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature layout for printed page */}
              <div className="hidden print:flex justify-between items-center mt-16 px-12 pt-8">
                <div className="text-center w-64 border-t border-slate-400 pt-2">
                  <p className="text-sm font-bold text-slate-800">{officialRecordsData.director}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Director de Grupo</p>
                </div>
                <div className="text-center w-64 border-t border-slate-400 pt-2">
                  <p className="text-sm font-bold text-slate-800">Comité de Evaluación</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Firma de Coordinación</p>
                </div>
              </div>
            </div>
          

  );
};


