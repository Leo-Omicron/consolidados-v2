import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { StudentProfileData } from '../../services/studentProfileService';
import { StudentProfileView } from './StudentProfileView';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StudentProfileModalProps {
  profileData: StudentProfileData | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRINTING_STUDENT_PROFILE_CLASS = 'printing-student-profile';
const PRINT_CLEANUP_FALLBACK_MS = 30_000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  profileData,
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap: focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handlePrint = useCallback(() => {
    document.body.classList.add(PRINTING_STUDENT_PROFILE_CLASS);
    let fallbackTimeoutId: number | undefined;

    const cleanupPrintClass = () => {
      document.body.classList.remove(PRINTING_STUDENT_PROFILE_CLASS);
      window.removeEventListener('afterprint', cleanupPrintClass);
      if (fallbackTimeoutId !== undefined) {
        window.clearTimeout(fallbackTimeoutId);
      }
    };

    window.addEventListener('afterprint', cleanupPrintClass);
    try {
      window.print();
      fallbackTimeoutId = window.setTimeout(cleanupPrintClass, PRINT_CLEANUP_FALLBACK_MS);
    } catch {
      cleanupPrintClass();
    }
  }, []);

  if (!isOpen || !profileData) return null;

  const modalContent = (
    <div
      data-student-profile-overlay
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:static print:bg-transparent print:backdrop-blur-none"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        data-student-profile-print-root
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${profileData.studentName}`}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl print:shadow-none print:max-h-none print:w-full print:max-w-none print:rounded-none print:border-none print:overflow-visible"
      >
        {/* ── Projection Banner ── */}
        {profileData.isSimulated && (
          <div className="sticky top-0 z-10 bg-amber-100 dark:bg-amber-900/50 border-b border-amber-300 dark:border-amber-700 px-6 py-3 text-center print:hidden">
            <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide text-sm">
              ⚠️ Modo Proyección — Simulaciones Activas
            </span>
          </div>
        )}

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between print:relative">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {profileData.studentName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Grupo {profileData.grupo}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 transition-colors"
              aria-label="Imprimir Ficha"
            >
              🖨️ Imprimir Ficha
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 focus:outline-2 focus:outline-offset-2 focus:outline-slate-400 transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <StudentProfileView profileData={profileData} />
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
