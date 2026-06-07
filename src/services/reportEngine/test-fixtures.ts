import type { Estudiante, PeriodConfig } from '../../domain/types';

export const baseConfig: PeriodConfig = { P1: 0.25, P2: 0.25, P3: 0.25, P4: 0.25 };

export const getStudent = (id: string, group: string, areas: any, promedios?: any, rankings?: any): Estudiante => ({
  id, name: `Student ${id}`, CURSO: group, grupo: group, areas, promedios, rankings
});
