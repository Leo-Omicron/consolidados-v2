import React from 'react';

export interface SimulationBannerProps {
  activeCount: number;
  onExportHash: () => string;
  onClearAll: () => void;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({
  activeCount,
  onExportHash,
  onClearAll,
}) => {
  if (activeCount <= 0) {
    return null;
  }

  const handleCopyLink = () => {
    const hash = onExportHash();
    const url = new URL(window.location.href);
    url.hash = `sim=${hash}`;
    navigator.clipboard.writeText(url.toString());
    alert('¡Enlace de simulación copiado al portapapeles! Cualquiera con este enlace verá estas mismas simulaciones.');
  };

  return (
    <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-xl">🧪</span>
        <div>
          <h4 className="font-bold text-amber-950 dark:text-amber-200 text-sm">Modo de Simulación Activo</h4>
          <p className="text-xs text-amber-800 dark:text-amber-400">Estás viendo promedios e indicadores académicos hipotéticos. Los datos reales no se han alterado.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleCopyLink}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-neutral-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 transition-premium cursor-pointer shadow-sm app-focus"
          title="Copia un enlace para compartir estas simulaciones"
        >
          🔗 Compartir URL
        </button>
        <button
          onClick={onClearAll}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-neutral-900 hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-900 dark:text-amber-200 transition-premium cursor-pointer shadow-sm app-focus"
        >
          Restaurar datos reales
        </button>
      </div>
    </div>
  );
};
