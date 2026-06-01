import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FeedbackCard } from './FeedbackCard';
import type { TeacherFeedbackReport } from '../../domain/types';

const mockReportBase: TeacherFeedbackReport = {
  studentId: '1',
  weaknesses: [],
  promedioGrupo: 3.5,
  totalAreasCount: 5,
  studentName: 'John Doe',
  grupo: 'Grupo A',
  promedioActual: 3.5,
  overallStatus: 'Compromisos',
  failedAreasCount: 0,
  strengths: [],
  weaknessesDetail: [],
  adviceText: 'Estudiante requiere atención.',
  totalEstudiantesGrupo: 30,
  puestoGrupo: 15,
};

describe('FeedbackCard', () => {
  it('renders basic student information correctly', () => {
    render(<FeedbackCard report={mockReportBase} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
    expect(screen.getByText('Compromisos')).toBeInTheDocument();
    expect(screen.getByText('3.50')).toBeInTheDocument();
    expect(screen.getByText('Puesto: 15 de 30')).toBeInTheDocument();
    expect(screen.getByText('Estudiante requiere atención.')).toBeInTheDocument();
  });

  it('renders strengths correctly', () => {
    const reportWithStrengths = {
      ...mockReportBase,
      strengths: ['Matemáticas', 'Física'],
    };
    
    render(<FeedbackCard report={reportWithStrengths} />);
    
    expect(screen.getByText('⭐')).toBeInTheDocument();
    expect(screen.getByText('Matemáticas')).toBeInTheDocument();
    expect(screen.getByText('Física')).toBeInTheDocument();
  });

  it('renders weaknesses without rescue route (isImpossible = false)', () => {
    const reportWithWeakness = {
      ...mockReportBase,
      failedAreasCount: 1,
      weaknessesDetail: [
        {
          areaName: 'Química', grade: 2.0,
          requiredGrade: 4.5,
          isImpossible: false,
        },
      ],
    };
    
    render(<FeedbackCard report={reportWithWeakness} />);
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('Química')).toBeInTheDocument();
    expect(screen.getByText('4.50')).toBeInTheDocument();
  });

  it('renders weaknesses with isImpossible = true', () => {
    const reportWithImpossibleWeakness = {
      ...mockReportBase,
      failedAreasCount: 1,
      weaknessesDetail: [
        {
          areaName: 'Biología', grade: 2.0,
          requiredGrade: 5.5,
          isImpossible: true,
        },
      ],
    };
    
    render(<FeedbackCard report={reportWithImpossibleWeakness} />);
    
    expect(screen.getByText('Imposible (5.50)')).toBeInTheDocument();
  });

  it('renders weaknesses with rescue route', () => {
    const reportWithRescue = {
      ...mockReportBase,
      failedAreasCount: 1,
      weaknessesDetail: [
        {
          areaName: 'Historia', grade: 2.0,
          requiredGrade: 3.8,
          isImpossible: false,
          rescueRoute: [
            { asignatura: 'Historia Universal', targetGrade: 4.0 },
            { asignatura: 'Geografía', targetGrade: 3.6 },
          ],
        },
      ],
    };
    
    render(<FeedbackCard report={reportWithRescue} />);
    
    expect(screen.getByText('Ruta de Rescate (Nota Sugerida):')).toBeInTheDocument();
    expect(screen.getByText('Historia Universal')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(screen.getByText('Geografía')).toBeInTheDocument();
    expect(screen.getByText('3.6')).toBeInTheDocument();
  });
});
