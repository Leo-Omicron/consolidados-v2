import type { Estudiante, PeriodConfig } from '../../domain/types';

export const baseConfig: PeriodConfig = { P1: 0.25, P2: 0.25, P3: 0.25, P4: 0.25 };

export const getStudent = (id: string, group: string, areas: unknown, promedios?: unknown, rankings?: unknown): Estudiante => ({
  id, name: `Student ${id}`, CURSO: group, grupo: group, 
  areas: areas as Estudiante['areas'], 
  promedios: promedios as Estudiante['promedios'], 
  rankings: rankings as Estudiante['rankings']
});
