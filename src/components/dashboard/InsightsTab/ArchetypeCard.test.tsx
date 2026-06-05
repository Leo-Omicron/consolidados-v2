import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { ArchetypeResult } from '../../../domain/types';

// Dynamic import — RED phase: file does not exist yet

const mockConfiado: ArchetypeResult = {
  estudianteId: 'c1',
  estudianteName: 'María García',
  grupo: '10A',
  archetype: 'confiado',
  confidence: 0.9,
  severity: 'high',
  periodGrades: [4.8, 4.3, 3.9, 3.5],
  narrative:
    'El estudiante inició con un promedio alto (P1=4.8, P2=4.3, P3=3.9, P4=3.5) pero muestra una tendencia de declive sostenido. La caída total es significativa, lo que sugiere exceso de confianza o desmotivación progresiva. Confianza del diagnóstico: 90%. Se recomienda intervención temprana para frenar la tendencia.',
};

const mockResiliente: ArchetypeResult = {
  estudianteId: 'r1',
  estudianteName: 'Carlos López',
  grupo: '10B',
  archetype: 'resiliente',
  confidence: 0.85,
  severity: 'high',
  periodGrades: [2.0, 2.5, 3.0, 3.5],
  narrative:
    'El estudiante arrancó con un promedio bajo (P1=2, P2=2.5, P3=3, P4=3.5) pero evidencia una mejora constante período a período. Este patrón indica esfuerzo, adaptación positiva y resiliencia académica. Confianza del diagnóstico: 85%. Se sugiere reconocer y reforzar esta trayectoria de mejora.',
};

const mockRadar: ArchetypeResult = {
  estudianteId: 'rd1',
  estudianteName: 'Ana Torres',
  grupo: '10A',
  archetype: 'radar',
  confidence: 0.5,
  severity: 'medium',
  periodGrades: [3.5, 3.2, 3.0, 2.8],
  narrative:
    'Aunque el estudiante no encaja en un patrón claro de declive o mejora, sus calificaciones (P1=3.5, P2=3.2, P3=3, P4=2.8) presentan señales de alerta: nota final baja o caídas puntuales pronunciadas. Esto amerita seguimiento cercano. Confianza del diagnóstico: 50%. Se sugiere monitoreo activo en el próximo período.',
};

const mockMontanaRusa: ArchetypeResult = {
  estudianteId: 'm1',
  estudianteName: 'Pedro Ruiz',
  grupo: '10C',
  archetype: 'montana-rusa',
  confidence: 0.75,
  severity: 'high',
  periodGrades: [4.5, 2.5, 4.0, 3.0],
  narrative:
    'Las calificaciones del estudiante presentan alta variabilidad (P1=4.5, P2=2.5, P3=4, P4=3), alternando entre períodos altos y bajos. Este patrón de "montaña rusa" puede reflejar inconsistencia en el esfuerzo, factores externos o dificultades específicas en ciertos cortes. Confianza del diagnóstico: 75%. Se recomienda indagar las causas de los picos y valles.',
};

describe('ArchetypeCard', () => {
  it('renders the student name', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockConfiado} />);
    expect(screen.getByText('María García')).toBeInTheDocument();
  });


  it('keeps the student name in its own non-truncated heading row', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockConfiado} />);

    const heading = screen.getByRole('heading', { name: mockConfiado.estudianteName });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toContain('break-words');
    expect(heading.className).not.toContain('truncate');
  });

  it('renders period grades as pills with correct values', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockConfiado} />);
    // Period pills
    expect(screen.getByText('P1: 4.8')).toBeInTheDocument();
    expect(screen.getByText('P2: 4.3')).toBeInTheDocument();
    expect(screen.getByText('P3: 3.9')).toBeInTheDocument();
    expect(screen.getByText('P4: 3.5')).toBeInTheDocument();
  });

  it('shows null period grades as "—"', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    const withNull = { ...mockConfiado, periodGrades: [4.0, null, 3.5, null] };
    render(<ArchetypeCard result={withNull} />);
    expect(screen.getByText('P1: 4.0')).toBeInTheDocument();
    expect(screen.getByText('P2: —')).toBeInTheDocument();
    expect(screen.getByText('P3: 3.5')).toBeInTheDocument();
    expect(screen.getByText('P4: —')).toBeInTheDocument();
  });

  it('displays the archetype label in Spanish', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockConfiado} />);
    expect(screen.getByText('El Confiado')).toBeInTheDocument();
  });

  it('displays Resiliente label correctly', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockResiliente} />);
    expect(screen.getByText('El Resiliente')).toBeInTheDocument();
  });

  it('displays Montaña Rusa label correctly', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockMontanaRusa} />);
    expect(screen.getByText('Montaña Rusa')).toBeInTheDocument();
  });

  it('displays Radar label correctly', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockRadar} />);
    expect(screen.getByText('Radar')).toBeInTheDocument();
  });

  it('renders the severity badge with the correct severity text', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockConfiado} />);
    // "Alerta" badge — may appear alongside similar words in narrative
    const matches = screen.getAllByText(/Alerta/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders medium severity badge for medium severity result', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockRadar} />);
    const matches = screen.getAllByText(/Moderado/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the narrative text', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockConfiado} />);
    expect(screen.getByText(/declive sostenido/)).toBeInTheDocument();
  });

  it('renders the confidence percentage', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockConfiado} />);
    // Confidence appears both in narrative and in the dedicated display —
    // use getAllByText and verify at least one exists
    const matches = screen.getAllByText(/90%/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the grupo information', async () => {
    const { ArchetypeCard } = await import('./ArchetypeCard');
    render(<ArchetypeCard result={mockConfiado} />);
    expect(screen.getByText('Grupo 10A')).toBeInTheDocument();
  });
});
