 
import React from 'react';
import type { GroupPerformanceReport } from '../../../../domain/types';

export const GroupPerformanceView: React.FC<{ data: GroupPerformanceReport | null }> = ({ data }) => {

  const groupPerformanceData = data;
  
  if (!groupPerformanceData) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
        Reporte de Rendimiento Grupal - Grupo {groupPerformanceData.grupo}
      </h3>
      
      {/* SaaS Metrics Cards: hidden when printing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print print:hidden">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Estudiantes</span>
          <span className="text-2xl font-extrabold text-slate-800">{groupPerformanceData.totalStudents}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Promedio Grupal</span>
          <span className="text-2xl font-extrabold text-indigo-600">{(groupPerformanceData.average || 0).toFixed(2)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Desviación Estándar</span>
          <span className="text-2xl font-extrabold text-slate-800">{(groupPerformanceData.standardDeviation || 0).toFixed(1)}</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Promoción</span>
          <span className="text-2xl font-extrabold text-emerald-600">{(groupPerformanceData.promotionRate || 0).toFixed(1)}%</span>
        </div>
      </div>

      {/* Print-specific compact layout */}
      <table className="hidden print:table w-full text-sm border-collapse mb-6">
        <tbody>
          <tr className="border-t border-b border-slate-300">
            <td className="py-2 font-bold text-slate-700">Total Estudiantes:</td>
            <td className="py-2 text-right">{groupPerformanceData.totalStudents}</td>
            <td className="py-2 pl-8 font-bold text-slate-700">Promedio General:</td>
            <td className="py-2 text-right">{(groupPerformanceData.average || 0).toFixed(2)}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="py-2 font-bold text-slate-700">Desviación Estándar:</td>
            <td className="py-2 text-right">{(groupPerformanceData.standardDeviation || 0).toFixed(1)}</td>
            <td className="py-2 pl-8 font-bold text-slate-700">Porcentaje Promoción:</td>
            <td className="py-2 text-right">{(groupPerformanceData.promotionRate || 0).toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>

      <h4 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">⚠️ Áreas Críticas con Reprobación</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
          <thead className="bg-slate-50 print:bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Área Crítica</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">Perdidas</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {groupPerformanceData.criticalAreas.length > 0 ? (
              groupPerformanceData.criticalAreas.map(area => (
                <tr key={area.area} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 text-left text-slate-800">{area.area}</td>
                  <td className="px-4 py-2 text-center font-bold text-rose-600">{area.failuresCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-400">Excelente. No se registran áreas reprobadas en este grupo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
