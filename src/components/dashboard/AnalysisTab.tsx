import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';

export const AnalysisTab: React.FC = () => {
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const rowsAsignatura = useDashboardStore(state => state.rowsAsignatura);

  if (rowsArea.length === 0) {
    return <div className="p-8 text-center text-gray-500">No hay datos para analizar. Cargue un archivo Excel.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-4">Análisis por Área</h2>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Q1</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Q2</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rowsArea.slice(0, 10).map((row, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.estudianteId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.areaId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.notaQ1.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.notaQ2.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row.notaFinal.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    row.estado === 'APROBADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {row.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rowsArea.length > 10 && (
          <div className="mt-4 text-sm text-gray-500 italic">Mostrando 10 de {rowsArea.length} registros.</div>
        )}
      </div>
    </div>
  );
};
