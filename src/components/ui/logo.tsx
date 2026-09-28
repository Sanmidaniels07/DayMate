'use client';
import { useId } from 'react';
import { motion } from 'framer-motion';

type LogoProps = {
  /** Rendered width/height in px. Defaults to 40. */
  size?: number;
  /**
   * 'tile' – navy rounded-square app icon. Use on light backgrounds (top bar, login, etc.)
   * 'mark' – bare DM + shield with no background. Use on the navy sidebar / other dark surfaces.
   */
  variant?: 'tile' | 'mark';
  /** Fade in the DM, pop the shield and draw the handshake. Best for one prominent spot (e.g. top bar). */
  animated?: boolean;
  className?: string;
};

const NAVY = '#14205F';

// "DM" in a bold serif (Fraunces, OFL) converted to outlines, so no font has to load.
const DM =
  'M9.19 17.08Q9.19 16.66 9.61 16.5L9.98 16.38Q10.2 16.31 10.31 16.18Q10.42 16.05 10.42 15.84V7.36Q10.42 7.15 10.31 7.02Q10.2 6.89 9.98 6.82L9.61 6.7Q9.19 6.54 9.19 6.12Q9.19 5.87 9.36 5.74Q9.52 5.6 9.86 5.6H14.99Q16.56 5.6 17.86 6.07Q19.15 6.54 20.09 7.4Q21.02 8.26 21.52 9.44Q22.02 10.61 22.02 12.04Q22.02 13.65 21.26 14.9Q20.5 16.16 19.11 16.88Q17.71 17.6 15.8 17.6H9.86Q9.52 17.6 9.36 17.46Q9.19 17.32 9.19 17.08ZM15.37 16.49Q16.2 16.49 16.86 16.02Q17.52 15.55 17.89 14.56Q18.27 13.56 18.27 11.99Q18.27 10.74 18.02 9.77Q17.77 8.79 17.29 8.11Q16.8 7.43 16.12 7.07Q15.44 6.71 14.58 6.71H14.06V15.59Q14.06 16.06 14.31 16.27Q14.55 16.49 15.01 16.49ZM31.02 12.31 33.15 6.65Q33.37 6.05 33.66 5.83Q33.96 5.6 34.48 5.6H37.61Q37.95 5.6 38.11 5.74Q38.28 5.87 38.28 6.12Q38.28 6.34 38.17 6.48Q38.06 6.63 37.86 6.7L37.5 6.82Q37.24 6.91 37.14 7.06Q37.05 7.2 37.07 7.51L37.64 15.75Q37.66 16.06 37.75 16.18Q37.84 16.31 38.07 16.38L38.42 16.5Q38.61 16.56 38.71 16.7Q38.81 16.85 38.81 17.04Q38.81 17.28 38.64 17.44Q38.47 17.6 38.13 17.6H33.5Q33.15 17.6 32.99 17.46Q32.82 17.32 32.82 17.08Q32.82 16.87 32.91 16.73Q33 16.58 33.24 16.5L33.6 16.38Q33.87 16.29 33.96 16.15Q34.06 16.01 34.04 15.74L33.55 9.3L30.91 16.37Q30.7 16.96 30.47 17.12Q30.24 17.28 29.94 17.28Q29.7 17.28 29.52 17.23Q29.33 17.17 29.16 16.97Q29 16.76 28.82 16.32L26.05 9.34L25.56 15.44Q25.52 15.84 25.73 16.05Q25.94 16.26 26.27 16.43L26.55 16.57Q26.69 16.64 26.77 16.76Q26.85 16.87 26.85 17.05Q26.85 17.3 26.69 17.45Q26.52 17.6 26.18 17.6H23.59Q23.25 17.6 23.09 17.46Q22.92 17.32 22.92 17.08Q22.92 16.84 23.05 16.71Q23.18 16.58 23.4 16.48L23.61 16.38Q23.89 16.26 24.08 16.04Q24.27 15.83 24.3 15.43L24.92 7.85Q24.96 7.37 24.87 7.14Q24.77 6.91 24.48 6.82L24.13 6.71Q23.93 6.63 23.82 6.49Q23.71 6.35 23.71 6.13Q23.71 5.6 24.39 5.6H27.48Q27.96 5.6 28.26 5.8Q28.55 6 28.79 6.62Z';

// Shield (gold) that holds the handshake.
const SHIELD = 'M24 20.6 34 23.6V31.2C34 37.2 29.6 40.8 24 43 18.4 40.8 14 37.2 14 31.2V23.6Z';

// Handshake line-art (24x24 grid), drawn stroke by stroke so it can animate.
const HANDSHAKE = [
  'm11 17 2 2a1 1 0 1 0 3-3',
  'm14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4',
  'm21 3 1 11h-2',
  'M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3',
  'M3 4h8',
];

export function Logo({ size = 40, variant = 'tile', animated = false, className = '' }: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const gDm = `gdm${uid}`;
  const gShield = `gsh${uid}`;
  const bg = `bg${uid}`;

  return (
    <svg
      role="img"
      aria-label="DayMate"
      width={size}
      height={size}
      viewBox={variant === 'tile' ? '0 0 48 48' : '8.5 4.8 31 39'}
      fill="none"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gDm} x1="24" y1="5.6" x2="24" y2="17.6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE3A3" />
          <stop offset="1" stopColor="#E9A23B" />
        </linearGradient>
        <linearGradient id={gShield} x1="24" y1="20.6" x2="24" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE3A3" />
          <stop offset="1" stopColor="#E9A23B" />
        </linearGradient>
        <linearGradient id={bg} x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2A3FA0" />
          <stop offset="1" stopColor="#111A52" />
        </linearGradient>
      </defs>

      {variant === 'tile' && (
        <>
          <rect width="48" height="48" rx="12" fill={`url(#${bg})`} />
          <rect x=".2" y=".2" width="47.6" height="47.6" rx="11.8" stroke="#E9A23B" strokeOpacity=".35" strokeWidth=".4" />
        </>
      )}

      {/* DM */}
      <motion.path
        d={DM}
        fill={`url(#${gDm})`}
        initial={animated ? { opacity: 0, y: 4 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* shield */}
      <motion.path
        d={SHIELD}
        fill={`url(#${gShield})`}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        initial={animated ? { opacity: 0, scale: 0.8 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* handshake */}
      <g
        transform="translate(17.40 23.80) scale(0.55)"
        stroke={NAVY}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {HANDSHAKE.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            initial={animated ? { pathLength: 0, opacity: 0 } : false}
            animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
            transition={{ duration: 0.7, delay: 0.8 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </g>
    </svg>
  );
}