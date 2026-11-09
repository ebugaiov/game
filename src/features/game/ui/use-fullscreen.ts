"use client";

import { useCallback, useEffect, useState } from "react";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function currentlyFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as FullscreenDocument;
  return Boolean(document.fullscreenElement ?? doc.webkitFullscreenElement);
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const update = () => setIsFullscreen(currentlyFullscreen());
    update();
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
    };
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (!currentlyFullscreen()) {
        const element = document.documentElement as FullscreenElement;
        if (element.requestFullscreen) await element.requestFullscreen();
        else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen();
      } else {
        const doc = document as FullscreenDocument;
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen toggle failed", error);
    }
  }, []);

  return { isFullscreen, toggle };
}
