import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { haversine, trailDistance } from "../lib/geo";
import type { TrailPoint } from "../lib/types";

/** Ignore jitter: a fix must move this far, or be this old, before it joins the trail. */
const MIN_MOVE_M = 8;
const MIN_GAP_MS = 15_000;
/** A fix this vague is noise, not a position. */
const MAX_ACCURACY_M = 100;

const FLUSH_EVERY_MS = 15_000;
const FLUSH_AT_COUNT = 25;

const RESUME_KEY = "drive-trail:active-session";

interface ResumeState {
  sessionId: string;
  startedAt: number;
  trail: TrailPoint[];
}

function readResumeState(): ResumeState | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResumeState;
    if (!parsed?.sessionId || !Array.isArray(parsed.trail)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Records a driving session: accumulates the on-screen trail and streams points
 * into Supabase in batches. Survives a reload mid-drive via localStorage.
 */
export function useDriveSession(position: TrailPoint | null) {
  // Restore an interrupted drive so a browser reload doesn't orphan the session.
  const [resumed] = useState(readResumeState);
  const [sessionId, setSessionId] = useState<string | null>(resumed?.sessionId ?? null);
  const [startedAt, setStartedAt] = useState<number | null>(resumed?.startedAt ?? null);
  const [trail, setTrail] = useState<TrailPoint[]>(resumed?.trail ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const queueRef = useRef<TrailPoint[]>([]);
  const sessionIdRef = useRef<string | null>(sessionId);
  const trailRef = useRef<TrailPoint[]>(trail);
  const lastFlushRef = useRef(0);

  // flush() runs from timers and unload handlers, so it reads the latest values
  // through refs rather than a stale closure.
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    trailRef.current = trail;
  }, [trail]);

  useEffect(() => {
    if (!sessionId || startedAt === null) {
      localStorage.removeItem(RESUME_KEY);
      return;
    }
    try {
      localStorage.setItem(RESUME_KEY, JSON.stringify({ sessionId, startedAt, trail }));
    } catch {
      // Storage full or blocked; the drive still works, it just can't be resumed.
    }
  }, [sessionId, startedAt, trail]);

  const flush = useCallback(async () => {
    const id = sessionIdRef.current;
    const batch = queueRef.current;
    if (!id || batch.length === 0) return;

    queueRef.current = [];
    setPendingCount(0);
    lastFlushRef.current = Date.now();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { error: insertError } = await supabase.from("map_session_points").insert(
      batch.map((p) => ({
        session_id: id,
        user_id: userId,
        recorded_at: new Date(p.t).toISOString(),
        latitude: p.lat,
        longitude: p.lng,
        accuracy_m: p.accuracy,
        altitude_m: p.altitude,
        speed_mps: p.speed,
        heading_deg: p.heading,
      })),
    );

    if (insertError) {
      // Put the batch back so the next flush retries rather than losing the trail.
      queueRef.current = [...batch, ...queueRef.current];
      setPendingCount(queueRef.current.length);
      setError(`Could not save trail points: ${insertError.message}`);
    } else {
      setError(null);
    }
  }, []);

  // Append qualifying fixes to the trail and the upload queue.
  useEffect(() => {
    if (!sessionId || !position) return;
    if (position.accuracy !== null && position.accuracy > MAX_ACCURACY_M) return;

    const previous = trailRef.current[trailRef.current.length - 1];
    if (previous) {
      const moved = haversine(previous, position);
      if (moved < MIN_MOVE_M && position.t - previous.t < MIN_GAP_MS) return;
      if (position.t <= previous.t) return;
    }

    setTrail((prev) => [...prev, position]);
    queueRef.current.push(position);
    setPendingCount(queueRef.current.length);
  }, [position, sessionId]);

  // Batch uploads: on a timer, and early once enough points have piled up.
  useEffect(() => {
    if (!sessionId) return;
    if (pendingCount >= FLUSH_AT_COUNT) void flush();

    const timer = window.setInterval(() => {
      if (Date.now() - lastFlushRef.current >= FLUSH_EVERY_MS) void flush();
    }, FLUSH_EVERY_MS);

    return () => window.clearInterval(timer);
  }, [sessionId, pendingCount, flush]);

  // Don't lose the tail of a drive when the app is backgrounded or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flush]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You are signed out.");

      const { data, error: insertError } = await supabase
        .from("map_sessions")
        .insert({ user_id: userId, started_at: new Date().toISOString() })
        .select("id, started_at")
        .single();

      if (insertError) throw insertError;

      queueRef.current = [];
      setPendingCount(0);
      lastFlushRef.current = Date.now();
      setTrail(position ? [position] : []);
      if (position) queueRef.current.push(position);
      setStartedAt(new Date(data.started_at).getTime());
      setSessionId(data.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the drive.");
    } finally {
      setBusy(false);
    }
  }, [position]);

  const stop = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;

    setBusy(true);
    try {
      await flush();
      const points = trailRef.current;
      const { error: updateError } = await supabase
        .from("map_sessions")
        .update({
          ended_at: new Date().toISOString(),
          distance_m: trailDistance(points),
          point_count: points.length,
        })
        .eq("id", id);

      if (updateError) throw updateError;
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not close out the drive.");
    } finally {
      setSessionId(null);
      setStartedAt(null);
      setBusy(false);
    }
  }, [flush]);

  const clearTrail = useCallback(() => setTrail([]), []);

  return {
    sessionId,
    startedAt,
    trail,
    isRecording: sessionId !== null,
    pendingCount,
    busy,
    error,
    start,
    stop,
    clearTrail,
  };
}
