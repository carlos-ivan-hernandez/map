export interface TrailPoint {
  lat: number;
  lng: number;
  /** Epoch milliseconds. */
  t: number;
  accuracy: number | null;
  altitude: number | null;
  /** Metres per second, as reported by the device. */
  speed: number | null;
  heading: number | null;
}

export interface DriveSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  label: string | null;
  distance_m: number;
  point_count: number;
}
