import { useEffect } from "react";
import { Button, Modal, Spinner } from "@heroui/react";
import { formatDistance, formatDuration } from "../lib/geo";
import type { DriveSession } from "../lib/types";
import { useTrips } from "../hooks/useTrips";

interface TripsModalProps {
  isOpen: boolean;
  activeTripId: string | null;
  loadingTripId: string | null;
  onSelect: (trip: DriveSession) => void;
  onClose: () => void;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function tripDuration(trip: DriveSession): string {
  if (!trip.ended_at) return "in progress";
  return formatDuration(new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime());
}

export function TripsModal({
  isOpen,
  activeTripId,
  loadingTripId,
  onSelect,
  onClose,
}: TripsModalProps) {
  const { trips, loading, error, refresh } = useTrips();

  // Re-read on every open so a drive you just ended is in the list.
  useEffect(() => {
    if (isOpen) void refresh();
  }, [isOpen, refresh]);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>Past trips</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {loading && trips.length === 0 && (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              )}

              {error && <p className="py-4 text-sm text-danger">{error}</p>}

              {!loading && !error && trips.length === 0 && (
                <p className="py-8 text-center text-sm text-muted">
                  No trips yet. Start a drive and it'll show up here.
                </p>
              )}

              <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                {trips.map((trip) => {
                  const isActive = trip.id === activeTripId;
                  const isLoading = trip.id === loadingTripId;
                  return (
                    <li key={trip.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(trip)}
                        disabled={isLoading}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                          isActive
                            ? "border-accent bg-accent/10"
                            : "border-border bg-default/20 hover:bg-default/40"
                        }`}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm text-foreground">
                            {dateFormat.format(new Date(trip.started_at))}
                          </span>
                          <span className="text-xs text-muted">
                            {formatDistance(trip.distance_m)} · {tripDuration(trip)} ·{" "}
                            {trip.point_count} pts
                          </span>
                        </span>
                        {isLoading && <Spinner size="sm" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
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
