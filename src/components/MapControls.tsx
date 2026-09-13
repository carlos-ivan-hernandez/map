import { Button } from "@heroui/react";
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

const controlClass =
  "size-11 rounded-xl border border-white/10 bg-[#0b0f19]/85 text-white shadow-lg backdrop-blur-md";

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
        className={controlClass}
        isDisabled={zoom >= MAX_ZOOM}
        onPress={onZoomIn}
      >
        <PlusIcon className="size-5" />
      </Button>

      <span className="rounded-lg bg-[#0b0f19]/85 px-2 py-0.5 text-xs tabular-nums text-white/60 shadow backdrop-blur-md">
        z{zoom}
      </span>

      <Button
        aria-label="Zoom out"
        variant="ghost"
        isIconOnly
        className={controlClass}
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
          follow ? "text-sky-400" : "animate-pulse text-white"
        }`}
        isDisabled={!canRecenter}
        onPress={onRecenter}
      >
        <CrosshairIcon className="size-5" />
      </Button>
    </div>
  );
}
