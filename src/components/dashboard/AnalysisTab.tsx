import React, { useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';

export const AnalysisTab: React.FC = () => {
  // Use separate selectors to avoid returning a new object on every render
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const config = useDashboardStore(state => state.config);
  
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  if (rowsArea.length === 0) {
    return <div className="p-8 text-center text-gray-500">No hay datos para analizar. Cargue un archivo Excel.</div>;
  }

  const hasP4 = config.P4 !== undefined && config.P4 > 0;
  
  const totalPages = Math.ceil(rowsArea.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const paginatedRows = rowsArea.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-4">Análisis por Área</h2>
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P1</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P2</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P3</th>
              {hasP4 && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P4</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.estudiante}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.area}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.defP1?.toFixed(2) ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.defP2?.toFixed(2) ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.defP3?.toFixed(2) ?? '-'}</td>
                {hasP4 && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.defP4?.toFixed(2) ?? '-'}</td>}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row.promActual?.toFixed(2) ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    row.estado.color === 'green' ? 'bg-green-100 text-green-800' :
                    row.estado.color === 'red' ? 'bg-red-100 text-red-800' :
                    row.estado.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    row.estado.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    row.estado.color === 'cyan' ? 'bg-cyan-100 text-cyan-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {row.estado.text}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
              <span className="font-medium">{Math.min(startIndex + rowsPerPage, rowsArea.length)}</span> de{' '}
              <span className="font-medium">{rowsArea.length}</span> registros
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Anterior</span>
                &larr;
              </button>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Siguiente</span>
                &rarr;
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};
