import { Slider } from "@heroui/react";
import { formatDuration, formatSpeed } from "../lib/geo";
import { PANEL } from "../lib/ui";
import type { TrailPoint } from "../lib/types";

interface ScrubBarProps {
  points: readonly TrailPoint[];
  index: number;
  onIndexChange: (index: number) => void;
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/** Replaces the dock while a trip is being reviewed. */
export function ScrubBar({ points, index, onIndexChange }: ScrubBarProps) {
  const last = Math.max(0, points.length - 1);
  const current = points[Math.min(index, last)];
  const elapsed = current && points[0] ? current.t - points[0].t : 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        className={`pointer-events-auto flex w-full max-w-md flex-col gap-1 rounded-xl px-4 py-3 ${PANEL}`}
      >
        <Slider
          aria-label="Position in trip"
          className="w-full"
          value={Math.min(index, last)}
          minValue={0}
          maxValue={last}
          step={1}
          onChange={(value) => onIndexChange(Array.isArray(value) ? value[0] : value)}
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>

        <div className="flex justify-between text-[10px] tabular-nums text-muted">
          <span>{formatDuration(elapsed)}</span>
          <span>{formatSpeed(current?.speed ?? null)}</span>
          <span>{current ? timeFormat.format(new Date(current.t)) : "--"}</span>
        </div>
      </div>
    </div>
  );
}
