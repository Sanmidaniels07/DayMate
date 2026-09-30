'use client';

import { motion } from 'framer-motion';

type LogoProps = {
  size?: number;

  variant?: 'tile' | 'mark';

  animated?: boolean;

  className?: string;

  ariaLabel?: string;
};

const LOGO_SRC = '/assets/daymate-logo.svg';

export function Logo({
  size = 40,
  variant: _variant = 'tile',
  animated = false,
  className = '',
  ariaLabel = 'DayMate',
}: LogoProps) {
  return (
    <motion.img
      src={LOGO_SRC}
      alt={ariaLabel}
      width={size}
      height={size}
      draggable={false}
      className={`shrink-0 object-contain ${className}`}
      initial={
        animated
          ? {
              opacity: 0,
              scale: 0.92,
            }
          : false
      }
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={
        animated
          ? {
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }
          : {
              duration: 0,
            }
      }
    />
  );
}

export default Logo;