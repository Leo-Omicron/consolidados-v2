import React, { useMemo } from 'react';

interface StatusBadgeProps {
  text: string;
  color: string;
  isMini?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ text, color, isMini = false }) => {
  const badgeClasses = useMemo(() => {
    switch (color) {
      case 'green':
        return 'app-status-green border';
      case 'yellow':
        return 'app-status-yellow border';
      case 'red':
        return 'app-status-red border';
      case 'cyan':
        return 'app-status-cyan border';
      case 'blue':
        return 'app-status-blue border';
      default:
        return 'app-status-default border';
    }
  }, [color]);

  return (
    <span
      role="status"
      aria-label={`Estado: ${text}`}
      className={`px-2 py-0.5 inline-flex ${isMini ? 'text-[10px]' : 'text-xs'} leading-5 font-bold rounded-full transition-premium ${badgeClasses}`}
    >
      {text}
    </span>
  );
};
