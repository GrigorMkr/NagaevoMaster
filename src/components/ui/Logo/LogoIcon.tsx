import { useId } from 'react';
import { LOGO_ICON_SIZE_DEFAULT } from '@/constants';

interface LogoIconProps {
  size?: number;
  className?: string;
  ariaHidden?: boolean;
}

function LogoIcon({ size = LOGO_ICON_SIZE_DEFAULT, className, ariaHidden = true }: LogoIconProps) {
  const rawId = useId().replace(/:/g, '');
  const topArc = `${rawId}-top`;
  const bottomArc = `${rawId}-bottom`;
  const paper = `${rawId}-paper`;
  const ink = `${rawId}-ink`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <defs>
        <path id={topArc} d="M 20 50 A 30 30 0 0 1 80 50" fill="none" />
        <path id={bottomArc} d="M 80 50 A 30 30 0 0 1 20 50" fill="none" />
        <radialGradient id={paper} cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#fffaf2" />
          <stop offset="55%" stopColor="#f5efe3" />
          <stop offset="100%" stopColor="#e8dfd0" />
        </radialGradient>
        <filter id={ink} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.55" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="48" fill={`url(#${paper})`} />
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="#17624a"
        strokeWidth="3"
        strokeDasharray="1.5 2.2"
        opacity="0.85"
        filter={`url(#${ink})`}
      />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#0a3d2e" strokeWidth="1.4" opacity="0.9" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="#17624a" strokeWidth="0.8" opacity="0.45" />

      <circle cx="50" cy="9.5" r="1.4" fill="#c0782a" opacity="0.85" />
      <circle cx="90.5" cy="50" r="1.4" fill="#c0782a" opacity="0.85" />
      <circle cx="50" cy="90.5" r="1.4" fill="#c0782a" opacity="0.85" />
      <circle cx="9.5" cy="50" r="1.4" fill="#c0782a" opacity="0.85" />
      <circle cx="78" cy="22" r="1" fill="#f0b429" opacity="0.7" />
      <circle cx="22" cy="78" r="1" fill="#f0b429" opacity="0.7" />
      <circle cx="78" cy="78" r="1" fill="#f0b429" opacity="0.7" />
      <circle cx="22" cy="22" r="1" fill="#f0b429" opacity="0.7" />

      <text
        fontFamily="var(--font-ui), Manrope, system-ui, sans-serif"
        fontSize="7.2"
        fontWeight="700"
        fill="#0a3d2e"
        letterSpacing="0.2em"
      >
        <textPath href={`#${topArc}`} startOffset="50%" textAnchor="middle">
          НАГАЕВО
        </textPath>
      </text>
      <text
        fontFamily="var(--font-ui), Manrope, system-ui, sans-serif"
        fontSize="6.8"
        fontWeight="700"
        fill="#17624a"
        letterSpacing="0.26em"
      >
        <textPath href={`#${bottomArc}`} startOffset="50%" textAnchor="middle">
          МАСТЕР
        </textPath>
      </text>

      <g transform="translate(50 49)" filter={`url(#${ink})`}>
        <path
          d="M -12 5 L 0 -11 L 12 5 Z"
          fill="#f0b429"
          stroke="#0a3d2e"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <rect
          x="-10"
          y="5"
          width="20"
          height="13"
          rx="1.2"
          fill="#fffdf8"
          stroke="#0a3d2e"
          strokeWidth="1"
        />
        <rect x="-3" y="11" width="6" height="7" rx="0.8" fill="#17624a" opacity="0.45" />
        <rect x="-7.5" y="8" width="3.5" height="3.5" rx="0.6" fill="#17624a" opacity="0.18" />
        <rect x="4" y="8" width="3.5" height="3.5" rx="0.6" fill="#17624a" opacity="0.18" />
        <path d="M -1 5 V 2.5" stroke="#c0782a" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export {
  LogoIcon,
}
