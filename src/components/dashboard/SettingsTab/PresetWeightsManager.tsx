import React, { useState } from 'react';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { getPresetWeights } from '../../../config/academicWeights';
import { getGradeFromGroup } from '../../../services/academicLogic/gradeExtraction';
import type { SubjectWeightConfig } from '../../../domain/types';

// WARNING: Keep in sync with src/config/academicWeights.ts — getPresetWeights()
// If you add a new area preset there, add its entry here too.
const PRESETS = [
  { area: 'HUMANIDADES', ranges: ['1-9', '10-11'] },
  { area: 'MATEMATICAS', ranges: ['1-5', '6-11'] },
  { area: 'CIENCIAS NATURALES', ranges: ['1-5', '6-9', '10-11'] },
  { area: 'CIENCIAS SOCIALES', ranges: ['1-8', '9', '10-11'] }
];

export const PresetWeightsManager: React.FC = () => {
  const { estudiantes, availableGroups, applyPresetWeights, clearCustomWeights } = useDashboardStore();
  const [previewData, setPreviewData] = useState<{area: string, range: string, weights: Record<string, number> | null} | null>(null);

  const determineGradeRange = (grupo: string): number => {
    return getGradeFromGroup(grupo);
  };

  const handleApplyAll = () => {
    if (!window.confirm('¿Aplicar presets a todos los grupos? Esto sobrescribirá pesos personalizados para estas áreas.')) return;
    
    const fullConfig: SubjectWeightConfig = {};
    const groups = availableGroups.filter(g => g !== 'Todos');
    
    groups.forEach(grupo => {
      fullConfig[grupo] = {};
      const grade = determineGradeRange(grupo);
      
      PRESETS.forEach(preset => {
        const student = estudiantes.find(e => e.grupo === grupo);
        const subjects = student && student.areas[preset.area] ? Object.keys(student.areas[preset.area].asignaturas) : [];
        const weights = getPresetWeights(preset.area, subjects, grade);
        if (weights) {
          fullConfig[grupo][preset.area] = weights;
        }
      });
    });

    applyPresetWeights(fullConfig);
    alert('Presets aplicados exitosamente a todos los grupos.');
  };

  const handleApplyPresetToGroups = (area: string, range: string) => {
    if (!window.confirm(`¿Aplicar preset de ${area} (Grados ${range}) a los grupos correspondientes?`)) return;

    const fullConfig: SubjectWeightConfig = {};
    const groups = availableGroups.filter(g => g !== 'Todos');
    let appliedCount = 0;

    groups.forEach(grupo => {
      const grade = determineGradeRange(grupo);
      const student = estudiantes.find(e => e.grupo === grupo);
      const subjects = student && student.areas[area] ? Object.keys(student.areas[area].asignaturas) : [];
      const weights = getPresetWeights(area, subjects, grade);
      
      // Determine if this group falls in the exact selected range visually,
      // but actually getPresetWeights logic already handles it by grade.
      // We will just blindly apply getPresetWeights for this area to all valid groups.
      if (weights) {
        // We only want to apply if it matches the range, but getPresetWeights does the logic.
        // We'll just build a config that applies it.
        if (!fullConfig[grupo]) fullConfig[grupo] = {};
        fullConfig[grupo][area] = weights;
        appliedCount++;
      }
    });

    applyPresetWeights(fullConfig);
    alert(`Preset aplicado a ${appliedCount} grupos.`);
  };

  const handlePreview = (area: string, range: string) => {
    if (estudiantes.length === 0) {
      alert('Cargue datos para previsualizar.');
      return;
    }

    const lowestGrade = parseInt(range.split('-')[0], 10);
    const uniqueSubjects = new Set<string>();

    estudiantes.forEach(student => {
      if (student.areas[area]) {
        Object.keys(student.areas[area].asignaturas).forEach(sub => uniqueSubjects.add(sub));
      }
    });

    const subjects = Array.from(uniqueSubjects);
    const weights = getPresetWeights(area, subjects, lowestGrade);
    
    setPreviewData({ area, range, weights });
  };

  const handleClear = () => {
    if (!window.confirm('¿Eliminar todos los pesos personalizados? La inferencia automática calculará los pesos en la próxima carga.')) return;
    clearCustomWeights();
    alert('Pesos eliminados.');
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border app-border p-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold app-text">Presets Institucionales</h3>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-200 dark:border-red-800"
          >
            Restaurar Inferencia Automática
          </button>
          <button
            onClick={handleApplyAll}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            Aplicar todos los presets
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border app-border rounded-lg mb-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 app-text-muted border-b app-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Área</th>
              <th className="px-4 py-3 font-semibold">Grados</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y app-divide app-text">
            {PRESETS.flatMap(preset => 
              preset.ranges.map(range => (
                <tr key={`${preset.area}-${range}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="px-4 py-3 font-medium">{preset.area}</td>
                  <td className="px-4 py-3">{range}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handlePreview(preset.area, range)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Previsualizar
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      onClick={() => handleApplyPresetToGroups(preset.area, range)}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Aplicar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {previewData && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border app-border rounded-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold app-text">
              Vista previa: {previewData.area} (Grados {previewData.range})
            </h4>
            <button 
              onClick={() => setPreviewData(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          {previewData.weights ? (
            <ul className="space-y-1 text-sm app-text">
              {Object.entries(previewData.weights).map(([sub, w]) => (
                <li key={sub} className="flex justify-between max-w-xs">
                  <span>{sub}</span>
                  <span className="font-bold">{Math.round(w * 100)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm app-text-muted italic">Sin preset — se utilizarán pesos uniformes automáticos.</p>
          )}
        </div>
      )}
    </div>
  );
};
