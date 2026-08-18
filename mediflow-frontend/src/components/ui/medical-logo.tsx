import React from 'react';

interface MedicalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 'badge' (default) draws the full mark — gradient tile + pulse line — as one self-contained unit. 'bare' draws just the pulse line with no tile, for placing directly on an existing dark background. */
  variant?: 'badge' | 'bare';
}

const SIZE_CLASSES = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

// A single pulse/EKG line is the one shape used for the brand throughout
// the app (this mark, the hero background) instead of a busy mix of
// unrelated medical icons competing for attention at 24px.
export const MedicalLogo: React.FC<MedicalLogoProps> = ({ size = 'md', variant = 'badge' }) => {
  const gradientId = `mediflow-logo-gradient-${React.useId()}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={SIZE_CLASSES[size]}
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === 'badge' && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" rx="24" fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline
        points="12,54 30,54 38,30 49,74 58,40 65,54 88,54"
        fill="none"
        stroke="#ffffff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
