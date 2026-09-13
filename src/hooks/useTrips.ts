import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import type { DriveSession, TrailPoint } from "../lib/types";

const TRIP_LIMIT = 100;
/** Supabase caps a single select; walk the trip in pages. */
const POINT_PAGE = 1000;
const MAX_POINTS = 20_000;

interface PointRow {
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy_m: number | null;
  altitude_m: number | null;
  speed_mps: number | null;
  heading_deg: number | null;
}

export function useTrips() {
  const [trips, setTrips] = useState<DriveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: selectError } = await supabase
      .from("map_sessions")
      .select("id, started_at, ended_at, label, distance_m, point_count")
      .order("started_at", { ascending: false })
      .limit(TRIP_LIMIT);

    if (selectError) setError(selectError.message);
    else setTrips(data ?? []);
    setLoading(false);
  }, []);

  const loadPoints = useCallback(async (sessionId: string): Promise<TrailPoint[]> => {
    const points: TrailPoint[] = [];

    for (let from = 0; from < MAX_POINTS; from += POINT_PAGE) {
      const { data, error: pageError } = await supabase
        .from("map_session_points")
        .select("latitude, longitude, recorded_at, accuracy_m, altitude_m, speed_mps, heading_deg")
        .eq("session_id", sessionId)
        .order("recorded_at", { ascending: true })
        .range(from, from + POINT_PAGE - 1);

      if (pageError) throw new Error(pageError.message);

      const rows = (data ?? []) as PointRow[];
      for (const row of rows) {
        points.push({
          lat: row.latitude,
          lng: row.longitude,
          t: new Date(row.recorded_at).getTime(),
          accuracy: row.accuracy_m,
          altitude: row.altitude_m,
          speed: row.speed_mps,
          heading: row.heading_deg,
        });
      }

      if (rows.length < POINT_PAGE) break;
    }

    return points;
  }, []);

  return { trips, loading, error, refresh, loadPoints };
}
