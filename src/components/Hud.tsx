import { formatDistance, formatDuration, formatSpeed } from "../lib/geo";
import { PANEL } from "../lib/ui";
import type { TrailPoint } from "../lib/types";

interface HudProps {
  position: TrailPoint | null;
  distanceM: number;
  startedAt: number | null;
  now: number;
  isRecording: boolean;
  pendingCount: number;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center px-1">
      <span className="truncate text-lg font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}

export function Hud({ position, distanceM, startedAt, now, isRecording, pendingCount }: HudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className={`pointer-events-auto flex items-center gap-1 rounded-xl px-3 py-2 ${PANEL}`}>
        <span
          className={`mr-1 size-2.5 shrink-0 rounded-full ${
            isRecording ? "animate-pulse bg-danger" : "bg-muted/40"
          }`}
          title={isRecording ? "Recording" : "Not recording"}
        />
        <Stat label="Speed" value={formatSpeed(position?.speed ?? null)} />
        <Stat label="Distance" value={formatDistance(distanceM)} />
        <Stat label="Time" value={startedAt === null ? "--" : formatDuration(now - startedAt)} />
        {pendingCount > 0 && (
          <span
            className="ml-1 rounded-full bg-default px-2 py-0.5 text-[10px] text-muted"
            title={`${pendingCount} point(s) waiting to sync`}
          >
            {pendingCount}↑
          </span>
        )}
      </div>
    </div>
  );
}
