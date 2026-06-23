interface StampBenchSceneProps {
  smokeColor: string;
  animate: boolean;
}

function MouthSmokePuff({
  cx,
  cy,
  animate,
  smokeColor,
  begin = '0s',
  dur = '2.4s',
}: {
  cx: number;
  cy: number;
  animate: boolean;
  smokeColor: string;
  begin?: string;
  dur?: string;
}) {
  if (!animate) {
    return (
      <ellipse cx={cx} cy={cy - 2.2} rx={0.75} ry={0.55} fill={smokeColor} opacity={0.42} />
    );
  }

  return (
    <ellipse cx={cx} cy={cy} rx={0.55} ry={0.4} fill={smokeColor} opacity={0}>
      <animate attributeName="cy" values={`${cy};${cy - 3.5};${cy - 6.2}`} dur={dur} begin={begin} repeatCount="indefinite" />
      <animate attributeName="rx" values="0.45;0.95;1.25" dur={dur} begin={begin} repeatCount="indefinite" />
      <animate attributeName="ry" values="0.35;0.8;1.05" dur={dur} begin={begin} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.68;0" dur={dur} begin={begin} repeatCount="indefinite" />
      <animate attributeName="cx" values={`${cx};${cx - 0.25};${cx - 0.5}`} dur={dur} begin={begin} repeatCount="indefinite" />
    </ellipse>
  );
}

function AdultEye({ cx, cy, stroke }: { cx: number; cy: number; stroke: string }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="0.26" ry="0.19" fill="#fffdf8" stroke={stroke} strokeWidth="0.22" />
      <circle cx={cx} cy={cy} r="0.11" fill={stroke} />
      <circle cx={cx + 0.04} cy={cy - 0.03} r="0.035" fill="#fffdf8" opacity="0.85" />
    </>
  );
}

function AnimatedHeart({ animate }: { animate: boolean }) {
  return (
    <g transform="translate(4.6 5.35)">
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

function StampBenchScene({ smokeColor, animate }: StampBenchSceneProps) {
  const hairDark = '#1a1208';
  const beardTone = '#2a1f14';
  const skin = '#f0c9a0';
  const limbStroke = '#0a3d2e';

  return (
    <g transform="translate(0 14.5)">
      <g>
        {animate && (
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            values="-2.8 0 9; 2.8 0 9; -2.8 0 9"
            dur="5.5s"
            repeatCount="indefinite"
          />
        )}

        {/* Качалка */}
        <path
          d="M -7.2 11.2 C -9.2 11.6 -9.6 13.1 -7.6 13.6 C -5.8 13.2 -6.2 11.7 -7.2 11.2 Z"
          fill="none"
          stroke={limbStroke}
          strokeWidth="0.65"
          strokeLinecap="round"
        />
        <path
          d="M 7.2 11.2 C 9.2 11.6 9.6 13.1 7.6 13.6 C 5.8 13.2 6.2 11.7 7.2 11.2 Z"
          fill="none"
          stroke={limbStroke}
          strokeWidth="0.65"
          strokeLinecap="round"
        />
        <rect x="-7.8" y="7.4" width="15.6" height="1.7" rx="0.35" fill="#c0782a" stroke={limbStroke} strokeWidth="0.55" />
        <rect
          x="-7.8"
          y="3.8"
          width="15.6"
          height="3.4"
          rx="0.45"
          fill="rgba(126, 200, 168, 0.14)"
          stroke={limbStroke}
          strokeWidth="0.55"
        />

        {/* Ноги */}
        <path d="M -5.5 7.4 L -5.9 9.3 L -5.1 9.5" stroke={skin} strokeWidth="0.85" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M -3.7 7.4 L -3.3 9.3 L -4.1 9.5" stroke={skin} strokeWidth="0.85" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 3.6 7.4 L 3.2 9.3 L 4.0 9.5" stroke={skin} strokeWidth="0.85" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 5.6 7.4 L 6.0 9.3 L 5.2 9.5" stroke={skin} strokeWidth="0.85" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="-5.5" cy="9.55" rx="0.42" ry="0.28" fill="#2d4a3e" stroke={limbStroke} strokeWidth="0.3" />
        <ellipse cx="-3.7" cy="9.55" rx="0.42" ry="0.28" fill="#2d4a3e" stroke={limbStroke} strokeWidth="0.3" />
        <ellipse cx="3.6" cy="9.55" rx="0.42" ry="0.28" fill="#8b3040" stroke={limbStroke} strokeWidth="0.3" />
        <ellipse cx="5.6" cy="9.55" rx="0.42" ry="0.28" fill="#8b3040" stroke={limbStroke} strokeWidth="0.3" />

        {/* Мальчик: волосы */}
        <path
          d="M -6.4 1.4 Q -7.4 0.2 -6.0 -0.3 Q -4.8 0.1 -4.0 1.0 Q -4.6 1.8 -5.5 2.0 Q -6.2 1.9 -6.4 1.4 Z"
          fill={hairDark}
          stroke={limbStroke}
          strokeWidth="0.35"
        />
        <path d="M -5.9 0.9 Q -6.8 -0.1 -5.5 -0.5 L -5.1 0.2 Q -5.8 0.5 -5.9 0.9 Z" fill={hairDark} />
        <circle cx="-4.6" cy="2.75" r="1.45" fill={skin} stroke={limbStroke} strokeWidth="0.5" />
        <path d="M -5.9 4.4 H -3.3 V 7.4 H -5.9 Z" fill="#2d9a74" stroke={limbStroke} strokeWidth="0.45" />

        {/* Мальчик: руки */}
        <path
          d="M -4.0 4.7 Q -3.6 5.0 -3.5 5.1"
          stroke={skin}
          strokeWidth="0.62"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="-3.45" cy="5.05" r="0.32" fill={skin} stroke={limbStroke} strokeWidth="0.28" />
        <path
          d="M -5.4 4.6 L -6.6 2.4 L -6.9 1.35"
          stroke={skin}
          strokeWidth="0.62"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="-6.75" cy="2.15" r="0.34" fill={skin} stroke={limbStroke} strokeWidth="0.28" />
        <path
          d="M -6.9 1.35 L -6.55 0.75 L -6.2 1.35 L -6.9 1.35 Z"
          fill={skin}
          stroke={limbStroke}
          strokeWidth="0.25"
        />

        {/* Мальчик: лицо и борода */}
        <path d="M -5.35 2.02 Q -5.15 1.86 -4.95 2.02" stroke={hairDark} strokeWidth="0.36" fill="none" strokeLinecap="round" />
        <path d="M -4.25 2.02 Q -4.05 1.86 -3.85 2.02" stroke={hairDark} strokeWidth="0.36" fill="none" strokeLinecap="round" />
        <AdultEye cx={-5.15} cy={2.38} stroke={limbStroke} />
        <AdultEye cx={-4.05} cy={2.38} stroke={limbStroke} />
        <path
          d="M -6.2 3.1 Q -5.8 5.4 -4.6 5.35 Q -3.4 5.4 -3.0 3.1 Q -3.7 4.2 -4.6 4.35 Q -5.5 4.2 -6.2 3.1 Z"
          fill={beardTone}
          stroke={limbStroke}
          strokeWidth="0.4"
        />
        <ellipse cx="-5.3" cy="4.1" rx="0.55" ry="0.7" fill={beardTone} opacity="0.85" />
        <ellipse cx="-4.6" cy="4.45" rx="0.65" ry="0.75" fill={beardTone} />
        <ellipse cx="-3.9" cy="4.1" rx="0.5" ry="0.65" fill={beardTone} opacity="0.85" />

        {/* Девушка: кудрявые волосы — максимум */}
        <path
          d="M 1.9 4.0 Q 1.1 1.2 2.8 0.05 Q 4.4 -0.55 5.9 0.05 Q 7.6 0.7 7.5 3.0 Q 7.4 5.3 5.6 5.7 Q 3.8 6.1 1.9 4.0 Z"
          fill={hairDark}
          stroke={limbStroke}
          strokeWidth="0.4"
        />
        <path d="M 2.1 2.8 Q 1.4 0.95 2.9 0.35 Q 3.6 1.15 2.1 2.8 Z" fill={hairDark} />
        <path d="M 7.1 2.6 Q 7.9 0.75 6.2 0.2 Q 5.4 1.1 7.1 2.6 Z" fill={hairDark} />
        <path d="M 2.5 4.8 Q 1.5 3.1 2.9 2.45 Q 3.7 3.5 2.5 4.8 Z" fill={hairDark} />
        <path d="M 6.2 4.6 Q 7.3 2.9 5.9 2.35 Q 5.0 3.4 6.2 4.6 Z" fill={hairDark} />
        <path d="M 3.0 1.2 Q 2.4 0.35 3.2 0.05 Q 3.9 0.45 3.0 1.2 Z" fill={hairDark} />
        <path d="M 5.5 1.0 Q 6.2 0.2 5.4 -0.1 Q 4.8 0.35 5.5 1.0 Z" fill={hairDark} />
        <path d="M 2.2 3.3 Q 1.5 2.4 2.1 1.75 Q 2.7 2.35 2.2 3.3 Z" fill={hairDark} />
        <path d="M 6.6 3.1 Q 7.4 2.1 6.7 1.55 Q 6.0 2.15 6.6 3.1 Z" fill={hairDark} />
        <ellipse cx="2.5" cy="0.85" rx="0.4" ry="0.55" fill={hairDark} stroke={limbStroke} strokeWidth="0.2" />
        <ellipse cx="3.5" cy="0.45" rx="0.36" ry="0.5" fill={hairDark} stroke={limbStroke} strokeWidth="0.2" />
        <ellipse cx="4.6" cy="0.28" rx="0.34" ry="0.48" fill={hairDark} stroke={limbStroke} strokeWidth="0.2" />
        <ellipse cx="5.7" cy="0.42" rx="0.38" ry="0.52" fill={hairDark} stroke={limbStroke} strokeWidth="0.2" />
        <ellipse cx="6.7" cy="0.82" rx="0.42" ry="0.56" fill={hairDark} stroke={limbStroke} strokeWidth="0.2" />
        <ellipse cx="2.2" cy="1.55" rx="0.34" ry="0.48" fill={hairDark} />
        <ellipse cx="6.9" cy="1.45" rx="0.36" ry="0.5" fill={hairDark} />
        <ellipse cx="2.4" cy="2.55" rx="0.32" ry="0.44" fill={hairDark} />
        <ellipse cx="6.5" cy="2.45" rx="0.34" ry="0.46" fill={hairDark} />
        <ellipse cx="3.1" cy="3.15" rx="0.3" ry="0.42" fill={hairDark} />
        <ellipse cx="5.9" cy="3.05" rx="0.32" ry="0.44" fill={hairDark} />
        <ellipse cx="4.2" cy="0.62" rx="0.3" ry="0.4" fill={hairDark} />
        <ellipse cx="5.0" cy="0.88" rx="0.28" ry="0.38" fill={hairDark} />

        <circle cx="4.6" cy="2.85" r="1.35" fill={skin} stroke={limbStroke} strokeWidth="0.5" />
        <path d="M 3.3 4.4 H 5.9 V 7.4 H 3.3 Z" fill="#c94a5a" stroke={limbStroke} strokeWidth="0.45" />

        {/* Девочка: руки — жест сердечка на груди, лицо выше */}
        <path
          d="M 3.5 4.6 Q 3.9 4.95 4.2 5.15"
          stroke={skin}
          strokeWidth="0.58"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 5.7 4.6 Q 5.3 4.95 5.0 5.15"
          stroke={skin}
          strokeWidth="0.58"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 4.0 5.2 L 4.15 4.85 M 4.15 4.85 L 4.45 4.75"
          stroke={skin}
          strokeWidth="0.42"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 5.2 5.2 L 5.05 4.85 M 5.05 4.85 L 4.75 4.75"
          stroke={skin}
          strokeWidth="0.42"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="4.15" cy="5.22" r="0.26" fill={skin} stroke={limbStroke} strokeWidth="0.24" />
        <circle cx="5.05" cy="5.22" r="0.26" fill={skin} stroke={limbStroke} strokeWidth="0.24" />

        <AnimatedHeart animate={animate} />

        {/* Девушка: лицо поверх */}
        <path d="M 3.95 2.18 Q 4.6 2.02 5.25 2.18" stroke={hairDark} strokeWidth="0.38" fill="none" strokeLinecap="round" />
        <AdultEye cx={4.1} cy={2.48} stroke={limbStroke} />
        <AdultEye cx={5.1} cy={2.48} stroke={limbStroke} />
        <path d="M 4.45 3.2 Q 4.65 3.38 4.85 3.2" stroke="#8b3040" strokeWidth="0.38" fill="none" strokeLinecap="round" />

        {/* Кальян */}
        <ellipse cx="0" cy="9.6" rx="1.75" ry="1.15" fill="rgba(126, 200, 168, 0.18)" stroke={limbStroke} strokeWidth="0.5" />
        <rect x="-0.32" y="6.4" width="0.64" height="3.1" rx="0.15" fill="#17624a" stroke={limbStroke} strokeWidth="0.35" />
        <ellipse cx="0" cy="6.1" rx="1.05" ry="0.75" fill="#0a3d2e" opacity="0.55" stroke={limbStroke} strokeWidth="0.4" />
        <path
          d="M -0.4 6.6 C -1.6 6.3 -2.6 5.7 -3.4 5.0"
          stroke="#c0782a"
          strokeWidth="0.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="-3.45" cy="4.95" r="0.38" fill="#c0782a" stroke={limbStroke} strokeWidth="0.3" />

        {/* Дым */}
        <g fill={smokeColor} stroke="none">
          <MouthSmokePuff cx={-4.6} cy={3.15} animate={animate} smokeColor={smokeColor} begin="0s" />
          <MouthSmokePuff cx={-4.6} cy={3.15} animate={animate} smokeColor={smokeColor} begin="0.85s" dur="2.1s" />
          {animate ? (
            <>
              <ellipse cx="0" cy="5.5" rx="0.55" ry="0.4" opacity="0">
                <animate attributeName="cy" values="5.5;2.8;0.5" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="rx" values="0.45;1;1.35" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="ry" values="0.35;0.85;1.1" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.6;0" dur="2.6s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="0" cy="5.5" rx="0.5" ry="0.38" opacity="0">
                <animate attributeName="cy" values="5.5;2.5;0.2" dur="3s" begin="0.9s" repeatCount="indefinite" />
                <animate attributeName="rx" values="0.4;0.95;1.2" dur="3s" begin="0.9s" repeatCount="indefinite" />
                <animate attributeName="ry" values="0.32;0.8;1" dur="3s" begin="0.9s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.52;0" dur="3s" begin="0.9s" repeatCount="indefinite" />
              </ellipse>
            </>
          ) : (
            <ellipse cx="0" cy="2.5" rx="0.9" ry="0.65" opacity={0.38} />
          )}
        </g>
      </g>
    </g>
  );
}

export {
  StampBenchScene,
};
