import type { SortConfig } from '../../../../domain/types';

export const getSortIcon = (key: string, sortConfig: SortConfig | null): string => {
  if (sortConfig?.key !== key) return '↕️';
  return sortConfig?.direction === 'desc' ? '⬇️' : '⬆️';
};
