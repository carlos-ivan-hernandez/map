import { Button, Label, Modal, Radio, RadioGroup, Switch } from "@heroui/react";
import type { Theme } from "../hooks/useTheme";
import { BASEMAPS } from "../lib/basemaps";
import { SignOutIcon } from "./icons";

interface SettingsModalProps {
  isOpen: boolean;
  theme: Theme;
  statsShown: boolean;
  basemapId: string;
  email: string | null;
  wakeLock: {
    supported: boolean;
    enabled: boolean;
    active: boolean;
    setEnabled: (value: boolean) => void;
  };
  isRecording: boolean;
  onThemeChange: (theme: Theme) => void;
  onStatsShownChange: (shown: boolean) => void;
  onBasemapChange: (id: string) => void;
  onSignOut: () => void;
  onClose: () => void;
}

const SECTION = "flex flex-col gap-3 rounded-lg border border-border bg-default/20 p-4";
const ROW = "flex items-center justify-between gap-4";
const HEADING = "text-xs font-semibold uppercase tracking-wider text-muted";

export function SettingsModal({
  isOpen,
  theme,
  statsShown,
  basemapId,
  email,
  wakeLock,
  isRecording,
  onThemeChange,
  onStatsShownChange,
  onBasemapChange,
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

                  <Switch
                    className={ROW}
                    isSelected={statsShown}
                    onChange={onStatsShownChange}
                  >
                    <Switch.Content className="w-full flex-row-reverse justify-between">
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label className="text-sm text-foreground">Speed, distance and time</Label>
                    </Switch.Content>
                  </Switch>
                  <p className="text-xs text-muted">
                    The readout across the top of the map. It stays put when the other controls
                    fade out.
                  </p>
                </div>

                <div className={SECTION}>
                  <h3 className={HEADING}>Map style</h3>
                  <RadioGroup
                    aria-label="Map style"
                    value={basemapId}
                    onChange={onBasemapChange}
                    className="grid grid-cols-2 gap-x-3 gap-y-2"
                  >
                    {BASEMAPS.map((basemap) => (
                      <Radio key={basemap.id} value={basemap.id}>
                        {/* Fill the grid cell: a short label like "Dark" would
                            otherwise leave most of the cell a dead tap target. */}
                        <Radio.Content className="w-full gap-2 py-1">
                          <Radio.Control>
                            <Radio.Indicator />
                          </Radio.Control>
                          <Label className="text-sm text-foreground">{basemap.label}</Label>
                        </Radio.Content>
                      </Radio>
                    ))}
                  </RadioGroup>
                  <p className="text-xs text-muted">
                    {BASEMAPS.find((b) => b.id === basemapId)?.description}. OpenStreetMap itself
                    only publishes the Standard style and no imagery, so Satellite comes from Esri
                    and the rest from CARTO, OpenTopoMap and HOT — all free and key-free.
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
                      ? "Stops the phone sleeping mid-trip."
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
                    <p className="text-xs text-muted">End the trip before signing out.</p>
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
