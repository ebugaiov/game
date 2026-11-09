"use client";

import { useEffect, useRef, useState } from "react";

type UseCountdownInput = {
  endsAt: string | null;
  serverTime: string;
  enabled: boolean;
  onExpire: () => void;
};

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

export function useCountdown({ endsAt, serverTime, enabled, onExpire }: UseCountdownInput) {
  const [remainingMs, setRemainingMs] = useState(0);
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    firedRef.current = false;
  }, [endsAt, serverTime, enabled]);

  useEffect(() => {
    if (!enabled || !endsAt) return;

    // Server clock only: anchor to the snapshot's serverTime and let local
    // elapsed time since receipt drive the countdown.
    const deadline = new Date(endsAt).getTime();
    const serverNowAtReceipt = new Date(serverTime).getTime();
    const receivedAt = Date.now();

    const tick = () => {
      const serverNow = serverNowAtReceipt + (Date.now() - receivedAt);
      const remaining = Math.max(0, deadline - serverNow);
      setRemainingMs(remaining);

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [endsAt, serverTime, enabled]);

  const activeRemainingMs = enabled && endsAt ? remainingMs : 0;

  return {
    remainingMs: activeRemainingMs,
    label: formatRemaining(activeRemainingMs),
  };
}
