import Image from 'next/image';

type LogoProps = {
  /** Pixel size (width & height) of the mark. Defaults to 32. */
  size?: number;
  className?: string;
};


export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <Image
      src="/assets/day-mate-logo.png"
      alt="DayMate"
      width={size}
      height={size}
      priority
      className={`shrink-0 object-contain ${className}`}
    />
  );
}