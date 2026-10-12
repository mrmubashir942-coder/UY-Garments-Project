import React from 'react';
import originalLogoUrl from './uy-garments-logo.jpg';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'white' | 'dark' | 'auto';
  customUrl?: string;
}

export const UYGarmentsLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'auto',
  customUrl,
}) => {
  // Use uploaded original logo asset by default, or custom URL if configured
  const logoSrc = customUrl || originalLogoUrl || '/uy-garments-logo.jpg';

  // Dimension presets preserving original 2:3 aspect ratio without cropping or stretching
  const dimensions = {
    sm: { imgClass: 'h-9 w-auto', fontTitle: 'text-sm', fontSub: 'text-[9px]' },
    md: { imgClass: 'h-13 w-auto', fontTitle: 'text-base', fontSub: 'text-[10px]' },
    lg: { imgClass: 'h-20 w-auto', fontTitle: 'text-xl', fontSub: 'text-xs' },
    xl: { imgClass: 'h-28 w-auto', fontTitle: 'text-2xl', fontSub: 'text-sm' },
  }[size];

  // Dynamic text color based on prop (or auto based on container)
  const titleColorClass =
    textColor === 'white'
      ? 'text-white'
      : textColor === 'dark'
      ? 'text-neutral-950'
      : 'text-white group-data-[theme=light]:text-neutral-950';

  const subColorClass =
    textColor === 'white'
      ? 'text-neutral-400'
      : textColor === 'dark'
      ? 'text-neutral-600'
      : 'text-neutral-400';

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {/* Official UY Garments Logo Asset:
          Black Background, Golden Crown, Large Green UY, White GARMENTS */}
      <div className="relative inline-block rounded-lg bg-black overflow-hidden shadow-xs shrink-0 border border-neutral-900/40">
        <img
          src={logoSrc}
          alt="UY Garments Original Logo"
          className={`block ${dimensions.imgClass} object-contain transition-transform`}
          loading="eager"
          referrerPolicy="no-referrer"
        />
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <span className={`font-black tracking-wider uppercase ${dimensions.fontTitle} ${titleColorClass}`}>
            UY Garments
          </span>
          <span className={`font-semibold tracking-widest uppercase ${dimensions.fontSub} ${subColorClass}`}>
            Garments Management Software
          </span>
        </div>
      )}
    </div>
  );
};

export default UYGarmentsLogo;
