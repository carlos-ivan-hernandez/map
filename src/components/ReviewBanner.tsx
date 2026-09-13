import { Button } from "@heroui/react";
import { formatDistance, formatDuration } from "../lib/geo";
import { PANEL } from "../lib/ui";
import { CloseIcon } from "./icons";
import type { DriveSession } from "../lib/types";

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

interface ReviewBannerProps {
  trip: DriveSession;
  pointCount: number;
  onExit: () => void;
}

export function ReviewBanner({ trip, pointCount, onExit }: ReviewBannerProps) {
  const duration = trip.ended_at
    ? formatDuration(new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime())
    : null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-3 py-2 ${PANEL}`}>
        <span className="size-2.5 shrink-0 rounded-full bg-[#9333ea]" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm text-foreground">
            {dateFormat.format(new Date(trip.started_at))}
          </span>
          <span className="text-xs text-muted">
            {formatDistance(trip.distance_m)}
            {duration && ` · ${duration}`} · {pointCount} pts
          </span>
        </span>
        <Button
          aria-label="Stop reviewing this trip"
          variant="ghost"
          isIconOnly
          className="ml-auto shrink-0 text-muted"
          onPress={onExit}
        >
          <CloseIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
}
