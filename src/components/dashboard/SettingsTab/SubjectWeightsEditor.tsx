import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useDebouncedCallback } from '../../../hooks/useDebouncedCallback';

export const SubjectWeightsEditor: React.FC = () => {
  const { estudiantes, availableGroups, subjectWeights, updateSubjectWeights } = useDashboardStore();
  
  const groups = useMemo(() => availableGroups.filter(g => g !== 'Todos'), [availableGroups]);
  const [selectedGroup, setSelectedGroup] = useState<string>(groups[0] || '');
  const [selectedArea, setSelectedArea] = useState<string>('');

  const groupAreas = useMemo(() => {
    if (!selectedGroup || estudiantes.length === 0) return [];
    const areas = new Set<string>();
    estudiantes.filter(e => e.grupo === selectedGroup).forEach(student => {
      Object.keys(student.areas).forEach(a => areas.add(a));
    });
    return Array.from(areas).sort();
  }, [selectedGroup, estudiantes]);



  const groupStudents = useMemo(() => estudiantes.find(e => e.grupo === selectedGroup), [estudiantes, selectedGroup]);
  const subjectsInArea = useMemo(() => {
    if (!groupStudents || !selectedArea) return [];
    const area = groupStudents.areas[selectedArea];
    return area ? Object.keys(area.asignaturas).sort() : [];
  }, [groupStudents, selectedArea]);

  // Read current weights from store, falling back to equal distribution if not set
  const currentStoreWeights = useMemo(() => {
    const w = subjectWeights[selectedGroup]?.[selectedArea] || {};
    const localW: Record<string, number> = {};
    if (subjectsInArea.length > 0) {
      subjectsInArea.forEach(sub => {
        localW[sub] = w[sub] !== undefined ? w[sub] * 100 : (1 / subjectsInArea.length) * 100;
      });
    }
    return localW;
  }, [subjectWeights, selectedGroup, selectedArea, subjectsInArea]);

  const [localWeights, setLocalWeights] = useState<Record<string, number>>(currentStoreWeights);
  const [prevStoreWeightsStr, setPrevStoreWeightsStr] = useState<string>(JSON.stringify(currentStoreWeights));

  const currentStoreWeightsStr = JSON.stringify(currentStoreWeights);
  if (currentStoreWeightsStr !== prevStoreWeightsStr) {
    setPrevStoreWeightsStr(currentStoreWeightsStr);
    setLocalWeights(currentStoreWeights);
  }



  const debouncedUpdate = useDebouncedCallback((grupo: string, area: string, weightsToSave: Record<string, number>) => {
    // Convert 0-100 to 0-1 before dispatching
    const normalized: Record<string, number> = {};
    Object.entries(weightsToSave).forEach(([k, v]) => {
      normalized[k] = v / 100;
    });
    updateSubjectWeights(grupo, area, normalized);
  }, 300);

  if (estudiantes.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border app-border p-8 text-center max-w-3xl">
        <p className="app-text-muted">Cargue un archivo Excel para ver las áreas disponibles y configurar pesos por asignatura.</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  const handleSliderChange = (subject: string, valueStr: string) => {
    let newValue = parseInt(valueStr, 10);
    if (isNaN(newValue)) newValue = 0;

    setLocalWeights(prev => {
      const draft = { ...prev, [subject]: newValue };
      
      const sum = Object.values(draft).reduce((acc, v) => acc + v, 0);
      
      if (sum !== 100 && subjectsInArea.length > 1) {
        let diff = 100 - sum;
        const others = subjectsInArea.filter(s => s !== subject);
        
        // Distribute diff to others
        for (let i = 0; i < others.length; i++) {
          const s = others[i];
          if (i === others.length - 1) {
            draft[s] = Math.max(0, draft[s] + diff);
          } else {
            const portion = Math.round(diff / (others.length - i));
            draft[s] = Math.max(0, draft[s] + portion);
            diff -= portion;
          }
        }
        
        // Re-check sum due to Math.max(0) limits
        const finalSum = Object.values(draft).reduce((acc, v) => acc + v, 0);
        if (finalSum !== 100 && draft[others[0]] !== undefined) {
          draft[others[0]] = Math.max(0, draft[others[0]] + (100 - finalSum));
        }
      }

      debouncedUpdate(selectedGroup, selectedArea, draft);
      return draft;
    });
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border app-border p-6 max-w-3xl">
      <h3 className="text-lg font-semibold app-text mb-6">Ponderación de Asignaturas</h3>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="block text-sm font-medium app-text-muted mb-2">Grupo</label>
          <select
            value={selectedGroup}
            onChange={(e) => {
              const newGroup = e.target.value;
              setSelectedGroup(newGroup);
              const areas = new Set<string>();
              estudiantes.filter(student => student.grupo === newGroup).forEach(student => {
                Object.keys(student.areas).forEach(a => areas.add(a));
              });
              const newGroupAreas = Array.from(areas).sort();
              if (newGroupAreas.length > 0 && !newGroupAreas.includes(selectedArea)) {
                setSelectedArea(newGroupAreas[0]);
              }
            }}
            className="w-full pl-3 pr-8 py-2 text-sm border app-control app-focus rounded-lg"
          >
            {groups.map(g => (
              <option key={g} value={g}>Grupo {g}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium app-text-muted mb-2">Área</label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full pl-3 pr-8 py-2 text-sm border app-control app-focus rounded-lg"
            disabled={groupAreas.length === 0}
          >
            {groupAreas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {subjectsInArea.length === 0 ? (
        <div className="p-4 text-center app-text-muted border app-border rounded-lg border-dashed">
          Sin asignaturas
        </div>
      ) : subjectsInArea.length === 1 ? (
        <div className="p-4 text-center app-text-muted border app-border rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <span className="font-bold app-text">{subjectsInArea[0]}</span>: 100% — sin ponderación requerida
        </div>
      ) : (
        <div className="space-y-6">
          {subjectsInArea.map((subject, idx) => {
            const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'];
            const colorClass = colors[idx % colors.length];
            const accentClass = colorClass.replace('bg-', 'accent-');
            
            return (
              <div key={subject} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor={`slider-${subject}`} className="text-sm font-medium app-text-muted truncate pr-4">
                    {subject}
                  </label>
                  <span className="text-sm font-bold app-text">{Math.round(localWeights[subject] || 0)}%</span>
                </div>
                <input
                  id={`slider-${subject}`}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(localWeights[subject] || 0)}
                  onChange={(e) => handleSliderChange(subject, e.target.value)}
                  className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${accentClass}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
