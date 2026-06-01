/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

export const GroupComparisonView: React.FC<{ data: any, logic: any }> = ({ data, logic }) => {
  const {
    activeGroupToUse,
    hasP4,
    directorName,
    setDirectorName,
    periodName,
    setPeriodName
  } = logic;
  const groupComparisonData = data;
  
  if (!groupComparisonData) return null;

  return (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Análisis Comparativo Inter-Grupos
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Grupo</th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-24 cursor-help" 
                        title="Cantidad total de estudiantes activos evaluados en este grupo."
                      >
                        Estudiantes ℹ️
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-28 cursor-help" 
                        title="Rendimiento promedio de todo el grupo (suma de promedios de estudiantes dividida por la cantidad de estudiantes)."
                      >
                        Promedio General ℹ️
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-28 cursor-help" 
                        title="DESVIACIÓN ESTÁNDAR&#10;&#10;Mide qué tan dispersos están los promedios de los alumnos en comparación con el promedio general del grupo.&#10;&#10;• Desviación ALTA (&gt; 1.0): Grupo HETEROGÉNEO. Coexisten alumnos con rendimiento sobresaliente y otros con graves dificultades. Requiere apoyo diferenciado.&#10;• Desviación BAJA (&lt; 0.5): Grupo HOMOGÉNEO. Los niveles de rendimiento de los alumnos son muy uniformes y parejos.&#10;&#10;No es 'buena' ni 'mala' de por sí, pero una desviación alta alerta al docente sobre una gran brecha de aprendizaje en el salón de clases."
                      >
                        Desv. Estándar ℹ️
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-28 cursor-help" 
                        title="Suma acumulada de todas las áreas reprobadas (calificación menor a 3.0) por todos los estudiantes del grupo."
                      >
                        Total Pérdidas ℹ️
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-28 cursor-help" 
                        title="Cantidad de estudiantes que reprueban la promoción del año bajo la Regla de Oro (tienen 3 o más áreas con promedio reprobatorio)."
                      >
                        Estudiantes Reprobados ℹ️
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupComparisonData.groups.map(group => (
                      <tr key={group.grupo} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2.5 font-bold text-indigo-700 print:text-black">{group.grupo}</td>
                        <td className="px-4 py-2.5 text-center font-medium text-slate-700">{group.totalStudents}</td>
                        <td className="px-4 py-2.5 text-center font-extrabold text-slate-800">{group.average.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-slate-600">{group.standardDeviation.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-rose-500">{group.failuresCount}</td>
                        <td className="px-4 py-2.5 text-center font-extrabold text-rose-600">{group.reprobadosCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          

  );
};


