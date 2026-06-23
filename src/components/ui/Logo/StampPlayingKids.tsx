interface StampPlayingKidsProps {
  animate: boolean;
}

function KidLegs({
  skin,
  stroke,
  shoeFill,
  leftX,
  rightX,
  topY,
  height,
}: {
  skin: string;
  stroke: string;
  shoeFill: string;
  leftX: number;
  rightX: number;
  topY: number;
  height: number;
}) {
  const footY = topY + height;
  return (
    <>
      <path
        d={`M ${leftX} ${topY} L ${leftX - 0.15} ${footY - 0.35} L ${leftX + 0.2} ${footY}`}
        stroke={skin}
        strokeWidth="0.58"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${rightX} ${topY} L ${rightX + 0.15} ${footY - 0.35} L ${rightX - 0.2} ${footY}`}
        stroke={skin}
        strokeWidth="0.58"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx={leftX} cy={footY + 0.08} rx="0.38" ry="0.22" fill={shoeFill} stroke={stroke} strokeWidth="0.28" />
      <ellipse cx={rightX} cy={footY + 0.08} rx="0.38" ry="0.22" fill={shoeFill} stroke={stroke} strokeWidth="0.28" />
    </>
  );
}

function AnimatedHeart({ animate }: { animate: boolean }) {
  return (
    <g transform="translate(0 1.72) scale(0.52)">
      <path
        d="M 0 0.55 C 0 0.05 -0.65 -0.35 -0.95 -0.1 C -1.25 -0.35 -1.85 0.05 -1.85 0.55 C -1.85 1.2 0 2.55 0 2.55 C 0 2.55 1.85 1.2 1.85 0.55 C 1.85 0.05 1.25 -0.35 0.95 -0.1 C 0.65 -0.35 0 0.05 0 0.55 Z"
        fill="#e63946"
        stroke="#b91c3c"
        strokeWidth="0.18"
      >
        {animate && (
          <>
            <animate attributeName="opacity" values="0.82;1;0.82" dur="1.1s" repeatCount="indefinite" />
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1;1.14;1"
              dur="1.1s"
              repeatCount="indefinite"
              additive="sum"
            />
          </>
        )}
      </path>
      {animate && (
        <ellipse cx="0" cy="0.9" rx="1.1" ry="0.85" fill="#ff4d6d" opacity="0">
          <animate attributeName="opacity" values="0;0.35;0" dur="1.1s" repeatCount="indefinite" />
          <animate attributeName="rx" values="0.8;1.35;0.8" dur="1.1s" repeatCount="indefinite" />
          <animate attributeName="ry" values="0.6;1.05;0.6" dur="1.1s" repeatCount="indefinite" />
        </ellipse>
      )}
    </g>
  );
}

function StampPlayingKids({ animate }: StampPlayingKidsProps) {
  const skin = '#f0c9a0';
  const hair = '#1a1208';
  const stroke = '#0a3d2e';

  return (
    <g aria-hidden="true" transform="translate(-9 -1.2)">
      <ellipse cx="0" cy="-9.2" rx="8.2" ry="1.1" fill="rgba(45, 154, 116, 0.2)" stroke="#2d9a74" strokeWidth="0.35" opacity="0.7" />

      {/* Мальчик 7 лет — слева */}
      <g transform="translate(-3.4 -14.8)">
        <KidLegs skin={skin} stroke={stroke} shoeFill="#2d4a6e" leftX={-0.42} rightX={0.42} topY={4.55} height={2.35} />
        <path d="M -0.5 1.95 H 0.5 V 4.65 H -0.5 Z" fill="#f0b429" stroke={stroke} strokeWidth="0.38" />
        <path d="M -0.55 4.65 H 0.55 V 4.95 H -0.55 Z" fill="#3d5a80" stroke={stroke} strokeWidth="0.3" />
        <path d="M -0.68 2.2 L -1.22 0.65" stroke={skin} strokeWidth="0.52" fill="none" strokeLinecap="round" />
        <path d="M 0.68 2.2 L 1.22 0.65" stroke={skin} strokeWidth="0.52" fill="none" strokeLinecap="round" />
        <circle cx="-1.27" cy="0.58" r="0.26" fill={skin} stroke={stroke} strokeWidth="0.24" />
        <circle cx="1.27" cy="0.58" r="0.26" fill={skin} stroke={stroke} strokeWidth="0.24" />
        <ellipse cx="0" cy="0.62" rx="0.82" ry="0.48" fill={hair} />
        <path d="M -0.82 0.95 Q -0.92 0.35 -0.5 0.22 Q -0.15 0.35 -0.05 0.75" fill={hair} stroke={stroke} strokeWidth="0.24" />
        <path d="M 0.82 0.95 Q 0.92 0.35 0.5 0.22 Q 0.15 0.35 0.05 0.75" fill={hair} stroke={stroke} strokeWidth="0.24" />
        <path d="M -0.55 0.78 Q 0 0.42 0.55 0.78" fill={hair} stroke={stroke} strokeWidth="0.22" />
        <circle cx="0" cy="1.45" r="0.95" fill={skin} stroke={stroke} strokeWidth="0.4" />
        <circle cx="-0.32" cy="1.32" r="0.14" fill={stroke} opacity="0.82" />
        <circle cx="0.32" cy="1.32" r="0.14" fill={stroke} opacity="0.82" />
        <path d="M -0.12 1.68 Q 0 1.8 0.12 1.68" stroke={stroke} strokeWidth="0.26" fill="none" />
        {animate ? (
          <circle cx="0" cy="0.2" r="0.58" fill="#f0b429" stroke={stroke} strokeWidth="0.34">
            <animate attributeName="cy" values="0.2;-0.05;0.2" dur="1.6s" repeatCount="indefinite" />
          </circle>
        ) : (
          <circle cx="0" cy="0.15" r="0.58" fill="#f0b429" stroke={stroke} strokeWidth="0.34" />
        )}
      </g>

      {/* Девочка 5 лет — в центре */}
      <g transform="translate(0 -14)">
        <KidLegs skin={skin} stroke={stroke} shoeFill="#c94a5a" leftX={-0.35} rightX={0.35} topY={3.75} height={1.85} />
        <path d="M -0.42 1.55 H 0.42 V 3.85 H -0.42 Z" fill="#f5a8c8" stroke={stroke} strokeWidth="0.35" />
        <ellipse cx="-1.05" cy="0.95" rx="0.32" ry="0.48" fill={hair} stroke={stroke} strokeWidth="0.26" />
        <ellipse cx="1.05" cy="0.95" rx="0.32" ry="0.48" fill={hair} stroke={stroke} strokeWidth="0.26" />
        <path d="M -0.55 0.75 Q -0.15 0.35 0.15 0.55 Q 0.45 0.35 0.55 0.75" fill={hair} stroke={stroke} strokeWidth="0.28" />
        <circle cx="0" cy="1.05" r="0.78" fill={skin} stroke={stroke} strokeWidth="0.36" />
        <path d="M -0.55 1.62 Q -0.35 1.95 -0.15 2.05" stroke={skin} strokeWidth="0.44" fill="none" strokeLinecap="round" />
        <path d="M 0.55 1.62 Q 0.35 1.95 0.15 2.05" stroke={skin} strokeWidth="0.44" fill="none" strokeLinecap="round" />
        <path d="M -0.12 1.95 L -0.02 1.72 L 0.08 1.95" stroke={skin} strokeWidth="0.36" fill="none" strokeLinecap="round" />
        <path d="M 0.12 1.95 L 0.02 1.72 L -0.08 1.95" stroke={skin} strokeWidth="0.36" fill="none" strokeLinecap="round" />
        <circle cx="-0.15" cy="2.08" r="0.2" fill={skin} stroke={stroke} strokeWidth="0.2" />
        <circle cx="0.15" cy="2.08" r="0.2" fill={skin} stroke={stroke} strokeWidth="0.2" />
        <AnimatedHeart animate={animate} />
        <circle cx="-0.26" cy="0.95" r="0.12" fill={stroke} opacity="0.85" />
        <circle cx="0.26" cy="0.95" r="0.12" fill={stroke} opacity="0.85" />
        <path d="M -0.1 1.22 Q 0 1.34 0.1 1.22" stroke="#c94a5a" strokeWidth="0.24" fill="none" />
      </g>

      {/* Мальчик 12 лет — справа, самый высокий */}
      <g transform="translate(3.5 -15.7)">
        <KidLegs skin={skin} stroke={stroke} shoeFill="#17624a" leftX={-0.48} rightX={0.48} topY={5.35} height={2.75} />
        <path d="M -0.58 2.35 H 0.58 V 5.45 H -0.58 Z" fill="#2d9a74" stroke={stroke} strokeWidth="0.4" />
        <path d="M -0.62 5.45 H 0.62 V 5.8 H -0.62 Z" fill="#3d5a80" stroke={stroke} strokeWidth="0.3" />
        <path d="M -0.85 2.75 L -1.55 1.85" stroke={skin} strokeWidth="0.55" fill="none" strokeLinecap="round" />
        <path d="M 0.85 2.7 L 1.65 1.55 L 1.85 0.75" stroke={skin} strokeWidth="0.55" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-1.6" cy="1.8" r="0.3" fill={skin} stroke={stroke} strokeWidth="0.24" />
        <circle cx="1.9" cy="0.7" r="0.3" fill={skin} stroke={stroke} strokeWidth="0.24" />
        <ellipse cx="0" cy="0.72" rx="1.02" ry="0.58" fill={hair} />
        <path d="M -1.02 1.2 Q -1.12 0.45 -0.65 0.18 Q -0.2 0.42 -0.05 0.88" fill={hair} stroke={stroke} strokeWidth="0.24" />
        <path d="M 1.02 1.2 Q 1.12 0.45 0.65 0.18 Q 0.2 0.42 0.05 0.88" fill={hair} stroke={stroke} strokeWidth="0.24" />
        <path d="M -0.7 1.05 Q 0 0.55 0.7 1.05 L 0.55 1.35 Q 0 1.05 -0.55 1.35 Z" fill={hair} stroke={stroke} strokeWidth="0.22" />
        <circle cx="0" cy="1.75" r="1.1" fill={skin} stroke={stroke} strokeWidth="0.42" />
        <circle cx="-0.38" cy="1.58" r="0.16" fill={stroke} opacity="0.8" />
        <circle cx="0.38" cy="1.58" r="0.16" fill={stroke} opacity="0.8" />
        <path d="M -0.18 2.02 Q 0 2.18 0.18 2.02" stroke={stroke} strokeWidth="0.3" fill="none" />
      </g>
    </g>
  );
}

export {
  StampPlayingKids,
};
