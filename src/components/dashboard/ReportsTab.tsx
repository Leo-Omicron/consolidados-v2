import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';

export const ReportsTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);

  if (estudiantes.length === 0) {
    return <div className="p-8 text-center text-gray-500">No hay datos para generar reportes. Cargue un archivo Excel.</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Reportes de Consolidado</h2>
        <button 
          onClick={handlePrint}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Imprimir Reporte
        </button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-6 print:border-none print:shadow-none print:p-0">
        <h3 className="text-xl font-bold text-center mb-6">Consolidado General</h3>
        <div className="mb-4 text-sm text-gray-600">
          <p>Total de estudiantes procesados: {estudiantes.length}</p>
          <p>Fecha de emisión: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="space-y-6">
          {estudiantes.slice(0, 5).map(est => (
            <div key={est.id} className="border border-gray-200 rounded p-4 break-inside-avoid">
              <h4 className="font-medium text-lg mb-2">{est.nombre}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500">Promedio General</span>
                  <span className="font-semibold">{est.promedioGeneral?.toFixed(2) || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Estado</span>
                  <span className={`font-semibold ${
                    est.estadoGeneral === 'APROBADO' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {est.estadoGeneral || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {estudiantes.length > 5 && (
            <div className="text-center text-sm text-gray-500 mt-4 print:hidden">
              Mostrando vista previa de 5 estudiantes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
