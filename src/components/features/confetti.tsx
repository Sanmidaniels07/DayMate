'use client';
import { useEffect, useRef } from 'react';

const COLORS = ['#e8a33d', '#f4cdd4', '#bcd7e8', '#cbe0c3', '#ddd0f0'];

export function Confetti({ fire }: { fire: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fire || !ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;

    const pieces = Array.from({ length: 60 }, () => ({
      x: canvas.width / 2, y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 8, vy: Math.random() * -8 - 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 6 + 3, rot: Math.random() * Math.PI,
    }));

    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.rot += 0.1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      frame++;
      if (frame < 90) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    tick();
  }, [fire]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-10 size-full" />;
}