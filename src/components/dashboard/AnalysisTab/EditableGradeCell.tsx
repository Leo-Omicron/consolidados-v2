import React, { useState } from 'react';

export const EditableGradeCell: React.FC<{
  rowId: string;
  period: 'P1' | 'P2' | 'P3' | 'P4';
  originalGrade: number | null | undefined;
  simulatedGrade: number | null | undefined;
  onSave: (rowId: string, period: 'P1' | 'P2' | 'P3' | 'P4', value: number | null) => void;
}> = ({ rowId, period, originalGrade, simulatedGrade, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string>(
    simulatedGrade !== undefined && simulatedGrade !== null
      ? simulatedGrade.toString()
      : originalGrade !== undefined && originalGrade !== null
      ? originalGrade.toString()
      : ''
  );

  const [prevSimulated, setPrevSimulated] = useState(simulatedGrade);
  const [prevOriginal, setPrevOriginal] = useState(originalGrade);

  if (simulatedGrade !== prevSimulated || originalGrade !== prevOriginal) {
    setPrevSimulated(simulatedGrade);
    setPrevOriginal(originalGrade);
    setValue(
      simulatedGrade !== undefined && simulatedGrade !== null
        ? simulatedGrade.toString()
        : originalGrade !== undefined && originalGrade !== null
        ? originalGrade.toString()
        : ''
    );
  }

  const isSimulated = simulatedGrade !== undefined && simulatedGrade !== null;
  const displayGrade = isSimulated ? simulatedGrade : originalGrade;

  const handleBlur = () => {
    setIsEditing(false);
    if (value.trim() === '') {
      onSave(rowId, period, null);
    } else {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        onSave(rowId, period, parsed);
      } else {
        setValue(originalGrade?.toString() ?? '');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setValue(
        simulatedGrade !== undefined && simulatedGrade !== null
          ? simulatedGrade.toString()
          : originalGrade !== undefined && originalGrade !== null
          ? originalGrade.toString()
          : ''
      );
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min="0"
        max="5"
        step="0.1"
        className="w-16 px-1 py-0.5 text-center border rounded border-amber-500 bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`px-1.5 py-0.5 rounded font-medium cursor-pointer transition-all select-none ${
        isSimulated
          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold shadow-sm'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      {displayGrade !== null && displayGrade !== undefined ? displayGrade.toFixed(2) : '-'}
    </span>
  );
};
