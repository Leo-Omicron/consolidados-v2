import React from 'react';

export interface SubjectWeightsPanelProps {
  weights: Record<string, Record<string, Record<string, number>>>;
  isExpanded: boolean;
  onToggle: () => void;
}

export const SubjectWeightsPanel: React.FC<SubjectWeightsPanelProps> = ({
  weights,
  isExpanded,
  onToggle,
}) => {
  if (Object.keys(weights).length === 0) {
    return null;
  }

  return (
    <div className="mb-6 app-surface rounded-2xl border app-border shadow-premium overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between app-surface-muted app-surface-hover transition-colors font-bold app-text text-sm border-b app-border cursor-pointer app-focus"
      >
        <span className="flex items-center gap-2">
          <span>📋</span> {isExpanded ? 'Ocultar Pesos de Asignaturas Inferidos' : 'Ver Pesos de Asignaturas Inferidos'}
        </span>
        <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
          ▼
        </span>
      </button>
      {isExpanded && (
        <div className="p-5 border-t app-border transition-all duration-300">
          <div className="space-y-4">
            {Object.entries(weights).map(([grupo, areas]) => (
              <div key={grupo} className="flex flex-col space-y-1">
                {grupo && (
                  <span className="text-xs font-bold app-text uppercase tracking-wider">Grupo {grupo}:</span>
                )}
                <div className="flex flex-wrap gap-3">
                  {Object.entries(areas).map(([area, asigs]) => (
                    <div key={area} className="app-surface-muted px-3.5 py-2 rounded-xl border app-border text-xs flex items-center">
                      <span className="font-bold app-text">{area}:</span>
                      <span className="ml-2 app-text-muted font-medium">
                        {Object.entries(asigs as Record<string, number>).map(([asig, w]) => `${asig}: ${Math.round(w * 100)}%`).join(' | ')}
                      </span>
                    </div>
                  ))}
                  {Object.keys(areas).length === 0 && (
                    <span className="text-sm app-text-muted">Sin pesos configurados</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
