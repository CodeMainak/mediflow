import React from 'react';

interface MedicalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'green';
}

export const MedicalLogo: React.FC<MedicalLogoProps> = ({ 
  size = 'md', 
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const getColors = () => {
    switch (variant) {
      case 'white':
        return {
          primary: 'text-white',
          secondary: 'text-white/80',
          accent: 'text-white/60'
        };
      case 'green':
        return {
          primary: 'text-green-600',
          secondary: 'text-emerald-600',
          accent: 'text-teal-600'
        };
      default:
        return {
          primary: 'text-green-600',
          secondary: 'text-emerald-600',
          accent: 'text-teal-600'
        };
    }
  };

  const colors = getColors();

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          className="fill-green-50 stroke-green-200"
          strokeWidth="2"
        />
        
        {/* Medical Cross */}
        <path
          d="M45 20 L55 20 L55 80 L45 80 Z M20 45 L80 45 L80 55 L20 55 Z"
          className={colors.primary}
          fill="currentColor"
        />
        
        {/* Stethoscope curve */}
        <path
          d="M30 35 Q25 30 20 35 Q15 40 20 45 Q25 50 30 45"
          className={colors.secondary}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Heart symbol */}
        <path
          d="M70 30 Q75 25 80 30 Q85 35 80 40 L70 50 L60 40 Q55 35 60 30 Q65 25 70 30 Z"
          className={colors.accent}
          fill="currentColor"
        />
        
        {/* DNA Helix */}
        <path
          d="M15 65 Q20 60 25 65 Q30 70 35 65 Q40 60 45 65"
          className={colors.secondary}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M15 75 Q20 70 25 75 Q30 80 35 75 Q40 70 45 75"
          className={colors.accent}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};