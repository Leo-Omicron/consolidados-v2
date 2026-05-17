import React, { useRef } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { PeriodConfig } from '../../domain/types';

export const FileUploadArea: React.FC = () => {
  const processFile = useDashboardStore((state) => state.processFile);
  const setConfig = useDashboardStore((state) => state.setConfig);
  const loading = useDashboardStore((state) => state.loading);
  const error = useDashboardStore((state) => state.error);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Cargar Datos</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo Excel de Notas
          </label>
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
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Cargar Excel'}
          </button>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Configuración JSON (Opcional)
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleConfigUpload}
            ref={configInputRef}
            className="hidden"
          />
          <button
            onClick={() => configInputRef.current?.click()}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cargar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
