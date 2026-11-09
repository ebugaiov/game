"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SoundType = "tick" | "correct" | "wrong" | "victory";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function useSound() {
  const [enabled, setEnabled] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;

    if (!audioRef.current) {
      const AudioContextConstructor =
        window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!AudioContextConstructor) return null;
      audioRef.current = new AudioContextConstructor();
    }

    if (audioRef.current.state === "suspended") {
      void audioRef.current.resume();
    }
    return audioRef.current;
  }, []);

  const play = useCallback(
    (type: SoundType) => {
      if (!enabled) return;

      try {
        const ctx = ensureAudio();
        if (!ctx) return;
        const now = ctx.currentTime;

        if (type === "tick") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(190, now + 0.035);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.035);
          return;
        }

        if (type === "correct") {
          [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + index * 0.07;
            osc.type = "sine";
            osc.frequency.setValueAtTime(frequency, start);
            gain.gain.setValueAtTime(0.18, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.2);
          });
          return;
        }

        if (type === "wrong") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.linearRampToValueAtTime(95, now + 0.3);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
          return;
        }

        const notes = [523.25, 659.25, 783.99, 1046.5, 880, 1046.5];
        const times = [0, 0.1, 0.2, 0.3, 0.5, 0.7];
        notes.forEach((frequency, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + times[index]!;
          osc.type = "triangle";
          osc.frequency.setValueAtTime(frequency, start);
          gain.gain.setValueAtTime(0.2, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.25);
        });
      } catch (error) {
        console.error("Sound playback failed", error);
      }
    },
    [enabled, ensureAudio],
  );

  const toggle = useCallback(() => {
    setEnabled((current) => !current);
    try {
      ensureAudio();
    } catch (error) {
      console.error("Audio initialization failed", error);
    }
  }, [ensureAudio]);

  const init = useCallback(() => {
    try {
      ensureAudio();
    } catch (error) {
      console.error("Audio initialization failed", error);
    }
  }, [ensureAudio]);

  useEffect(() => {
    return () => {
      void audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  return { enabled, toggle, play, init };
}
