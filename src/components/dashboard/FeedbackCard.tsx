import React from 'react';
import type { TeacherFeedbackReport } from '../../domain/types';

export const FeedbackCard: React.FC<{ report: TeacherFeedbackReport }> = ({ report }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] p-10 bg-white text-black font-sans box-border" style={{ pageBreakAfter: 'always' }}>
      <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">Reporte de Situación Académica</h1>
          <p className="text-sm text-slate-500 uppercase tracking-wide mt-1">Periodo Actual - Proyección a Fin de Año</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-800">{report.grupo}</div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">{report.studentName}</h2>
          <div className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-full border border-slate-300">
            {report.overallStatus}
          </div>
        </div>
        <div className="text-right bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase mb-1">Promedio General</div>
          <div className="text-4xl font-black text-slate-900">{report.promedioActual.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-2">
            Puesto: {report.puestoGrupo} de {report.totalEstudiantesGrupo}
          </div>
        </div>
      </div>

      <div className="bg-slate-100 p-6 rounded-lg mb-8 border border-slate-300">
        <h3 className="font-bold text-slate-800 uppercase tracking-wide mb-2 text-sm border-b border-slate-300 pb-2">Diagnóstico y Recomendación</h3>
        <p className="text-slate-700 leading-relaxed font-medium">
          {report.adviceText}
        </p>
      </div>

      {report.weaknessesDetail.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-red-700 uppercase tracking-wide mb-4 flex items-center">
            <span className="mr-2">⚠️</span> Áreas en Riesgo ({report.failedAreasCount})
          </h3>
          <div className="space-y-3">
            {report.weaknessesDetail.map((weakness, i) => (
              <div key={i} className={`p-4 rounded-lg border ${weakness.isImpossible ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'} flex justify-between items-center`}>
                <div className="font-bold text-slate-800">{weakness.areaName}</div>
                <div className="text-right">
                  <div className="text-xs uppercase text-slate-500 mb-1">Nota mínima requerida para pasar:</div>
                  {weakness.isImpossible ? (
                    <div className="text-red-600 font-black text-xl">Imposible ({weakness.requiredGrade.toFixed(2)})</div>
                  ) : (
                    <div className="text-orange-600 font-black text-xl">{weakness.requiredGrade.toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.strengths.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-emerald-700 uppercase tracking-wide mb-4 flex items-center">
            <span className="mr-2">⭐</span> Fortalezas ({report.strengths.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.strengths.map((s, i) => (
              <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-sm font-bold border border-emerald-200 rounded-md">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>Este reporte ha sido generado automáticamente a partir de los datos consolidados actuales.</p>
        <p className="mt-1">Las proyecciones asumen que se mantienen los porcentajes de evaluación predefinidos.</p>
      </div>
    </div>
  );
};
