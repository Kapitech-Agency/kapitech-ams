import React from 'react';

interface AmsBrandLogoProps {
  className?: string;
  compact?: boolean;
}

export const AmsBrandLogo: React.FC<AmsBrandLogoProps> = ({ className = '', compact = false }) => (
  <span
    aria-hidden="true"
    className={`block shrink-0 bg-accent ${compact ? 'h-5 w-5' : 'h-6 w-6'} ${className}`}
    style={{
      WebkitMaskImage: "url('/white.png')",
      maskImage: "url('/white.png')",
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
    }}
  />
);

export default AmsBrandLogo;
