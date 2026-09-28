'use client';
import { useId } from 'react';
import { motion } from 'framer-motion';

type LogoProps = {
  /** Rendered width/height in px. Defaults to 40. */
  size?: number;
  /**
   * 'tile' – navy rounded-square app icon. Use on light backgrounds (top bar, login, etc.)
   * 'mark' – bare rings + letters with no background. Use on the navy sidebar / other dark surfaces.
   */
  variant?: 'tile' | 'mark';
  /** Draw the rings and letters in and flicker the flame. Best for one prominent spot (e.g. top bar). */
  animated?: boolean;
  className?: string;
};

// Geometry: two interlocking rings (r 11.2, centres 12 apart) around x=24,y=24.
// White ring holds the "D", gold ring holds the "M"; where they overlap is the
// shared day — lit by a birthday-candle flame.
const R = 11.2;
const CX1 = 18;
const CX2 = 30;
const CY = 24;
const SW = 3 - 0.4; // ring stroke
const LW = 1.8; // letter stroke
const T = { x: 24, y: 14.54 }; // top intersection    – white ring passes over gold
const U = { x: 24, y: 33.46 }; // bottom intersection – gold ring passes over white
const GAP = SW / 2 + 1.4;

const LETTER_D = 'M10.7 20.3H11.8A3.7 3.7 0 0 1 11.8 27.7H10.7Z';
const LETTER_M = 'M32 27.7V20.3L34.8 24.6L37.6 20.3V27.7';
const FLAME =
  'M24 15.2C25 19 28.6 20.8 28.6 25A4.6 4.6 0 0 1 19.4 25C19.4 22.6 20.8 21.2 21.9 19.6C22.2 21 22.8 21.9 23.5 22.3C23.2 20 23.3 17.6 24 15.2Z';

export function Logo({ size = 40, variant = 'tile', animated = false, className = '' }: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const gold = `gold${uid}`;
  const clipA = `clip${uid}`;
  const maskA = `ma${uid}`;
  const maskB = `mb${uid}`;
  const bg = `bg${uid}`;

  const draw = (delay: number, duration = 0.9) =>
    ({
      initial: animated ? { pathLength: 0, opacity: 0 } : false,
      animate: { pathLength: 1, opacity: 1 },
      transition: { duration, delay, ease: [0.22, 1, 0.36, 1] },
    }) as const;

  return (
    <svg
      role="img"
      aria-label="DayMate"
      width={size}
      height={size}
      viewBox={variant === 'tile' ? '0 0 48 48' : '5.2 11.2 37.6 25.6'}
      fill="none"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gold} x1="24" y1="12" x2="24" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE3A3" />
          <stop offset="1" stopColor="#E9A23B" />
        </linearGradient>
        <linearGradient id={bg} x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2A3FA0" />
          <stop offset="1" stopColor="#111A52" />
        </linearGradient>
        <clipPath id={clipA}>
          <circle cx={CX1} cy={CY} r={R} />
        </clipPath>
        <mask id={maskA} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="#fff" />
          <circle cx={U.x} cy={U.y} r={GAP} fill="#000" />
        </mask>
        <mask id={maskB} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="#fff" />
          <circle cx={T.x} cy={T.y} r={GAP} fill="#000" />
        </mask>
      </defs>

      {variant === 'tile' && (
        <>
          <rect width="48" height="48" rx="12" fill={`url(#${bg})`} />
          <rect x=".2" y=".2" width="47.6" height="47.6" rx="11.8" stroke="#E9A23B" strokeOpacity=".35" strokeWidth=".4" />
        </>
      )}

      {/* shared lens glow */}
      <circle cx={CX2} cy={CY} r={R} fill="#fff" fillOpacity=".1" clipPath={`url(#${clipA})`} />

      {/* candle flame (scaled to sit inside the lens) */}
      <g transform="translate(24 28.6) scale(.62) translate(-24 -29.6)">
        <motion.path
          d={FLAME}
          fill={`url(#${gold})`}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
          initial={animated ? { opacity: 0, scale: 0.6 } : false}
          animate={animated ? { opacity: 1, scale: [1, 1.05, 0.97, 1.03, 1] } : { opacity: 1, scale: 1 }}
          transition={
            animated
              ? {
                  opacity: { duration: 0.4, delay: 1.4 },
                  scale: { duration: 2.8, delay: 1.4, repeat: Infinity, ease: 'easeInOut' },
                }
              : undefined
          }
        />
      </g>

      {/* rings */}
      <motion.circle
        cx={CX1} cy={CY} r={R}
        stroke="#F7F6F2" strokeWidth={SW} strokeLinecap="round"
        mask={`url(#${maskA})`}
        {...draw(0)}
      />
      <motion.circle
        cx={CX2} cy={CY} r={R}
        stroke={`url(#${gold})`} strokeWidth={SW} strokeLinecap="round"
        mask={`url(#${maskB})`}
        {...draw(0.25)}
      />

      {/* letters: D in the white ring, M in the gold ring */}
      <motion.path
        d={LETTER_D}
        stroke="#F7F6F2" strokeWidth={LW} strokeLinejoin="round" strokeLinecap="round"
        {...draw(0.8, 0.6)}
      />
      <motion.path
        d={LETTER_M}
        stroke={`url(#${gold})`} strokeWidth={LW} strokeLinejoin="round" strokeLinecap="round"
        {...draw(1, 0.6)}
      />
    </svg>
  );
}