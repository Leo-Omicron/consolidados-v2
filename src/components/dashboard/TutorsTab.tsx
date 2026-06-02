import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { Estudiante } from '../../domain/types';
import { PASSING_GRADE } from '../../services/academicLogic';

interface Match {
  tutor: Estudiante;
  mentees: Estudiante[];
  areaName: string;
}

export const TutorsTab: React.FC = () => {
  const data = useDashboardStore(state => state.estudiantes);
  const globalSelectedGroup = useDashboardStore(state => state.selectedGrupo);
  const setGlobalGroup = useDashboardStore(state => state.setGrupo);
  const [selectedArea, setSelectedArea] = useState<string>('');

  // Extract groups
  const groups = useMemo(() => {
    const gSet = new Set<string>();
    data.forEach((s: Estudiante) => gSet.add(s.grupo));
    return Array.from(gSet).sort();
  }, [data]);

  const selectedGroup = globalSelectedGroup === 'Todos' && groups.length > 0 ? groups[0] : (globalSelectedGroup === 'Todos' ? '' : globalSelectedGroup);

  // Extract areas for the selected group
  const areas = useMemo(() => {
    const aSet = new Set<string>();
    const studentsInGroup = data.filter((s: Estudiante) => s.grupo === selectedGroup);
    studentsInGroup.forEach((s: Estudiante) => {
      Object.keys(s.areas).forEach(a => aSet.add(a));
    });
    return Array.from(aSet).sort();
  }, [data, selectedGroup]);

  // Derive active area safely during render instead of using useEffect
  const activeArea = (selectedArea && areas.includes(selectedArea)) ? selectedArea : (areas.length > 0 ? areas[0] : '');

  const matches = useMemo(() => {
    if (!selectedGroup || !activeArea) return null;

    const students = data.filter((s: Estudiante) => s.grupo === selectedGroup);
    
    // Tutors: Grade >= 4.0
    const tutors = students.filter((s: Estudiante) => {
      const a = s.areas[activeArea];
      return a && a.areaStats && typeof a.areaStats.promedioActual === 'number' && a.areaStats.promedioActual >= 4.0;
    }).sort((a: Estudiante, b: Estudiante) => (b.areas[activeArea]?.areaStats?.promedioActual || 0) - (a.areas[activeArea]?.areaStats?.promedioActual || 0));

    // Mentees: Grade < PASSING_GRADE
    const mentees = students.filter((s: Estudiante) => {
      const a = s.areas[activeArea];
      return a && a.areaStats && typeof a.areaStats.promedioActual === 'number' && a.areaStats.promedioActual < PASSING_GRADE;
    }).sort((a: Estudiante, b: Estudiante) => (a.areas[activeArea]?.areaStats?.promedioActual || 0) - (b.areas[activeArea]?.areaStats?.promedioActual || 0));

    // Round-robin matching: assigning up to 3 mentees per tutor evenly
    const results: Match[] = tutors.map(tutor => ({
      tutor,
      mentees: [],
      areaName: activeArea
    }));
    
    const unassignedMentees = [...mentees];
    let currentTutorIdx = 0;
    
    while (unassignedMentees.length > 0) {
      let found = false;
      for (let i = 0; i < results.length; i++) {
        const idx = (currentTutorIdx + i) % results.length;
        if (results[idx].mentees.length < 3) {
          results[idx].mentees.push(unassignedMentees.shift()!);
          currentTutorIdx = idx + 1;
          found = true;
          break;
        }
      }
      if (!found) break; // All tutors have 3 mentees
    }
    
    const matches = results.filter(r => r.mentees.length > 0);

    return { matches, unassignedMentees, totalTutors: tutors.length, totalMentees: mentees.length };
  }, [data, selectedGroup, activeArea]);

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500 font-sans">
        No hay datos cargados.
      </div>
    );
  }

  return (
    <div className="p-6 font-sans">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Mentores Pares</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Emparejamiento automático de estudiantes sobresalientes con aquellos en riesgo.</p>
        </div>
        
        <div className="flex space-x-4">
          <select
            className="px-4 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedGroup}
            onChange={(e) => setGlobalGroup(e.target.value)}
            aria-label="Seleccionar grupo"
          >
            {groups.map(g => (
              <option key={g} value={g}>Grupo {g}</option>
            ))}
          </select>
          
          {areas.length > 0 && (
            <select
              className="px-4 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={activeArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              aria-label="Seleccionar área"
            >
              {areas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!matches || matches.matches.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <span className="text-4xl mb-4 block">🎓</span>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No hay emparejamientos necesarios</h3>
          <p className="text-slate-500">En este grupo y área, o bien no hay estudiantes en riesgo, o no hay mentores disponibles.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="text-emerald-800 font-bold text-sm uppercase mb-1">Mentores Disponibles</div>
              <div className="text-3xl font-black text-emerald-600">{matches.totalTutors}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800 font-bold text-sm uppercase mb-1">Estudiantes en Riesgo</div>
              <div className="text-3xl font-black text-red-600">{matches.totalMentees}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-800 font-bold text-sm uppercase mb-1">Emparejamientos Exitosos</div>
              <div className="text-3xl font-black text-blue-600">{matches.matches.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.matches.map((match: Match, idx: number) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mr-3 border border-emerald-200">
                      {match.tutor.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 leading-tight">{match.tutor.name}</div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Mentor Especialista</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-600">{(match.tutor.areas[activeArea]?.areaStats?.promedioActual || 0).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-white">
                  <div className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wide">Estudiantes a cargo ({match.mentees.length}):</div>
                  <div className="space-y-2">
                    {match.mentees.map((mentee: Estudiante) => (
                      <div key={mentee.id} className="flex justify-between items-center bg-slate-50 rounded-md px-3 py-2 border border-slate-100">
                        <div className="font-medium text-slate-700">{mentee.name}</div>
                        <div className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-sm border border-red-100">
                          {(mentee.areas[activeArea]?.areaStats?.promedioActual || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {matches.unassignedMentees.length > 0 && (
            <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-xl">
              <h3 className="text-orange-800 font-bold flex items-center mb-4">
                <span className="mr-2">⚠️</span> Estudiantes sin mentor ({matches.unassignedMentees.length})
              </h3>
              <p className="text-sm text-orange-700 mb-4">No hay suficientes mentores sobresalientes en esta área para cubrir a todos los estudiantes en riesgo. El docente deberá intervenir directamente.</p>
              
              <div className="flex flex-wrap gap-2">
                {matches.unassignedMentees.map((mentee: Estudiante) => (
                  <div key={mentee.id} className="bg-white border border-orange-200 text-orange-800 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm">
                    {mentee.name} <span className="font-bold text-red-600 ml-1">({(mentee.areas[activeArea]?.areaStats?.promedioActual || 0).toFixed(2)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
