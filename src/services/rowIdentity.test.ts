import { describe, expect, it } from 'vitest';
import { createAreaRowId, createSubjectRowId, parseRowId } from './rowIdentity';

describe('rowIdentity', () => {
  it('round-trips area row identities with underscores and separators', () => {
    const rowId = createAreaRowId('student_1', 'Ciencias_Naturales|Biología');

    expect(parseRowId(rowId)).toEqual({
      type: 'area',
      studentId: 'student_1',
      areaName: 'Ciencias_Naturales|Biología',
    });
  });

  it('round-trips subject row identities with underscores and separators', () => {
    const rowId = createSubjectRowId('student_1', 'Ciencias_Naturales', 'Lab_Biología|Avanzada');

    expect(parseRowId(rowId)).toEqual({
      type: 'subject',
      studentId: 'student_1',
      areaName: 'Ciencias_Naturales',
      subjectName: 'Lab_Biología|Avanzada',
    });
  });

  it('returns null for legacy or malformed ids instead of guessing', () => {
    expect(parseRowId('student_1_Ciencias_Naturales')).toBeNull();
    expect(parseRowId('area:only-one-part')).toBeNull();
    expect(parseRowId('subject:only|two')).toBeNull();
  });
});
