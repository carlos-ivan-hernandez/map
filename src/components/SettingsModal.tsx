import { Button, Label, Modal, Switch } from "@heroui/react";
import type { Theme } from "../hooks/useTheme";
import { SignOutIcon } from "./icons";

interface SettingsModalProps {
  isOpen: boolean;
  theme: Theme;
  email: string | null;
  wakeLock: {
    supported: boolean;
    enabled: boolean;
    active: boolean;
    setEnabled: (value: boolean) => void;
  };
  isRecording: boolean;
  onThemeChange: (theme: Theme) => void;
  onSignOut: () => void;
  onClose: () => void;
}

const SECTION = "flex flex-col gap-3 rounded-lg border border-border bg-default/20 p-4";
const ROW = "flex items-center justify-between gap-4";
const HEADING = "text-xs font-semibold uppercase tracking-wider text-muted";

export function SettingsModal({
  isOpen,
  theme,
  email,
  wakeLock,
  isRecording,
  onThemeChange,
  onSignOut,
  onClose,
}: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>Settings</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <div className="flex flex-col gap-4">
                <div className={SECTION}>
                  <h3 className={HEADING}>Appearance</h3>
                  <Switch
                    className={ROW}
                    isSelected={theme === "dark"}
                    onChange={(selected) => onThemeChange(selected ? "dark" : "light")}
                  >
                    <Switch.Content className="w-full flex-row-reverse justify-between">
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label className="text-sm text-foreground">Dark theme</Label>
                    </Switch.Content>
                  </Switch>
                  <p className="text-xs text-muted">
                    Dark is the default — it's easier on the eyes at night and the map chrome is
                    tuned for it.
                  </p>
                </div>

                <div className={SECTION}>
                  <h3 className={HEADING}>Driving</h3>
                  <Switch
                    className={ROW}
                    isSelected={wakeLock.enabled}
                    onChange={wakeLock.setEnabled}
                    isDisabled={!wakeLock.supported}
                  >
                    <Switch.Content className="w-full flex-row-reverse justify-between">
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label className="text-sm text-foreground">Keep the screen awake</Label>
                    </Switch.Content>
                  </Switch>
                  <p className="text-xs text-muted">
                    {wakeLock.supported
                      ? "Stops the phone sleeping mid-drive. Also on the main toolbar."
                      : "This browser has no Wake Lock API, so the screen will sleep on its own."}
                  </p>
                </div>

                <div className={SECTION}>
                  <h3 className={HEADING}>Account</h3>
                  <div className={ROW}>
                    <span className="min-w-0 truncate text-sm text-foreground">
                      {email ?? "Signed in"}
                    </span>
                    <Button variant="outline" onPress={onSignOut} isDisabled={isRecording}>
                      <SignOutIcon className="size-4" />
                      Sign out
                    </Button>
                  </div>
                  {isRecording && (
                    <p className="text-xs text-muted">End the drive before signing out.</p>
                  )}
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button slot="close" variant="outline" onPress={onClose}>
                Done
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
