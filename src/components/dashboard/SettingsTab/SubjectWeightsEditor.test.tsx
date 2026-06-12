
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubjectWeightsEditor } from './SubjectWeightsEditor';
import { useDashboardStore } from '../../../store/useDashboardStore';

vi.mock('../../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

const mockUpdateSubjectWeights = vi.fn();

describe('SubjectWeightsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupMock = (state: any) => {
    (useDashboardStore as unknown as any).mockImplementation((selector: any) => {
      const fullState = {
        updateSubjectWeights: mockUpdateSubjectWeights,
        ...state
      };
      return selector ? selector(fullState) : fullState;
    });
  };

  it('shows "Cargue un archivo Excel" when estudiantes is empty', () => {
    setupMock({
      estudiantes: [],
      availableGroups: [],
      subjectWeights: {}
    });

    render(<SubjectWeightsEditor />);
    expect(screen.getByText(/Cargue un archivo Excel/i)).toBeInTheDocument();
  });

  it('populates group selector from availableGroups (excluding Todos)', () => {
    setupMock({
      estudiantes: [{ grupo: '10A', areas: {} }],
      availableGroups: ['Todos', '10A', '10B'],
      subjectWeights: {}
    });

    render(<SubjectWeightsEditor />);
    const selects = screen.getAllByRole('combobox');
    const groupSelect = selects[0];
    
    const options = Array.from((groupSelect as HTMLSelectElement).options).map(o => o.value);
    expect(options).not.toContain('Todos');
    expect(options).toContain('10A');
    expect(options).toContain('10B');
  });

  it('selecting a group populates area selector with actual areas', () => {
    setupMock({
      estudiantes: [
        { 
          grupo: '10A', 
          areas: {
            'CIENCIAS': { asignaturas: { 'BIOLOGIA': 1 } },
            'MATEMATICAS': { asignaturas: { 'ALGEBRA': 1 } }
          }
        }
      ],
      availableGroups: ['Todos', '10A'],
      subjectWeights: {}
    });

    render(<SubjectWeightsEditor />);
    
    const selects = screen.getAllByRole('combobox');
    const groupSelect = selects[0];
    fireEvent.change(groupSelect, { target: { value: '10A' } });

    const areaSelect = selects[1];
    const options = Array.from((areaSelect as HTMLSelectElement).options).map(o => o.value);
    
    expect(options).toContain('CIENCIAS');
    expect(options).toContain('MATEMATICAS');
  });

  it('area with 1 subject shows "sin ponderación requerida" (read-only)', () => {
    setupMock({
      estudiantes: [
        { 
          grupo: '10A', 
          areas: {
            'MATEMATICAS': { asignaturas: { 'ALGEBRA': 1 } }
          }
        }
      ],
      availableGroups: ['Todos', '10A'],
      subjectWeights: {
        '10A': { 'MATEMATICAS': { 'ALGEBRA': 1.0 } }
      }
    });

    render(<SubjectWeightsEditor />);
    
    const selects = screen.getAllByRole('combobox');
    const groupSelect = selects[0];
    fireEvent.change(groupSelect, { target: { value: '10A' } });

    const areaSelect = selects[1];
    fireEvent.change(areaSelect, { target: { value: 'MATEMATICAS' } });

    expect(screen.getByText(/sin ponderación requerida/i)).toBeInTheDocument();
  });

  it('area with 2+ subjects: changing one auto-compensates others to sum 100%', () => {
    setupMock({
      estudiantes: [
        { 
          grupo: '10A', 
          areas: {
            'CIENCIAS': { 
              asignaturas: { 'BIOLOGIA': 1, 'QUIMICA': 1 }
            }
          }
        }
      ],
      availableGroups: ['Todos', '10A'],
      subjectWeights: {
        '10A': { 'CIENCIAS': { 'BIOLOGIA': 0.5, 'QUIMICA': 0.5 } }
      }
    });

    render(<SubjectWeightsEditor />);
    
    const selects = screen.getAllByRole('combobox');
    const groupSelect = selects[0];
    fireEvent.change(groupSelect, { target: { value: '10A' } });

    const areaSelect = selects[1];
    fireEvent.change(areaSelect, { target: { value: 'CIENCIAS' } });

    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
    
    fireEvent.change(sliders[0], { target: { value: '60' } });
    
    const currentValues = screen.getAllByRole('slider').map(s => Number((s as HTMLInputElement).value));
    
    expect(currentValues[0] + currentValues[1]).toBeCloseTo(100, 0);
  });
});
