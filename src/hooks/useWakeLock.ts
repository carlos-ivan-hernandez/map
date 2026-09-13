import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Holds a screen wake lock while enabled. The browser drops the lock whenever the
 * page is hidden (tab switch, screen off), so it is re-acquired on visibility change.
 */
export function useWakeLock() {
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const release = useCallback(async () => {
    const lock = lockRef.current;
    lockRef.current = null;
    setActive(false);
    if (lock && !lock.released) {
      try {
        await lock.release();
      } catch {
        // Already gone; nothing to clean up.
      }
    }
  }, []);

  const acquire = useCallback(async () => {
    if (!supported || lockRef.current || document.visibilityState !== "visible") return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      lockRef.current = lock;
      setActive(true);
      setError(null);
      lock.addEventListener("release", () => {
        lockRef.current = null;
        setActive(false);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not keep the screen awake");
      setActive(false);
    }
  }, [supported]);

  useEffect(() => {
    if (!enabled) {
      void release();
      return;
    }

    void acquire();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void release();
    };
  }, [enabled, acquire, release]);

  return { supported, enabled, active, error, setEnabled };
}
