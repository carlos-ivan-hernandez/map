import { Button, Label, Switch } from "@heroui/react";
import { PANEL } from "../lib/ui";
import { GearIcon, RecordIcon, StopIcon } from "./icons";

interface ControlDockProps {
  isRecording: boolean;
  busy: boolean;
  canRecord: boolean;
  wakeLock: {
    supported: boolean;
    enabled: boolean;
    active: boolean;
    setEnabled: (value: boolean) => void;
  };
  onStart: () => void;
  onStop: () => void;
  onOpenSettings: () => void;
}

export function ControlDock({
  isRecording,
  busy,
  canRecord,
  wakeLock,
  onStart,
  onStop,
  onOpenSettings,
}: ControlDockProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className={`flex w-full max-w-md items-center gap-3 rounded-xl p-2.5 ${PANEL}`}>
        <Button
          variant={isRecording ? "danger" : "primary"}
          className="min-w-0 flex-1"
          isDisabled={busy || (!isRecording && !canRecord)}
          onPress={isRecording ? onStop : onStart}
        >
          {isRecording ? <StopIcon className="size-4" /> : <RecordIcon className="size-4" />}
          <span className="truncate">{isRecording ? "End drive" : "Start drive"}</span>
        </Button>

        <Switch
          className="shrink-0"
          isSelected={wakeLock.enabled}
          onChange={wakeLock.setEnabled}
          isDisabled={!wakeLock.supported}
        >
          <Switch.Content className="gap-2">
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label
              className={`whitespace-nowrap text-xs ${
                wakeLock.active ? "text-accent" : "text-muted"
              }`}
            >
              {wakeLock.supported ? "Screen" : "No lock"}
            </Label>
          </Switch.Content>
        </Switch>

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
