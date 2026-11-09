"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dices } from "lucide-react";
import { computeSpin, sliceAtPointer } from "../domain/spin";
import type { CategoryDto } from "../schemas";
import { strings } from "./strings";
import { usePrefersReducedMotion } from "./use-reduced-motion";

type WheelProps = {
  categories: CategoryDto[];
  currentPlayerName: string;
  disabled: boolean;
  onSpinEnd: (categoryId: string) => void;
  onTick: () => void;
};

export function Wheel({ categories, currentPlayerName, disabled, onSpinEnd, onTick }: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const tickTimeoutRef = useRef<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [pointerTick, setPointerTick] = useState(false);

  const categoriesRef = useRef(categories);
  const onSpinEndRef = useRef(onSpinEnd);
  const onTickRef = useRef(onTick);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    onSpinEndRef.current = onSpinEnd;
  }, [onSpinEnd]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const slices = categoriesRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 10;

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (slices.length === 0) return;

    const sliceAngle = (Math.PI * 2) / slices.length;

    slices.forEach((category, index) => {
      const startAngle = angleRef.current + index * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      context.beginPath();
      context.moveTo(cx, cy);
      context.arc(cx, cy, radius, startAngle, endAngle);
      context.closePath();
      context.fillStyle = category.color;
      context.fill();
      context.lineWidth = 2.5;
      context.strokeStyle = "#070b14";
      context.stroke();

      const pinX = cx + (radius - 4) * Math.cos(startAngle);
      const pinY = cy + (radius - 4) * Math.sin(startAngle);
      context.beginPath();
      context.arc(pinX, pinY, 3.5, 0, Math.PI * 2);
      context.fillStyle = "#fecc00";
      context.fill();
      context.strokeStyle = "#000000";
      context.lineWidth = 1;
      context.stroke();

      context.save();
      context.translate(cx, cy);
      context.rotate(startAngle + sliceAngle / 2);
      context.textAlign = "right";
      context.fillStyle = "#ffffff";
      context.font = "bold 10px Inter, sans-serif";
      context.shadowColor = "rgba(0,0,0,0.85)";
      context.shadowBlur = 5;
      let label = `${category.icon} ${category.name}`;
      if (label.length > 20) label = `${label.substring(0, 18)}..`;
      context.fillText(label, radius - 20, 4);
      context.restore();
    });

    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.lineWidth = 8;
    context.strokeStyle = "#fecc00";
    context.stroke();

    context.beginPath();
    context.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    context.lineWidth = 2;
    context.strokeStyle = "rgba(0,0,0,0.5)";
    context.stroke();
  }, []);

  useEffect(() => {
    draw();
  }, [draw, categories]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (tickTimeoutRef.current !== null) window.clearTimeout(tickTimeoutRef.current);
    };
  }, []);

  const triggerPointerTick = () => {
    setPointerTick(true);
    if (tickTimeoutRef.current !== null) window.clearTimeout(tickTimeoutRef.current);
    tickTimeoutRef.current = window.setTimeout(() => setPointerTick(false), 60);
  };

  const spin = () => {
    if (disabled || spinning || categories.length === 0) return;

    const result = computeSpin({
      currentAngle: angleRef.current,
      sliceCount: categories.length,
      rng: Math.random,
    });

    const startAngle = angleRef.current;
    const startTime = performance.now();
    const duration = reducedMotion ? 0 : result.durationMs;
    let lastSlice = sliceAtPointer({ angle: startAngle, sliceCount: categories.length });

    setSpinning(true);

    const animate = (now: number) => {
      const progress = duration <= 0 ? 1 : Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      angleRef.current = startAngle + result.totalRotation * eased;
      draw();

      const currentSlice = sliceAtPointer({
        angle: angleRef.current,
        sliceCount: categories.length,
      });
      if (currentSlice !== lastSlice) {
        lastSlice = currentSlice;
        onTickRef.current();
        triggerPointerTick();
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      frameRef.current = null;
      setSpinning(false);
      const category = categories[result.targetSlice];
      if (category) onSpinEndRef.current(category.id);
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative my-2 flex items-center justify-center">
        <div className="wheel-pointer-wrapper">
          <div className={`wheel-pointer ${pointerTick ? "tick-flex" : ""}`} />
        </div>
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          aria-label={strings.game.wheelLabel}
          className="h-auto max-w-full cursor-pointer rounded-full shadow-2xl transition duration-300 hover:scale-[1.01]"
        />
        <div className="pointer-events-none absolute z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-yellow-400 bg-slate-950 text-2xl font-extrabold text-yellow-300 shadow-xl">
          ⚙️
        </div>
      </div>

      <div className="mt-3 flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={spin}
          disabled={disabled || spinning || categories.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:from-yellow-400 hover:to-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 glow-yellow"
        >
          <Dices className="h-4 w-4" aria-hidden />
          {spinning ? strings.game.spinning : strings.game.spinButton}
        </button>
        <p className="h-5 text-center text-xs font-medium text-slate-300">
          {spinning ? strings.game.spinning : strings.game.spinNotice(currentPlayerName)}
        </p>
      </div>
    </div>
  );
}
