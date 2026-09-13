import { Button } from "@heroui/react";
import { PANEL } from "../lib/ui";
import { CrosshairIcon, MinusIcon, PlusIcon } from "./icons";
import { MAX_ZOOM, MIN_ZOOM } from "./MapView";

interface MapControlsProps {
  zoom: number;
  follow: boolean;
  canRecenter: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

const controlClass = `size-11 rounded-lg ${PANEL}`;

export function MapControls({
  zoom,
  follow,
  canRecenter,
  onZoomIn,
  onZoomOut,
  onRecenter,
}: MapControlsProps) {
  return (
    <div className="absolute right-3 top-1/2 z-[1000] flex -translate-y-1/2 flex-col items-center gap-2">
      <Button
        aria-label="Zoom in"
        variant="ghost"
        isIconOnly
        className={`${controlClass} text-foreground`}
        isDisabled={zoom >= MAX_ZOOM}
        onPress={onZoomIn}
      >
        <PlusIcon className="size-5" />
      </Button>

      <span className={`rounded px-2 py-0.5 text-xs tabular-nums text-muted ${PANEL}`}>
        z{zoom}
      </span>

      <Button
        aria-label="Zoom out"
        variant="ghost"
        isIconOnly
        className={`${controlClass} text-foreground`}
        isDisabled={zoom <= MIN_ZOOM}
        onPress={onZoomOut}
      >
        <MinusIcon className="size-5" />
      </Button>

      {/* Stays enabled while following so it reads as a state light, not a dead button. */}
      <Button
        aria-label={follow ? "Following your location" : "Recentre on me"}
        variant="ghost"
        isIconOnly
        className={`${controlClass} mt-2 ${
          follow ? "text-accent" : "animate-pulse text-foreground"
        }`}
        isDisabled={!canRecenter}
        onPress={onRecenter}
      >
        <CrosshairIcon className="size-5" />
      </Button>
    </div>
  );
}
