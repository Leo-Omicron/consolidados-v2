import React, { useRef, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { PeriodConfig } from '../../domain/types';

export const FileUploadArea: React.FC = () => {
  const processFile = useDashboardStore((state) => state.processFile);
  const setConfig = useDashboardStore((state) => state.setConfig);
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);

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
                  <span>Procesando...</span>
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
    </div>
  );
};
