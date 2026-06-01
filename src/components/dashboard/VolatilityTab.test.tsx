import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';
import 'vitest-axe/extend-expect';
import { VolatilityTab } from './VolatilityTab';
import { useDashboardStore } from '../../store/useDashboardStore';

describe('VolatilityTab', () => {
  const testStudents = [
    {
      id: 'V1', name: 'Ascenso', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', asignaturas: { ALG: { name: 'ALG', P1: 2.0, P2: 3.0, P3: 4.0, P4: 4.5, def: 0, faltas: 0 } } }
      }
    },
    {
      id: 'V2', name: 'Caída Libre', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', asignaturas: { ALG: { name: 'ALG', P1: 4.5, P2: 3.5, P3: 2.0, P4: 1.0, def: 0, faltas: 0 } } }
      }
    },
    {
      id: 'V3', name: 'Montaña Rusa', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', asignaturas: { ALG: { name: 'ALG', P1: 5.0, P2: 1.0, P3: 4.5, P4: 1.5, def: 0, faltas: 0 } } }
      }
    },
    {
      id: 'V4', name: 'Estable Flat', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', asignaturas: { ALG: { name: 'ALG', P1: 4.0, P2: 4.0, P3: 4.0, P4: 4.0, def: 0, faltas: 0 } } }
      }
    },
    {
      id: 'V5', name: 'Estable Normal', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', asignaturas: { ALG: { name: 'ALG', P1: 4.0, P2: 4.2, P3: 3.9, P4: 4.1, def: 0, faltas: 0 } } }
      }
    },
    {
      id: 'V6', name: 'Sin Datos', CURSO: '10B', grupo: '10B', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', asignaturas: { ALG: { name: 'ALG', P1: 4.0, P2: null, P3: null, P4: null, def: 0, faltas: 0 } } }
      }
    }
  ];

  beforeEach(() => {
    useDashboardStore.setState({
      estudiantes: testStudents as any,
      selectedGrupo: 'Todos',
      setGrupo: (g: string) => useDashboardStore.setState({ selectedGrupo: g })
    });
  });

  it('renders empty state when no students', () => {
    useDashboardStore.setState({ estudiantes: [] });
    const { container } = render(<VolatilityTab />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has no accessibility violations when empty', async () => {
    useDashboardStore.setState({ estudiantes: [] });
    const { container } = render(<VolatilityTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with data', async () => {
    const { container } = render(<VolatilityTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders all volatility profiles for group 10A correctly', () => {
    render(<VolatilityTab />);
    
    // Check main counts
    expect(screen.getAllByText('Montaña Rusa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Caída Libre').length).toBeGreaterThan(0);
    expect(screen.getByText('En Ascenso')).toBeInTheDocument();
    expect(screen.getByText('Estables')).toBeInTheDocument();
    
    // Ascenso
    expect(screen.getAllByText('Ascenso').length).toBeGreaterThan(0);
    
    // Caída Libre
    expect(screen.getByText('Caída Libre', { selector: 'h3 + span' })).toBeInTheDocument();
    
    // Montaña Rusa
    expect(screen.getByText('Montaña Rusa', { selector: 'h3 + span' })).toBeInTheDocument();
    
    // Estable
    expect(screen.getAllByText('Estable', { selector: 'h3 + span' }).length).toBe(2); // V4 and V5

    // Descriptions
    expect(screen.getByText('El rendimiento del estudiante mejora de forma constante periodo tras periodo.')).toBeInTheDocument();
    expect(screen.getByText('Alerta: El rendimiento está empeorando sistemáticamente cada periodo.')).toBeInTheDocument();
    expect(screen.getByText('El rendimiento es altamente inconsistente con picos y caídas bruscas.')).toBeInTheDocument();
  });

  it('renders insufficient data state when less than 2 periods exist', async () => {
    render(<VolatilityTab />);
    
    const groupSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(groupSelect, '10B');
    
    expect(screen.getByText('⚠️ No hay suficientes periodos evaluados aún para calcular volatilidad (se requieren al menos 2 periodos).')).toBeInTheDocument();
  });
});
