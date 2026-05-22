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
    <div className="p-6 transition-premium">
      <div className="flex justify-between items-center mb-6 no-print print:hidden">
        <h2 className="text-xl font-bold text-slate-900 tracking-premium">Reportes de Consolidado</h2>
        <button 
          onClick={handlePrint}
          className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-premium cursor-pointer animate-fade-in"
        >
          Imprimir Reporte
        </button>
      </div>
      
      <div className="bg-white border border-slate-200/50 rounded-2xl shadow-premium overflow-hidden p-8 transition-premium max-w-4xl mx-auto print-card-flat print:border-none print:shadow-none print:p-0 print:max-w-full">
        <h3 className="text-2xl font-bold text-center text-slate-950 mb-6 tracking-premium border-b border-slate-100 pb-4">Consolidado General de Estudiantes</h3>
        
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 print-card-flat print:bg-white print:p-2">
          <p><span className="font-semibold text-slate-700">Total de estudiantes procesados:</span> {estudiantes.length}</p>
          <p className="text-right print:text-left"><span className="font-semibold text-slate-700">Fecha de emisión:</span> {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="space-y-6">
          {estudiantes.slice(0, 5).map(est => (
            <div key={est.id} className="border border-slate-200/60 rounded-xl p-5 break-inside-avoid bg-white hover:border-slate-300 transition-premium print-card-flat">
              <h4 className="font-bold text-slate-900 text-lg mb-3 pb-2 border-b border-slate-100/50">{est.name}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Curso</span>
                  <span className="font-bold text-slate-700 text-base">{est.CURSO || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Áreas</span>
                  <span className="font-bold text-slate-700 text-base">
                    {Object.keys(est.areas).length}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {estudiantes.length > 5 && (
            <div className="text-center text-sm text-slate-400 mt-4 print:hidden">
              Mostrando vista previa de 5 estudiantes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
