import React, { useMemo } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { Estudiante } from '../../domain/types';

interface VolatilityProfile {
  student: Estudiante;
  periodValues: (number | null)[];
  variance: number;
  type: 'Estable' | 'Montaña Rusa' | 'Ascenso' | 'Caída Libre' | 'Sin Datos Suficientes';
  description: string;
}

export const VolatilityTab: React.FC = () => {
  const data = useDashboardStore(state => state.estudiantes);
  const globalSelectedGroup = useDashboardStore(state => state.selectedGrupo);
  const setGlobalGroup = useDashboardStore(state => state.setGrupo);

  const groups = useMemo(() => {
    const gSet = new Set<string>();
    data.forEach((s: Estudiante) => gSet.add(s.grupo));
    return Array.from(gSet).sort();
  }, [data]);

  const activeGroup = globalSelectedGroup === 'Todos' && groups.length > 0 ? groups[0] : (globalSelectedGroup === 'Todos' ? '' : globalSelectedGroup);

  React.useEffect(() => {
    if (globalSelectedGroup === 'Todos' && groups.length > 0) {
      setGlobalGroup(groups[0]);
    }
  }, [groups, globalSelectedGroup, setGlobalGroup]);

  const activePeriods = useMemo(() => {
    let hasP1 = false, hasP2 = false, hasP3 = false, hasP4 = false;
    const groupStudents = data.filter((s: Estudiante) => s.grupo === activeGroup);
    groupStudents.forEach(s => {
      Object.values(s.areas).forEach(area => {
        Object.values(area.asignaturas).forEach(asig => {
          if (asig.P1 !== null && asig.P1 !== undefined) hasP1 = true;
          if (asig.P2 !== null && asig.P2 !== undefined) hasP2 = true;
          if (asig.P3 !== null && asig.P3 !== undefined) hasP3 = true;
          if (asig.P4 !== null && asig.P4 !== undefined) hasP4 = true;
        });
      });
    });
    
    const periods = [];
    if (hasP1) periods.push('P1');
    if (hasP2) periods.push('P2');
    if (hasP3) periods.push('P3');
    if (hasP4) periods.push('P4');
    return periods;
  }, [data, activeGroup]);

  const profiles = useMemo(() => {
    if (!activeGroup) return [];

    const students = data.filter((s: Estudiante) => s.grupo === activeGroup);
    
    return students.map((student: Estudiante) => {
      const sums = { P1: 0, P2: 0, P3: 0, P4: 0 };
      const counts = { P1: 0, P2: 0, P3: 0, P4: 0 };

      Object.values(student.areas).forEach(area => {
        Object.values(area.asignaturas).forEach(asig => {
          if (asig.P1 !== null && asig.P1 !== undefined) { sums.P1 += asig.P1; counts.P1++; }
          if (asig.P2 !== null && asig.P2 !== undefined) { sums.P2 += asig.P2; counts.P2++; }
          if (asig.P3 !== null && asig.P3 !== undefined) { sums.P3 += asig.P3; counts.P3++; }
          if (asig.P4 !== null && asig.P4 !== undefined) { sums.P4 += asig.P4; counts.P4++; }
        });
      });

      const periodValues = activePeriods.map(p => counts[p as keyof typeof counts] > 0 ? sums[p as keyof typeof sums] / counts[p as keyof typeof counts] : null);
      const validPeriods = periodValues.filter((p): p is number => p !== null);
      
      let type: VolatilityProfile['type'] = 'Sin Datos Suficientes';
      let variance = 0;
      let description = 'No hay suficientes periodos evaluados para calcular volatilidad.';

      if (validPeriods.length >= 2) {
        // Calculate variance
        const mean = validPeriods.reduce((a, b) => a + b, 0) / validPeriods.length;
        variance = validPeriods.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validPeriods.length;
        const stdDev = Math.sqrt(variance);

        const diffs = [];
        for (let i = 1; i < validPeriods.length; i++) {
          diffs.push(validPeriods[i] - validPeriods[i - 1]);
        }

        const isAscending = diffs.every(d => d > 0.1);
        const isDescending = diffs.every(d => d < -0.1);
        const maxDiff = Math.max(...diffs.map(Math.abs));

        if (isAscending) {
          type = 'Ascenso';
          description = 'El rendimiento del estudiante mejora de forma constante periodo tras periodo.';
        } else if (isDescending) {
          type = 'Caída Libre';
          description = 'Alerta: El rendimiento está empeorando sistemáticamente cada periodo.';
        } else if (stdDev > 0.6 || maxDiff > 1.0) {
          type = 'Montaña Rusa';
          description = 'El rendimiento es altamente inconsistente con picos y caídas bruscas.';
        } else if (stdDev < 0.2) {
          type = 'Estable';
          description = 'El estudiante mantiene un rendimiento consistente en todos los periodos.';
        } else {
          type = 'Estable'; // Normal fluctuations
          description = 'El estudiante presenta fluctuaciones normales en su rendimiento.';
        }
      }

      return {
        student,
        periodValues,
        variance,
        type,
        description
      };
    }).sort((a: VolatilityProfile, b: VolatilityProfile) => b.variance - a.variance); // Sort by most volatile first

  }, [data, activeGroup, activePeriods]);

  if (data.length === 0) return null;

  return (
    <div className="p-6 font-sans">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Perfiles de Volatilidad</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Análisis de consistencia del rendimiento a lo largo del año.</p>
        </div>
        
        <select
          aria-label="Seleccionar grupo"
          className="px-4 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={activeGroup}
          onChange={(e) => setGlobalGroup(e.target.value)}
        >
          {groups.map(g => (
            <option key={g} value={g}>Grupo {g}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm">
          <div className="text-purple-800 font-bold text-sm uppercase mb-1">Montaña Rusa</div>
          <div className="text-3xl font-black text-purple-600">
            {profiles.filter((p: VolatilityProfile) => p.type === 'Montaña Rusa').length}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="text-red-800 font-bold text-sm uppercase mb-1">Caída Libre</div>
          <div className="text-3xl font-black text-red-600">
            {profiles.filter((p: VolatilityProfile) => p.type === 'Caída Libre').length}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
          <div className="text-emerald-800 font-bold text-sm uppercase mb-1">En Ascenso</div>
          <div className="text-3xl font-black text-emerald-600">
            {profiles.filter((p: VolatilityProfile) => p.type === 'Ascenso').length}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="text-blue-800 font-bold text-sm uppercase mb-1">Estables</div>
          <div className="text-3xl font-black text-blue-600">
            {profiles.filter((p: VolatilityProfile) => p.type === 'Estable').length}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {profiles.filter((p: VolatilityProfile) => p.type !== 'Sin Datos Suficientes').length === 0 ? (
          <div className="p-8 text-center text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
            ⚠️ No hay suficientes periodos evaluados aún para calcular volatilidad (se requieren al menos 2 periodos).
          </div>
        ) : (
          profiles.filter((p: VolatilityProfile) => p.type !== 'Sin Datos Suficientes').map((profile: VolatilityProfile, i: number) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{profile.student.name}</h3>
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                    profile.type === 'Montaña Rusa' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                    profile.type === 'Caída Libre' ? 'bg-red-100 text-red-800 border-red-200' :
                    profile.type === 'Ascenso' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {profile.type}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">{profile.description}</p>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                  {activePeriods.map(p => <span key={p} className="flex-1 text-center">{p}</span>)}
                </div>
                <div className="flex h-12 items-end gap-1 relative border-b border-slate-200 pb-1">
                  {profile.periodValues.map((p: number | null, idx: number) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                      {p !== null ? (
                        <>
                          <div 
                            className={`w-full max-w-[40px] rounded-t-sm transition-all duration-300 ${
                              p < 3.0 ? 'bg-red-400' : p < 4.0 ? 'bg-orange-400' : 'bg-emerald-400'
                            }`}
                            style={{ height: `${(p / 5) * 100}%` }}
                          ></div>
                          <div className="absolute -top-6 text-xs font-bold text-slate-700 bg-white px-1 rounded shadow-sm opacity-0 group-hover:opacity-100 border border-slate-200">
                            {p.toFixed(1)}
                          </div>
                        </>
                      ) : (
                        <div className="w-full max-w-[40px] h-full bg-slate-100 rounded-t-sm border border-dashed border-slate-300"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
