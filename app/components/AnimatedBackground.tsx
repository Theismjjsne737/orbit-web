'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spotlightRef.current;
    if (!el) return;
    let rafId: number;

    function onMove(e: MouseEvent) {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el!.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
      });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid" />

      {/* Floating gradient orbs */}
      <div
        className="absolute rounded-full animate-orb-1"
        style={{
          top: '-18%', left: '-14%',
          width: 820, height: 820,
          background: 'rgba(124, 58, 237, 0.16)',
          filter: 'blur(140px)',
        }}
      />
      <div
        className="absolute rounded-full animate-orb-2"
        style={{
          bottom: '-20%', right: '-14%',
          width: 720, height: 720,
          background: 'rgba(79, 70, 229, 0.14)',
          filter: 'blur(130px)',
        }}
      />
      <div
        className="absolute rounded-full animate-orb-3"
        style={{
          top: '30%', right: '8%',
          width: 520, height: 520,
          background: 'rgba(139, 92, 246, 0.09)',
          filter: 'blur(110px)',
        }}
      />

      {/* Cursor spotlight */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 rounded-full"
        style={{
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.07) 0%, transparent 70%)',
          transition: 'transform 0.15s ease-out',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      />

      {/* Edge vignette to keep content readable */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, #040407 92%)',
        }}
      />
    </div>
  );
}
