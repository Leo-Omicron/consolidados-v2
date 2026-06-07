import { describe, it, expect } from 'vitest';
import { getPresetWeights } from './academicWeights';

describe('getPresetWeights', () => {
  it('returns mathematics preset', () => {
    expect(getPresetWeights('MATEMATICAS', ['ESTADISTICA', 'GEOMETRIA', 'MATEMATICAS'], 6)).toEqual({
      'ESTADISTICA': 0.30, 'GEOMETRIA': 0.20, 'MATEMATICAS': 0.50
    });
    expect(getPresetWeights('MATEMATICAS', ['ESTADISTICA', 'GEOMETRIA', 'MATEMATICAS'], 3)).toEqual({
      'ESTADISTICA': 0.25, 'GEOMETRIA': 0.25, 'MATEMATICAS': 0.50
    });
  });

  it('returns ciencias sociales 6-8 preset', () => {
    expect(getPresetWeights('CIENCIAS SOCIALES', ['COMPETENCIAS CIUDADANAS', 'GEOGRAFIA', 'HISTORIA'], 7)).toEqual({
      'COMPETENCIAS CIUDADANAS': 0.40, 'GEOGRAFIA': 0.20, 'HISTORIA': 0.40
    });
  });

  it('returns ciencias sociales 9 preset exception without geografia', () => {
    expect(getPresetWeights('CIENCIAS SOCIALES', ['CATEDRA DE LA PAZ', 'COMPETENCIAS CIUDADANAS', 'HISTORIA'], 9)).toEqual({
      'CATEDRA DE LA PAZ': 0.20, 'HISTORIA': 0.40, 'COMPETENCIAS CIUDADANAS': 0.40
    });
  });

  it('returns ciencias sociales 10-11 preset', () => {
    expect(getPresetWeights('CIENCIAS SOCIALES', ['ECONOMIA', 'COMPETENCIAS CIUDADANAS'], 11)).toEqual({
      'ECONOMIA': 0.50, 'COMPETENCIAS CIUDADANAS': 0.50
    });
  });

  it('returns ciencias naturales 6-9 preset', () => {
    expect(getPresetWeights('CIENCIAS NATURALES', ['EDUCACION AMBIENTAL', 'BIOLOGIA'], 8)).toEqual({
      'EDUCACION AMBIENTAL': 0.40, 'BIOLOGIA': 0.60
    });
  });

  it('returns ciencias naturales 10-11 preset exception without biologia', () => {
    expect(getPresetWeights('CIENCIAS NATURALES', ['QUIMICA', 'FISICA'], 10)).toEqual({
      'QUIMICA': 0.50, 'FISICA': 0.50
    });
  });
  
  it('returns ciencias naturales primary preset', () => {
    expect(getPresetWeights('CIENCIAS NATURALES', ['EDUCACION AMBIENTAL', 'CIENCIAS NATURALES'], 3)).toEqual({
      'EDUCACION AMBIENTAL': 0.60, 'CIENCIAS NATURALES': 0.40
    });
  });

  it('returns humanidades preset', () => {
    expect(getPresetWeights('HUMANIDADES', ['COMPRENSION LECTORA', 'ESPAÑOL'], 9)).toEqual({
      'COMPRENSION LECTORA': 0.50, 'ESPAÑOL': 0.50
    });
    expect(getPresetWeights('HUMANIDADES', ['COMPRENSION LECTORA', 'ESPAÑOL'], 11)).toEqual({
      'COMPRENSION LECTORA': 0.60, 'ESPAÑOL': 0.40
    });
  });

  it('returns null for unknown', () => {
    expect(getPresetWeights('ARTES', ['DIBUJO', 'PINTURA'], 6)).toBeNull();
  });
});
