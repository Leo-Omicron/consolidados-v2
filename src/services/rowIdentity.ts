export type RowIdentity =
  | { type: 'area'; studentId: string; areaName: string }
  | { type: 'subject'; studentId: string; areaName: string; subjectName: string };

const AREA_PREFIX = 'area:';
const SUBJECT_PREFIX = 'subject:';
const SEPARATOR = '|';

function encodePart(value: string): string {
  return encodeURIComponent(value);
}

function decodePart(value: string): string {
  return decodeURIComponent(value);
}

export function createAreaRowId(studentId: string, areaName: string): string {
  return `${AREA_PREFIX}${encodePart(studentId)}${SEPARATOR}${encodePart(areaName)}`;
}

export function createSubjectRowId(studentId: string, areaName: string, subjectName: string): string {
  return `${SUBJECT_PREFIX}${encodePart(studentId)}${SEPARATOR}${encodePart(areaName)}${SEPARATOR}${encodePart(subjectName)}`;
}

export function parseRowId(rowId: string): RowIdentity | null {
  if (rowId.startsWith(AREA_PREFIX)) {
    const parts = rowId.slice(AREA_PREFIX.length).split(SEPARATOR);
    if (parts.length !== 2) return null;
    return { type: 'area', studentId: decodePart(parts[0]), areaName: decodePart(parts[1]) };
  }

  if (rowId.startsWith(SUBJECT_PREFIX)) {
    const parts = rowId.slice(SUBJECT_PREFIX.length).split(SEPARATOR);
    if (parts.length !== 3) return null;
    return {
      type: 'subject',
      studentId: decodePart(parts[0]),
      areaName: decodePart(parts[1]),
      subjectName: decodePart(parts[2]),
    };
  }

  return null;
}

export function createLegacyAreaRowId(studentId: string, areaName: string): string {
  return `${studentId}_${areaName}`;
}

export function createLegacySubjectRowId(studentId: string, areaName: string, subjectName: string): string {
  return `${studentId}_${areaName}_${subjectName}`;
}
