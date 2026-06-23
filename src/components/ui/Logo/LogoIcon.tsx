import { useId } from 'react';
import { LOGO_ICON_SIZE_DEFAULT } from '@/constants';
import { usePrefersReducedMotion } from '@/hooks/useScrollRotation';
import { StampBenchScene } from './StampBenchScene';
import { StampPlayingKids } from './StampPlayingKids';

interface LogoIconProps {
  size?: number;
  className?: string;
  fluid?: boolean;
  ariaHidden?: boolean;
  animatedText?: boolean;
  variant?: 'default' | 'stamp';
  chimneySmokeColor?: string;
  animateChimneySmoke?: boolean;
}

function LogoIcon({
  size = LOGO_ICON_SIZE_DEFAULT,
  className,
  fluid = false,
  ariaHidden = true,
  animatedText = true,
  variant = 'default',
  chimneySmokeColor = '#4dd0a0',
  animateChimneySmoke = true,
}: LogoIconProps) {
  const reducedMotion = usePrefersReducedMotion();
  const motionEnabled = animatedText && !reducedMotion;
  const isStamp = variant === 'stamp';
  const chimneySmokeOn = isStamp && animateChimneySmoke && !reducedMotion;
  const rawId = useId().replace(/:/g, '');
  const topArc = `${rawId}-top`;
  const bottomArc = `${rawId}-bottom`;
  const paper = `${rawId}-paper`;
  const ink = `${rawId}-ink`;
  const textGradient = `${rawId}-text-gradient`;
  const textGlow = `${rawId}-text-glow`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={fluid ? '100%' : size}
      height={fluid ? '100%' : size}
      preserveAspectRatio="xMidYMid meet"
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
        <linearGradient id={textGradient} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0a3d2e" />
          <stop offset="10%" stopColor="#17624a" />
          <stop offset="22%" stopColor="#2d9a74" />
          <stop offset="34%" stopColor="#7ec8a8" />
          <stop offset="44%" stopColor="#fffdf5" />
          <stop offset="52%" stopColor="#fde68a" />
          <stop offset="60%" stopColor="#f0b429" />
          <stop offset="70%" stopColor="#fff3c4" />
          <stop offset="78%" stopColor="#e8a87c" />
          <stop offset="86%" stopColor="#c0782a" />
          <stop offset="94%" stopColor="#2d9a74" />
          <stop offset="100%" stopColor="#0a3d2e" />
          {motionEnabled && (
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              from="0 0.5 0.5"
              to="360 0.5 0.5"
              dur="4.5s"
              repeatCount="indefinite"
            />
          )}
        </linearGradient>
        <filter id={textGlow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 0.85 0 0 0  0 0 0.35 0 0  0 0 0 0.55 0"
            result="goldBlur"
          />
          <feMerge>
            <feMergeNode in="goldBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={ink} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.55" />
        </filter>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="48"
        fill={isStamp ? 'rgba(8, 28, 22, 0.03)' : `url(#${paper})`}
        stroke={isStamp ? 'rgba(126, 200, 168, 0.32)' : undefined}
        strokeWidth={isStamp ? 0.8 : undefined}
      />
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="#17624a"
        strokeWidth="3"
        strokeDasharray="1.5 2.2"
        opacity={isStamp ? 0.72 : 0.85}
        filter={isStamp ? undefined : `url(#${ink})`}
      />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#0a3d2e" strokeWidth="1.4" opacity={isStamp ? 0.78 : 0.9} />
      <circle cx="50" cy="50" r="39" fill="none" stroke="#17624a" strokeWidth="0.8" opacity={isStamp ? 0.38 : 0.45} />

      <circle cx="50" cy="9.5" r="1.4" fill="#c0782a" opacity="0.85" />
      <circle cx="90.5" cy="50" r="1.4" fill="#c0782a" opacity="0.85" />
      <circle cx="50" cy="90.5" r="1.4" fill="#c0782a" opacity="0.85" />
      <circle cx="9.5" cy="50" r="1.4" fill="#c0782a" opacity="0.85" />
      <circle cx="78" cy="22" r="1" fill="#f0b429" opacity="0.7" />
      <circle cx="22" cy="78" r="1" fill="#f0b429" opacity="0.7" />
      <circle cx="78" cy="78" r="1" fill="#f0b429" opacity="0.7" />
      <circle cx="22" cy="22" r="1" fill="#f0b429" opacity="0.7" />

      <g filter={motionEnabled ? `url(#${textGlow})` : undefined}>
        {motionEnabled && (
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="24s"
            repeatCount="indefinite"
          />
        )}
        <text
          fontFamily="var(--font-ui), Manrope, system-ui, sans-serif"
          fontSize="7.2"
          fontWeight="700"
          fill={motionEnabled ? `url(#${textGradient})` : '#0a3d2e'}
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
          fill={motionEnabled ? `url(#${textGradient})` : '#17624a'}
          letterSpacing="0.26em"
        >
          <textPath href={`#${bottomArc}`} startOffset="50%" textAnchor="middle">
            МАСТЕР
          </textPath>
        </text>
      </g>

      <g transform="translate(50 49)" filter={isStamp ? undefined : `url(#${ink})`}>
        <g transform="translate(0 -7)">
        {isStamp && <StampPlayingKids animate={chimneySmokeOn} />}
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
          fill={isStamp ? 'rgba(126, 200, 168, 0.06)' : '#fffdf8'}
          stroke="#0a3d2e"
          strokeWidth="1"
        />
        <rect x="-3" y="11" width="6" height="7" rx="0.8" fill="#17624a" opacity={isStamp ? 0.55 : 0.45} />
        <rect x="-7.5" y="8" width="3.5" height="3.5" rx="0.6" fill="#17624a" opacity={isStamp ? 0.28 : 0.18} />
        <rect x="4" y="8" width="3.5" height="3.5" rx="0.6" fill="#17624a" opacity={isStamp ? 0.28 : 0.18} />
        {isStamp && (
          <>
            <rect
              x="5.4"
              y="-9.2"
              width="2.6"
              height="6.8"
              rx="0.35"
              fill="rgba(126, 200, 168, 0.12)"
              stroke="#0a3d2e"
              strokeWidth="0.85"
            />
            <rect
              x="4.9"
              y="-10.4"
              width="3.6"
              height="1.15"
              rx="0.25"
              fill="#17624a"
              stroke="#0a3d2e"
              strokeWidth="0.7"
            />
            <g fill={chimneySmokeColor} stroke="none">
              {chimneySmokeOn ? (
                <>
                  <ellipse cx="6.7" cy="-10.8" rx="0.9" ry="0.65" opacity="0">
                    <animate attributeName="cy" values="-10.8;-15.5;-18.5" dur="2.8s" repeatCount="indefinite" />
                    <animate attributeName="rx" values="0.7;1.3;1.8" dur="2.8s" repeatCount="indefinite" />
                    <animate attributeName="ry" values="0.5;1.1;1.5" dur="2.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.72;0" dur="2.8s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="6.2" cy="-10.8" rx="0.75" ry="0.55" opacity="0">
                    <animate attributeName="cy" values="-10.8;-14.2;-17" dur="2.2s" begin="0.55s" repeatCount="indefinite" />
                    <animate attributeName="rx" values="0.6;1.15;1.55" dur="2.2s" begin="0.55s" repeatCount="indefinite" />
                    <animate attributeName="ry" values="0.45;0.95;1.25" dur="2.2s" begin="0.55s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.62;0" dur="2.2s" begin="0.55s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="7.1" cy="-10.8" rx="0.65" ry="0.5" opacity="0">
                    <animate attributeName="cy" values="-10.8;-13.5;-16.2" dur="1.9s" begin="1.1s" repeatCount="indefinite" />
                    <animate attributeName="rx" values="0.55;1;1.35" dur="1.9s" begin="1.1s" repeatCount="indefinite" />
                    <animate attributeName="ry" values="0.4;0.85;1.1" dur="1.9s" begin="1.1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.55;0" dur="1.9s" begin="1.1s" repeatCount="indefinite" />
                  </ellipse>
                </>
              ) : (
                <ellipse cx="6.7" cy="-13.5" rx="1.1" ry="0.85" opacity="0.45" />
              )}
            </g>
          </>
        )}
        {!isStamp && (
          <path d="M -1 5 V 2.5" stroke="#c0782a" strokeWidth="1.2" strokeLinecap="round" />
        )}
        </g>
        {isStamp && (
          <StampBenchScene smokeColor={chimneySmokeColor} animate={chimneySmokeOn} />
        )}
      </g>
    </svg>
  );
}

export {
  LogoIcon,
}
