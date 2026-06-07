import type { PedagogicalArchetype, ArchetypeSeverity, ArchetypeResult } from '../../domain/types';
import { generateNarrative } from './insightGenerator';

// ---------------------------------------------------------------------------
// Detection thresholds (tunable constants — not magic numbers)
// ---------------------------------------------------------------------------

const CONFIADO_MIN_AVG_FIRST_TWO = 4.0;
const CONFIADO_MIN_TOTAL_DROP = 0.8;
const CONFIADO_MIN_PERIOD_DROP = 0.3;

const RESILIENTE_MAX_AVG_FIRST_TWO = 3.0;
const RESILIENTE_MIN_TOTAL_RISE = 0.8;
const RESILIENTE_MIN_PERIOD_RISE = 0.3;

const MONTANA_RUSA_MIN_SIGN_CHANGES = 2;
const MONTANA_RUSA_MIN_SWING = 0.8;
const MONTANA_RUSA_MIN_DELTA = 0.3;

const RADAR_FAILING_GRADE = 3.0;
const RADAR_MIN_SINGLE_DROP = 0.5;

const SEVERITY_HIGH = 0.7;
const SEVERITY_MEDIUM = 0.4;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface DetectorResult {
  archetype: PedagogicalArchetype;
  confidence: number;
  severity: ArchetypeSeverity;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Filter out null values and return the clean numeric grade array */
export function cleanGrades(periodGrades: (number | null)[]): number[] {
  return periodGrades.filter((g): g is number => g !== null);
}

/** Compute severity from confidence (high ≥ 0.7, medium ≥ 0.4, low < 0.4) */
function confidenceToSeverity(confidence: number): ArchetypeSeverity {
  if (confidence >= SEVERITY_HIGH) return 'high';
  if (confidence >= SEVERITY_MEDIUM) return 'medium';
  return 'low';
}

/** Check if array is monotonically non-increasing */
function isMonotonicNonIncreasing(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) return false;
  }
  return true;
}

/** Check if array is monotonically non-decreasing */
function isMonotonicNonDecreasing(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// El Confiado — sustained decline from high start
// ---------------------------------------------------------------------------

export function detectConfiado(periodGrades: (number | null)[]): DetectorResult | null {
  const grades = cleanGrades(periodGrades);
  if (grades.length < 2) return null;

  const avgFirstTwo = (grades[0] + grades[1]) / 2;
  if (avgFirstTwo < CONFIADO_MIN_AVG_FIRST_TWO) return null;

  if (!isMonotonicNonIncreasing(grades)) return null;

  const maxGrade = Math.max(...grades);
  const minGrade = Math.min(...grades);
  const totalDrop = maxGrade - minGrade;
  if (totalDrop < CONFIADO_MIN_TOTAL_DROP) return null;

  const hasSharpDrop = grades.some((g, i) => {
    if (i === 0) return false;
    return grades[i - 1] - g >= CONFIADO_MIN_PERIOD_DROP;
  });
  if (!hasSharpDrop) return null;

  const confidence = Math.min(1.0, totalDrop / CONFIADO_MIN_TOTAL_DROP);

  return {
    archetype: 'confiado',
    confidence: Math.round(confidence * 100) / 100,
    severity: confidenceToSeverity(confidence),
  };
}

// ---------------------------------------------------------------------------
// El Resiliente — sustained improvement from low start
// ---------------------------------------------------------------------------

export function detectResiliente(periodGrades: (number | null)[]): DetectorResult | null {
  const grades = cleanGrades(periodGrades);
  if (grades.length < 2) return null;

  const avgFirstTwo = (grades[0] + grades[1]) / 2;
  if (avgFirstTwo > RESILIENTE_MAX_AVG_FIRST_TWO) return null;

  if (!isMonotonicNonDecreasing(grades)) return null;

  const totalRise = grades[grades.length - 1] - grades[0];
  if (totalRise < RESILIENTE_MIN_TOTAL_RISE) return null;

  const hasSharpRise = grades.some((g, i) => {
    if (i === 0) return false;
    return g - grades[i - 1] >= RESILIENTE_MIN_PERIOD_RISE;
  });
  if (!hasSharpRise) return null;

  const confidence = Math.min(1.0, totalRise / RESILIENTE_MIN_TOTAL_RISE);

  return {
    archetype: 'resiliente',
    confidence: Math.round(confidence * 100) / 100,
    severity: confidenceToSeverity(confidence),
  };
}

// ---------------------------------------------------------------------------
// La Montaña Rusa — oscillating grades
// ---------------------------------------------------------------------------

export function detectMontanaRusa(periodGrades: (number | null)[]): DetectorResult | null {
  const grades = cleanGrades(periodGrades);
  if (grades.length < 2) return null;

  const deltas: number[] = [];
  for (let i = 1; i < grades.length; i++) {
    deltas.push(grades[i] - grades[i - 1]);
  }

  let signChanges = 0;
  let prevSign: number | null = null;
  for (const d of deltas) {
    const sign = d > 0 ? 1 : d < 0 ? -1 : 0;
    if (sign !== 0 && prevSign !== null && sign !== prevSign) {
      signChanges++;
    }
    if (sign !== 0) prevSign = sign;
  }

  if (signChanges < MONTANA_RUSA_MIN_SIGN_CHANGES) return null;

  const absDeltas = deltas.map(d => Math.abs(d));
  const largestSwing = Math.max(...absDeltas);

  if (largestSwing < MONTANA_RUSA_MIN_SWING) return null;

  const hasSharpDelta = absDeltas.some(d => d >= MONTANA_RUSA_MIN_DELTA);
  if (!hasSharpDelta) return null;

  const confidence = Math.min(1.0, largestSwing / MONTANA_RUSA_MIN_SWING);

  return {
    archetype: 'montana-rusa',
    confidence: Math.round(confidence * 100) / 100,
    severity: confidenceToSeverity(confidence),
  };
}

// ---------------------------------------------------------------------------
// El Radar — warning flags without clear pattern
// ---------------------------------------------------------------------------

export function detectRadar(periodGrades: (number | null)[]): DetectorResult | null {
  const grades = cleanGrades(periodGrades);
  if (grades.length < 2) return null;

  let flags = 0;

  const finalGrade = grades[grades.length - 1];
  if (finalGrade < RADAR_FAILING_GRADE) flags++;

  let maxDrop = 0;
  for (let i = 1; i < grades.length; i++) {
    const drop = grades[i - 1] - grades[i];
    if (drop > maxDrop) maxDrop = drop;
  }
  if (maxDrop >= RADAR_MIN_SINGLE_DROP) flags++;

  if (flags === 0) return null;

  const confidence = Math.min(1.0, flags / 2);

  return {
    archetype: 'radar',
    confidence: Math.round(confidence * 100) / 100,
    severity: confidenceToSeverity(confidence),
  };
}

// ---------------------------------------------------------------------------
// Orchestrator: detectArchetype
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<PedagogicalArchetype, number> = {
  'confiado': 4,
  'resiliente': 3,
  'montana-rusa': 2,
  'radar': 1,
};

export function detectArchetype(periodGrades: (number | null)[]): ArchetypeResult | null {
  const grades = cleanGrades(periodGrades);

  if (grades.length < 2) return null;

  const detectors: Array<() => DetectorResult | null> = [
    () => detectConfiado(periodGrades),
    () => detectResiliente(periodGrades),
    () => detectMontanaRusa(periodGrades),
    () => detectRadar(periodGrades),
  ];

  let best: DetectorResult | null = null;

  for (const detect of detectors) {
    const result = detect();
    if (result === null) continue;
    if (best === null || SEVERITY_ORDER[result.archetype] > SEVERITY_ORDER[best.archetype]) {
      best = result;
    }
  }

  if (best === null) return null;

  const narrative = generateNarrative(best.archetype, best.confidence, periodGrades);

  return {
    estudianteId: '',
    estudianteName: '',
    grupo: '',
    archetype: best.archetype,
    confidence: best.confidence,
    severity: best.severity,
    periodGrades,
    narrative,
  };
}
