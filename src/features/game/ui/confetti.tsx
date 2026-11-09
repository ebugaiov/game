"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const COLORS = ["#fecc00", "#005293", "#06b6d4", "#a855f7", "#10b981", "#ffffff"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
};

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    }));

    let frame = 0;

    const animate = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      let anyVisible = false;

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        if (particle.y < canvas.height) anyVisible = true;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        context.restore();
      }

      if (anyVisible) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, reducedMotion]);

  if (!active || reducedMotion) return null;

  return (
    <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[60]" />
  );
}
