'use client';

import { useId } from 'react';

interface OrbitMarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function OrbitMark({ size = 18, animated = false, className }: OrbitMarkProps) {
  const uid = useId();
  const pathId = `op${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Orbital ring — also serves as the animateMotion path */}
      <ellipse
        id={animated ? pathId : undefined}
        cx="11" cy="11"
        rx="9.5" ry="5"
        stroke="#8b5cf6"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Planet */}
      <circle cx="11" cy="11" r="3.2" fill="#a78bfa" />
      {/* Satellite — static or orbiting */}
      {animated ? (
        <circle r="1.6" fill="#c4b5fd" opacity="0.95">
          <animateMotion dur="6s" repeatCount="indefinite">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ) : (
        <circle cx="19.6" cy="7.6" r="1.5" fill="#c4b5fd" opacity="0.9" />
      )}
    </svg>
  );
}

interface OrbitWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
}

const wordmarkSizes = {
  sm:   { mark: 16, text: 'text-[15px]' },
  md:   { mark: 22, text: 'text-[20px]' },
  lg:   { mark: 28, text: 'text-[26px]' },
  hero: { mark: 52, text: 'text-[72px]' },
};

export function OrbitWordmark({ size = 'md', animated = false }: OrbitWordmarkProps) {
  const { mark, text } = wordmarkSizes[size];

  if (size === 'hero') {
    return (
      <div className="flex flex-col items-center gap-5">
        {/* Animated mark with halo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-32 h-32 bg-violet-500/15 rounded-full blur-3xl animate-halo" />
          <div className="absolute w-20 h-20 bg-violet-400/10 rounded-full blur-xl animate-pulse-soft" />
          <OrbitMark size={mark} animated={animated} />
        </div>
        {/* Giant wordmark */}
        <span
          className={`${text} font-black tracking-[-0.055em] leading-none ${
            animated ? 'text-gradient-animated' : 'text-gradient-violet'
          }`}
        >
          Orbit
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <OrbitMark size={mark} animated={animated} />
      <span className={`${text} font-bold tracking-tight text-gradient-violet`}>
        Orbit
      </span>
    </div>
  );
}
