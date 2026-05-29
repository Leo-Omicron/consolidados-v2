import type { Estudiante, RowArea, RowAsignatura } from '../domain/types';

export function flattenRows(students: Estudiante[]): { rowsArea: RowArea[], rowsAsignatura: RowAsignatura[] } {
  const rowsArea: RowArea[] = [];
  const rowsAsignatura: RowAsignatura[] = [];

  students.forEach(student => {
    Object.entries(student.areas).forEach(([areaName, areaData]) => {
      if (areaData.areaStats) {
        rowsArea.push({
          id: `${student.id}_${areaName}`,
          CURSO: student.CURSO,
          estudiante: student.name,
          area: areaName,
          grupo: student.grupo,
          defP1: areaData.DEF.P1,
          defP2: areaData.DEF.P2,
          defP3: areaData.DEF.P3,
          defP4: areaData.DEF.P4,
          defA: areaData.DEF.A,
          promActual: areaData.areaStats.promedioActual,
          p4Min: areaData.areaStats.p4Min,
          estado: areaData.areaStats.estado,
          CURSO_NORM: student.CURSO.toUpperCase(),
          AREA_NORM: areaName.toUpperCase(),
          EST_NORM: student.name.toUpperCase(),
          oficialPRO: student.promedios ? student.promedios['DEF'] : null,
          oficialRAK: student.rankings ? student.rankings['DEF'] : null,
          desempeños: student.desempeños && student.desempeños['DEF'] ? student.desempeños['DEF'] : null
        });
      }

      const asigEntries = Object.entries(areaData.asignaturas);
      
      if (asigEntries.length > 0) {
        asigEntries.forEach(([asigName, asigData]) => {
          rowsAsignatura.push({
            id: `${student.id}_${areaName}_${asigName}`,
            CURSO: student.CURSO,
            estudiante: student.name,
            area: areaName,
            asignatura: asigName,
            grupo: student.grupo,
            p1: asigData.P1,
            p2: asigData.P2,
            p3: asigData.P3,
            p4: asigData.P4,
            a: asigData.A,
            promActual: asigData.promedioActual,
            p4Min: asigData.p4Min,
            estado: asigData.estado,
            CURSO_NORM: student.CURSO.toUpperCase(),
            AREA_NORM: areaName.toUpperCase(),
            ASIG_NORM: asigName.toUpperCase(),
            EST_NORM: student.name.toUpperCase(),
            oficialPRO: student.promedios ? student.promedios['DEF'] : null,
            oficialRAK: student.rankings ? student.rankings['DEF'] : null,
            desempeños: student.desempeños && student.desempeños['DEF'] ? student.desempeños['DEF'] : null
          });
        });
      } else if (areaData.areaStats) {
        rowsAsignatura.push({
          id: `${student.id}_${areaName}_${areaName}`,
          CURSO: student.CURSO,
          estudiante: student.name,
          area: areaName,
          asignatura: areaName,
          grupo: student.grupo,
          p1: areaData.DEF.P1,
          p2: areaData.DEF.P2,
          p3: areaData.DEF.P3,
          p4: areaData.DEF.P4,
          a: areaData.DEF.A,
          promActual: areaData.areaStats.promedioActual,
          p4Min: areaData.areaStats.p4Min,
          estado: areaData.areaStats.estado,
          CURSO_NORM: student.CURSO.toUpperCase(),
          AREA_NORM: areaName.toUpperCase(),
          ASIG_NORM: areaName.toUpperCase(),
          EST_NORM: student.name.toUpperCase(),
          oficialPRO: student.promedios ? student.promedios['DEF'] : null,
          oficialRAK: student.rankings ? student.rankings['DEF'] : null,
          desempeños: student.desempeños && student.desempeños['DEF'] ? student.desempeños['DEF'] : null
        });
      }
    });
  });

  return { rowsArea, rowsAsignatura };
}
