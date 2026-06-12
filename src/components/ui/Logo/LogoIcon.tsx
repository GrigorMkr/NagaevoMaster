import { LOGO_ICON_SIZE_DEFAULT } from '@/constants';
interface LogoIconProps {
    size?: number;
    className?: string;
    ariaHidden?: boolean;
}
function LogoIcon({ size = LOGO_ICON_SIZE_DEFAULT, className, ariaHidden = true }: LogoIconProps) {
    return (<svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden={ariaHidden}>
      <defs>
        <linearGradient id="logo-bg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2d9a74"/>
          <stop offset="1" stopColor="#0a3d2e"/>
        </linearGradient>
        <linearGradient id="logo-gold" x1="8" y1="14" x2="40" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a"/>
          <stop offset="0.5" stopColor="#f0b429"/>
          <stop offset="1" stopColor="#c0782a"/>
        </linearGradient>
        <linearGradient id="logo-hill" x1="0" y1="30" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a6b52" stopOpacity="0.55"/>
          <stop offset="1" stopColor="#0f4d3a" stopOpacity="0.85"/>
        </linearGradient>
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width="48" height="48" rx="13" fill="url(#logo-bg)"/>
      <rect width="48" height="48" rx="13" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75"/>

      <path d="M0 36 C10 28 18 34 24 31 C30 28 38 26 48 32 V48 H0 Z" fill="url(#logo-hill)"/>
      <path d="M0 40 C14 33 20 37 28 34 C36 31 42 30 48 34 V48 H0 Z" fill="#17624a" opacity="0.35"/>

      <rect x="15" y="23" width="18" height="13" rx="2.5" fill="white" opacity="0.95"/>
      <path d="M11 23 L24 11.5 L37 23 Z" fill="url(#logo-gold)" filter="url(#logo-glow)"/>
      <rect x="21.5" y="28.5" width="7" height="7.5" rx="1.5" fill="#0a3d2e" opacity="0.22"/>
      <rect x="17" y="26" width="4" height="4" rx="1" fill="#0a3d2e" opacity="0.12"/>
      <rect x="29" y="26" width="4" height="4" rx="1" fill="#0a3d2e" opacity="0.12"/>
      <circle cx="38" cy="14" r="3.5" fill="#f0b429"/>
      <circle cx="38" cy="14" r="5.5" fill="#f0b429" opacity="0.25"/>
      <path d="M34.5 14 H31.5" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    </svg>);
}

export {
  LogoIcon,
}
