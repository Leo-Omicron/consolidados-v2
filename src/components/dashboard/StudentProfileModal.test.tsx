import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// RED phase: component and types don't exist yet
import { StudentProfileModal } from './StudentProfileModal';
import type { StudentProfileData } from '../../services/studentProfileService';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const mockProfileData: StudentProfileData = {
  studentId: 's1',
  studentName: 'María García',
  grupo: '10A',
  areaGrades: {
    Matemáticas: 4.25,
    Lenguaje: 3.25,
    Ciencias: 4.25,
    Sociales: 2.75,
  },
  groupAverages: {
    Matemáticas: 3.75,
    Lenguaje: 3.75,
    Ciencias: 3.625,
    Sociales: 2.75,
  },
  fortalezas: ['Matemáticas', 'Ciencias'],
  puntosMejora: ['Sociales', 'Lenguaje'],
  insight: 'Tendencia de declive sostenido.',
  arquetipo: 'El Confiado',
  isSimulated: false,
};

const mockProfileWithSimulation: StudentProfileData = {
  ...mockProfileData,
  isSimulated: true,
};

const mockProfileNoChartData: StudentProfileData = {
  studentId: 's2',
  studentName: 'Sin Notas',
  grupo: '10B',
  areaGrades: {},
  groupAverages: {},
  fortalezas: [],
  puntosMejora: [],
  insight: null,
  arquetipo: null,
  isSimulated: false,
};

const mockProfileNoInsight: StudentProfileData = {
  ...mockProfileData,
  insight: null,
  arquetipo: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StudentProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.classList.remove('printing-student-profile');
  });

  // ---- RED-1: Renders nothing when isOpen is false ----
  it('does not render when isOpen is false', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={false}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('María García')).not.toBeInTheDocument();
  });

  // ---- RED-2: Renders student name and group when open ----
  it('renders student name and group when isOpen is true', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText(/10A/)).toBeInTheDocument();
  });

  // ---- RED-3: Renders area grades ----
  it('renders area grades with numeric values', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    // Area names should be visible (appear in both table and strengths list)
    const matches = screen.getAllByText('Matemáticas');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // Grade value 4.25 should be visible (appears in table and fortalezas)
    const gradeMatches = screen.getAllByText('4.25');
    expect(gradeMatches.length).toBeGreaterThanOrEqual(1);
  });

  // ---- RED-4: Renders fortalezas and puntosMejora ----
  it('renders fortalezas and puntosMejora sections', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Fortalezas/i)).toBeInTheDocument();
    expect(screen.getByText(/Mejora/i)).toBeInTheDocument();
  });

  // ---- RED-5: Renders insight when available ----
  it('renders pedagogical insight text and archetype badge when available', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/El Confiado/)).toBeInTheDocument();
    expect(screen.getByText(/declive sostenido/)).toBeInTheDocument();
  });

  // ---- RED-6: Does not render insight section when no insight ----
  it('does not render insight section when no insight data', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileNoInsight}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('El Confiado')).not.toBeInTheDocument();
  });

  // ---- RED-7: Closes on Escape key ----
  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={onClose}
      />,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ---- RED-8: Closes on overlay click ----
  it('calls onClose when overlay/backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={onClose}
      />,
    );
    // Click the backdrop overlay — find the parent backdrop element
    // The overlay is the parent with the click handler
    const backdrops = document.querySelectorAll('.fixed.inset-0');
    // Click on the first backdrop (the one that's part of the overlay)
    for (const el of backdrops) {
      if (el.getAttribute('aria-hidden') !== 'true') {
        fireEvent.click(el);
        break;
      }
    }
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ---- RED-9: Closes on X/Close button ----
  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={onClose}
      />,
    );
    const closeButton = screen.getByRole('button', { name: /cerrar/i });
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ---- RED-10: Print button calls window.print ----
  it('calls window.print when print button is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    const printButton = screen.getByRole('button', { name: /imprimir/i });
    await userEvent.click(printButton);
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains('printing-student-profile')).toBe(true);

    window.dispatchEvent(new Event('afterprint'));
    expect(document.body.classList.contains('printing-student-profile')).toBe(false);
    printSpy.mockRestore();
  });

  it('cleans up print isolation state if window.print fails', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {
      throw new Error('print unavailable');
    });
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    const printButton = screen.getByRole('button', { name: /imprimir/i });
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains('printing-student-profile')).toBe(false);
    printSpy.mockRestore();
  });

  it('keeps print isolation until the fallback timeout when afterprint does not fire', () => {
    vi.useFakeTimers();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    try {
      render(
        <StudentProfileModal
          profileData={mockProfileData}
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      const printButton = screen.getByRole('button', { name: /imprimir/i });
      fireEvent.click(printButton);

      expect(document.body.classList.contains('printing-student-profile')).toBe(true);

      vi.advanceTimersByTime(29_999);
      expect(document.body.classList.contains('printing-student-profile')).toBe(true);

      vi.advanceTimersByTime(1);
      expect(document.body.classList.contains('printing-student-profile')).toBe(false);
    } finally {
      printSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('marks the dialog as the isolated print root', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('data-student-profile-print-root');
  });

  // ---- RED-11: Shows projection banner when isSimulated is true ----
  it('renders "Modo Proyección" banner when isSimulated is true', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileWithSimulation}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Proyección/i)).toBeInTheDocument();
    expect(screen.getByText(/Simulaciones Activas/i)).toBeInTheDocument();
  });

  // ---- RED-12: Does NOT show projection banner when isSimulated is false ----
  it('does not show projection banner when isSimulated is false', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Proyección/i)).not.toBeInTheDocument();
  });

  // ---- RED-13: Renders fallback when no chart data ----
  it('renders chart fallback message when areaGrades is empty', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileNoChartData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/No hay suficientes calificaciones/i)).toBeInTheDocument();
  });

  // ---- RED-14: Renders chart area when data exists ----
  it('renders a chart canvas when area grades exist', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    // chart.js renders a canvas element
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  // ---- RED-15: Print-only class present for print styling ----
  it('has print-only CSS classes for the A4 print layout', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    // The modal content should use print:block for the printable area
    const dialog = screen.getByRole('dialog');
    // Check that the print-related styling is present on the dialog
    expect(dialog.className).toContain('print:');
  });

  // ---- RED-16: Modal renders as a dialog with proper ARIA role ----
  it('renders as an accessible dialog', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // ---- RED-17: Displays group averages alongside student grades ----
  it('displays group average alongside the student grade for each area', () => {
    render(
      <StudentProfileModal
        profileData={mockProfileData}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    // Group average 3.75 should be visible (appears for both Matemáticas and Lenguaje)
    const avgMatches = screen.getAllByText('3.75');
    expect(avgMatches.length).toBeGreaterThanOrEqual(1);
  });
});
