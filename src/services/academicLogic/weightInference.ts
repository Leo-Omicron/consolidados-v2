import type { Estudiante, Area } from '../../domain/types';
import { getPresetWeights } from '../../config/academicWeights';
import { getGradeFromGroup } from './gradeExtraction';
import { roundToOneDecimal } from './math';
import type { AcademicPeriodKey } from './constants';

export function createUniformSubjectWeights(subjectNames: string[]): Record<string, number> {
  if (subjectNames.length === 0) return {};

  const uniformWeight = 1 / subjectNames.length;
  const weights: Record<string, number> = {};
  subjectNames.forEach(name => {
    weights[name] = uniformWeight;
  });
  return weights;
}

export function calculateWeightedAreaPeriodGrade(
  area: Area,
  period: AcademicPeriodKey,
  evaluated: Record<AcademicPeriodKey, boolean>,
  weights?: Record<string, number>
): number | null {
  const subjectNames = Object.keys(area.asignaturas);
  if (subjectNames.length === 0) return null;

  const effectiveWeights = weights && Object.keys(weights).length > 0
    ? weights
    : createUniformSubjectWeights(subjectNames);

  let sum = 0;
  let hasGrade = false;

  Object.entries(area.asignaturas).forEach(([subjectName, subject]) => {
    const grade = subject[period];
    const weight = effectiveWeights[subjectName] || 0;

    if (typeof grade === 'number') {
      sum += grade * weight;
      hasGrade = true;
    } else if (evaluated[period]) {
      sum += 0 * weight;
      hasGrade = true;
    }
  });

  return hasGrade ? roundToOneDecimal(sum) : null;
}

export function inferSubjectWeights(students: Estudiante[], areaName: string, grupo: string): Record<string, number> {
  const subjects = new Set<string>();
  students.forEach(s => {
    const area = s.areas[areaName];
    if (area) {
      Object.keys(area.asignaturas).forEach(asig => subjects.add(asig));
    }
  });

  const subjectList = Array.from(subjects);
  const grade = getGradeFromGroup(grupo);
  const preset = getPresetWeights(areaName, subjectList, grade);
  if (preset) return preset;

  if (subjectList.length === 0) return { [areaName]: 1.0 };
  if (subjectList.length === 1) return { [subjectList[0]]: 1.0 };

  const equalWeights: Record<string, number> = {};
  subjectList.forEach(s => equalWeights[s] = 1 / subjectList.length);

  // We only support inference for 2 or 3 subjects via grid search
  if (subjectList.length > 3) return equalWeights;

  const validStudents = students.filter(s => {
    const area = s.areas[areaName];
    if (!area || area.DEF.P1 === null) return false;
    for (const sub of subjectList) {
      if (area.asignaturas[sub]?.P1 == null) return false;
    }
    return true;
  });

  if (validStudents.length === 0) return equalWeights;

  let bestWeights: number[] = [];
  let minError = Infinity;

  const STEP = 0.01;

  if (subjectList.length === 2) {
    for (let w1 = 0.01; w1 < 1.0; w1 += STEP) {
      const w2 = 1 - w1;
      let error = 0;
      for (const s of validStudents) {
        const area = s.areas[areaName];
        const p1 = area.asignaturas[subjectList[0]].P1!;
        const p2 = area.asignaturas[subjectList[1]].P1!;
        const pred = p1 * w1 + p2 * w2;
        error += Math.abs(pred - area.DEF.P1!);
      }
      if (error < minError) {
        minError = error;
        bestWeights = [w1, w2];
      }
    }
  } else if (subjectList.length === 3) {
    for (let w1 = 0.01; w1 < 1.0; w1 += STEP) {
      for (let w2 = 0.01; w2 < 1.0 - w1; w2 += STEP) {
        const w3 = 1 - w1 - w2;
        if (w3 <= 0) continue;
        let error = 0;
        for (const s of validStudents) {
          const area = s.areas[areaName];
          const p1 = area.asignaturas[subjectList[0]].P1!;
          const p2 = area.asignaturas[subjectList[1]].P1!;
          const p3 = area.asignaturas[subjectList[2]].P1!;
          const pred = p1 * w1 + p2 * w2 + p3 * w3;
          error += Math.abs(pred - area.DEF.P1!);
        }
        if (error < minError) {
          minError = error;
          bestWeights = [w1, w2, w3];
        }
      }
    }
  }

  const avgError = minError / validStudents.length;

  if (avgError > 0.1) {
    return equalWeights;
  }

  const result: Record<string, number> = {};
  subjectList.forEach((sub, i) => {
    result[sub] = Math.round(bestWeights[i] * 100) / 100;
  });
  return result;
}
