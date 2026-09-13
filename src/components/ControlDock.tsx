import { Button } from "@heroui/react";
import { PANEL } from "../lib/ui";
import { GearIcon, RecordIcon, RouteIcon, StopIcon } from "./icons";

interface ControlDockProps {
  visible: boolean;
  isRecording: boolean;
  busy: boolean;
  canRecord: boolean;
  onStart: () => void;
  onStop: () => void;
  onOpenTrips: () => void;
  onOpenSettings: () => void;
}

export function ControlDock({
  visible,
  isRecording,
  busy,
  canRecord,
  onStart,
  onStop,
  onOpenTrips,
  onOpenSettings,
}: ControlDockProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        className={`flex w-full max-w-md items-center gap-2 rounded-xl p-2.5 transition-opacity duration-500 ${PANEL} ${
          visible ? "pointer-events-auto opacity-100" : "opacity-0"
        }`}
        aria-hidden={!visible}
      >
        <Button
          variant={isRecording ? "danger" : "primary"}
          className="min-w-0 flex-1"
          isDisabled={busy || (!isRecording && !canRecord)}
          onPress={isRecording ? onStop : onStart}
        >
          {isRecording ? <StopIcon className="size-4" /> : <RecordIcon className="size-4" />}
          <span className="truncate">{isRecording ? "End drive" : "Start drive"}</span>
        </Button>

        <Button
          aria-label="Past trips"
          variant="ghost"
          isIconOnly
          className="shrink-0 text-muted"
          onPress={onOpenTrips}
        >
          <RouteIcon className="size-5" />
        </Button>

        <Button
          aria-label="Settings"
          variant="ghost"
          isIconOnly
          className="shrink-0 text-muted"
          onPress={onOpenSettings}
        >
          <GearIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
}
