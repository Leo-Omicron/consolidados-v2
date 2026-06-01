/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export const HeatmapView: React.FC<{ data: any, logic?: any }> = ({ data }) => {

  const heatmapData = data;
  
  if (!heatmapData) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
        Mapa de Calor - Grupo {heatmapData.grupo}
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs print:table-layout-fixed">
          <thead className="bg-slate-50 print:bg-slate-100">
            <tr>
              <th className="px-3 py-3 text-left font-bold text-slate-600 sticky left-0 bg-slate-50 print:bg-slate-100 z-10 w-48 print:w-[120px] print:min-w-0 print:text-[8px] print:px-1">Estudiante</th>
              {heatmapData.areasList.map((area: any) => (
                <th key={area} className="px-2 py-3 text-center font-bold text-slate-600 min-w-[100px] max-w-[140px] print:min-w-0 print:w-auto print:text-[7.5px] print:px-1" title={area}>
                  {area.length > 15 ? `${area.substring(0, 15)}.` : area}
                </th>
              ))}
              <th className="px-3 py-3 text-center font-bold text-slate-700 w-24 print:w-[45px] print:min-w-0 print:text-[8px] print:px-1">Prom.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {heatmapData.rows.map((row: any) => (
              <tr key={row.studentName} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-3 py-2 text-left font-medium text-slate-800 sticky left-0 bg-white print:w-[120px] print:min-w-0 print:text-[8px] print:px-1 truncate" title={row.studentName}>{row.studentName}</td>
                {heatmapData.areasList.map((areaName: any) => {
                  const cell = row.grades[areaName];
                  let cellClass = 'text-slate-400';
                  if (cell?.grade !== undefined) {
                    if (cell.color === 'red') cellClass = 'bg-rose-50 text-rose-700 font-bold';
                    else if (cell.color === 'orange') cellClass = 'bg-orange-50 text-orange-700 font-bold';
                    else if (cell.color === 'yellow') cellClass = 'bg-yellow-50 text-yellow-700 font-semibold';
                    else if (cell.color === 'green') cellClass = 'bg-emerald-50 text-emerald-700 font-semibold';
                    else if (cell.color === 'cyan') cellClass = 'bg-cyan-50 text-cyan-800 font-semibold';
                    else if (cell.color === 'blue') cellClass = 'bg-blue-50 text-blue-800 font-semibold';
                  }
                  return (
                    <td key={areaName} className={`px-2 py-2 text-center border-r border-slate-100/60 print:min-w-0 print:w-auto print:text-[8px] print:px-1 ${cellClass}`}>
                      {cell?.grade?.toFixed(1) ?? '-'}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center font-extrabold text-slate-900 bg-slate-50/40 print:w-[45px] print:min-w-0 print:text-[8px] print:px-1">{row.promActual.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
