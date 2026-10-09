import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  customUrl?: string;
}

export const UYGarmentsLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  customUrl,
}) => {
  if (customUrl) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={customUrl}
          alt="UY Garments Logo"
          className={`object-contain rounded ${
            size === 'sm' ? 'h-8' : size === 'md' ? 'h-10' : size === 'lg' ? 'h-14' : 'h-20'
          }`}
        />
        {showText && (
          <div>
            <div className="font-extrabold tracking-wider text-white text-base uppercase">
              UY Garments
            </div>
            <div className="text-[10px] tracking-widest text-neutral-400 uppercase">
              Manufacturing & Wholesale
            </div>
          </div>
        )}
      </div>
    );
  }

  const dimensions = {
    sm: { icon: 34, fontTitle: 'text-sm', fontSub: 'text-[9px]' },
    md: { icon: 44, fontTitle: 'text-base', fontSub: 'text-[10px]' },
    lg: { icon: 58, fontTitle: 'text-xl', fontSub: 'text-xs' },
    xl: { icon: 76, fontTitle: 'text-2xl', fontSub: 'text-sm' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official UY Garments Emerald Green & Metallic Gold Artwork */}
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        <defs>
          {/* Rich Emerald Green Gradients */}
          <linearGradient id="uyGreenShield" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#146B3A" />
            <stop offset="50%" stopColor="#0B4D26" />
            <stop offset="100%" stopColor="#052E17" />
          </linearGradient>

          {/* Premium Metallic Gold Gradients */}
          <linearGradient id="uyGoldPrimary" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="25%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#FFF2A3" />
            <stop offset="75%" stopColor="#AA7C11" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>

          <linearGradient id="uyGoldInner" x1="25" y1="20" x2="75" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#B27B00" />
          </linearGradient>

          {/* Outer Border Stroke */}
          <linearGradient id="uyGoldBorder" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE57F" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#FFF3B0" />
            <stop offset="100%" stopColor="#8A6307" />
          </linearGradient>
        </defs>

        {/* Outer Circular/Shield Badge with Emerald Green Background */}
        <circle cx="50" cy="50" r="47" fill="url(#uyGreenShield)" stroke="url(#uyGoldBorder)" strokeWidth="3" />
        
        {/* Subtle Decorative Golden Ring */}
        <circle cx="50" cy="50" r="41.5" stroke="url(#uyGoldPrimary)" strokeWidth="1" strokeDasharray="3 1.5" opacity="0.85" />

        {/* Top Garment Stitching Thread Arc */}
        <path
          d="M 28 32 C 38 23, 62 23, 72 32"
          stroke="url(#uyGoldPrimary)"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
        />

        {/* Monogram 'U' in Stylized Gold */}
        <path
          d="M 33 34 L 33 53 C 33 63, 47 63, 47 53 L 47 34"
          stroke="url(#uyGoldPrimary)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Monogram 'Y' in Intertwined Gold */}
        <path
          d="M 48 34 L 57 48 L 66 34 M 57 48 L 57 66"
          stroke="url(#uyGoldPrimary)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Crossed Scissors & Needle / Golden Thread Motif */}
        <path
          d="M 26 73 L 40 64 M 74 73 L 60 64"
          stroke="url(#uyGoldInner)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Bottom Banner Ribbon with Gold Rim */}
        <path
          d="M 20 73 C 35 69, 65 69, 80 73 C 78 81, 68 83, 50 83 C 32 83, 22 81, 20 73 Z"
          fill="#062F18"
          stroke="url(#uyGoldBorder)"
          strokeWidth="1.5"
        />

        {/* Text inside Ribbon */}
        <text
          x="50"
          y="79"
          textAnchor="middle"
          fill="url(#uyGoldPrimary)"
          fontSize="6.5"
          fontWeight="800"
          letterSpacing="1.2"
          fontFamily="system-ui, sans-serif"
        >
          GARMENTS
        </text>

        {/* Golden Central Star */}
        <polygon
          points="50,22 51.5,25.5 55,26 52.5,28.5 53,32 50,30.2 47,32 47.5,28.5 45,26 48.5,25.5"
          fill="url(#uyGoldPrimary)"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-black tracking-tight text-white ${dimensions.fontTitle}`}>
            UY GARMENTS
          </span>
          <span className={`text-neutral-400 font-medium tracking-widest uppercase ${dimensions.fontSub}`}>
            Apparel Manufacturing
          </span>
        </div>
      )}
    </div>
  );
};
