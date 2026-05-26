import React, { useRef, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { PeriodConfig } from '../../domain/types';

export const FileUploadArea: React.FC = () => {
  const processFile = useDashboardStore((state) => state.processFile);
  const setConfig = useDashboardStore((state) => state.setConfig);
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);
  const diagnosticReport = useDashboardStore((state) => state.diagnosticReport);
  const parsingProgress = useDashboardStore((state) => state.parsingProgress);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Group issues by sheet name
  const issuesBySheet = React.useMemo(() => {
    if (!diagnosticReport || !diagnosticReport.issues) return {};
    // Only display WARNING and SUGGESTION in this list
    const nonCritical = diagnosticReport.issues.filter(i => i.severity !== 'CRITICAL');
    const groups: Record<string, typeof nonCritical> = {};
    nonCritical.forEach(issue => {
      const s = issue.sheet || 'Global';
      if (!groups[s]) groups[s] = [];
      groups[s].push(issue);
    });
    return groups;
  }, [diagnosticReport]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string) as PeriodConfig;
          setConfig(config);
        } catch (err) {
          console.error('Invalid configuration file', err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target?.result as string) as PeriodConfig;
            setConfig(config);
          } catch (err) {
            console.error('Invalid configuration file', err);
          }
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        processFile(file);
      }
    }
  };

  return (
    <div
      data-testid="file-upload-area-container"
      role="region"
      aria-labelledby="file-upload-area-title"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative p-8 rounded-2xl border-2 mb-6 transition-all duration-300 ${
        isDragging
          ? 'app-tab-active shadow-md scale-[1.01] animate-pulse'
          : 'border-dashed app-border app-surface app-surface-hover hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3.5 rounded-xl transition-premium ${
            isDragging 
              ? 'app-tab-active scale-110' 
              : 'app-surface-muted app-text-muted'
          }`}>
            <svg
              className={`w-8 h-8 ${isDragging ? 'animate-bounce' : 'transition-transform duration-300'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <h2 id="file-upload-area-title" className="text-lg font-bold app-text tracking-premium">Cargar Datos de Estudiantes</h2>
            <p className="text-xs app-text-muted">Arrastrá y soltá tu planilla Excel (.xlsx, .xls) o archivo JSON aquí</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-5 border app-control app-control-hover app-focus font-semibold text-sm rounded-xl shadow-sm disabled:opacity-50 transition-premium cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" data-testid="loading-spinner">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.126 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{parsingProgress || 'Procesando...'}</span>
                </>
              ) : (
                'Cargar Excel'
              )}
            </button>
          </div>

          <div className="flex-1 md:flex-none">
            <input
              type="file"
              accept=".json"
              onChange={handleConfigUpload}
              ref={configInputRef}
              className="hidden"
            />
            <button
              onClick={() => configInputRef.current?.click()}
              className="w-full flex items-center justify-center py-2.5 px-5 border app-control app-control-hover app-focus font-semibold text-sm rounded-xl shadow-sm transition-premium cursor-pointer"
            >
              Cargar Configuración
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 app-error border px-4 py-3 rounded-xl text-sm transition-premium animate-fade-in flex items-center space-x-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {diagnosticReport && diagnosticReport.issues.some(i => i.severity !== 'CRITICAL') && (
        <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
          <div className="bg-slate-100 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Resultados del Diagnóstico de Calidad
              </span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              {diagnosticReport.issues.filter(i => i.severity !== 'CRITICAL').length} advertencias / sugerencias
            </span>
          </div>
          
          <div className="p-4 space-y-3">
            {Object.entries(issuesBySheet).map(([sheetName, sheetIssues]) => (
              <details key={sheetName} className="group border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 transition-premium" open>
                <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 select-none list-none">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Hoja: {sheetName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({sheetIssues.length} {sheetIssues.length === 1 ? 'problema detectado' : 'problemas detectados'})
                    </span>
                  </div>
                  <span className="transition-transform duration-300 group-open:rotate-180">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  {sheetIssues.map((issue, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border text-xs leading-relaxed flex flex-col gap-1.5 ${
                        issue.severity === 'WARNING' 
                          ? 'border-amber-100 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300' 
                          : 'border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            issue.severity === 'WARNING'
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                          }`}>
                            {issue.severity === 'WARNING' ? 'ADVERTENCIA' : 'SUGERENCIA'}
                          </span>
                          {issue.row && issue.col && (
                            <span className="text-slate-500 dark:text-slate-400">
                              Celda: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{issue.col}{issue.row}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {issue.message}
                      </p>
                      {issue.action && (
                        <div className="mt-1 flex items-start gap-1 text-slate-600 dark:text-slate-400">
                          <span className="font-bold">Acción recomendada:</span>
                          <span>{issue.action}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
