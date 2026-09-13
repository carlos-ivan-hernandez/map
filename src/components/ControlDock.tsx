import { Button, Label, Switch } from "@heroui/react";
import { RecordIcon, SignOutIcon, StopIcon } from "./icons";

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
  onSignOut: () => void;
}

export function ControlDock({
  isRecording,
  busy,
  canRecord,
  wakeLock,
  onStart,
  onStop,
  onSignOut,
}: ControlDockProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0f19]/85 p-2.5 shadow-2xl backdrop-blur-md">
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
                wakeLock.active ? "text-sky-400" : "text-white/60"
              }`}
            >
              {wakeLock.supported ? "Screen" : "No lock"}
            </Label>
          </Switch.Content>
        </Switch>

        <Button
          aria-label="Sign out"
          variant="ghost"
          isIconOnly
          className="shrink-0 text-white/50"
          onPress={onSignOut}
        >
          <SignOutIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
}
