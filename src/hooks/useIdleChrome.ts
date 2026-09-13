import { useCallback, useEffect, useRef, useState } from "react";

const HIDE_AFTER_MS = 10_000;

interface Options {
  /** While true the chrome is pinned open — e.g. a modal is covering the map. */
  paused?: boolean;
  timeoutMs?: number;
}

/**
 * Shows the map chrome on genuine user input and fades it out again after a
 * quiet spell.
 *
 * Deliberately driven by input events rather than Leaflet's move events: follow
 * mode re-centres the map on every GPS fix, so map movement would keep the
 * chrome on screen for the whole drive.
 */
export function useIdleChrome({ paused = false, timeoutMs = HIDE_AFTER_MS }: Options = {}) {
  const [shown, setShown] = useState(true);
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const arm = useCallback(() => {
    clear();
    timerRef.current = window.setTimeout(() => setShown(false), timeoutMs);
  }, [clear, timeoutMs]);

  const show = useCallback(() => {
    setShown(true);
    arm();
  }, [arm]);

  /*
   * Pausing reads through `visible` below rather than writing state, which keeps
   * the countdown the only thing that ever flips `shown`. The timer is cleared
   * while paused, so `shown` still holds whatever it was when the modal opened —
   * necessarily true, since opening one means pressing a button on the chrome.
   */
  useEffect(() => {
    if (paused) {
      clear();
      return;
    }
    arm();
    return clear;
  }, [paused, arm, clear]);

  useEffect(() => {
    const onKey = () => show();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  return { visible: paused || shown, show };
}
