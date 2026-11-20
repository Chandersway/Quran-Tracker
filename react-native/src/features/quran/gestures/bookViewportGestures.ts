import type { GestureResponderEvent } from 'react-native';

type Point = { x: number; y: number; distance: number; count: number; ids: string };
type Viewport = {
  zoom: number;
  selection: boolean;
  blocked: boolean;
  pinchEnabled?: boolean;
  x: number;
  y: number;
  maximumX: number;
  maximumY: number;
  geometry?: {
    left: number;
    top: number;
    insetX: number;
    insetY: number;
    width: number;
    height: number;
  };
};

const clamp = (value: number, maximum: number) => Math.max(0, Math.min(maximum, value));
function point(event: GestureResponderEvent): Point | null {
  const touches = event.nativeEvent.touches;
  const first = touches[0];
  if (!first) return null;
  const second = touches[1];
  const x = second ? (first.pageX + second.pageX) / 2 : first.pageX;
  const y = second ? (first.pageY + second.pageY) / 2 : first.pageY;
  const distance = second ? Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY) : 0;
  return [x, y, distance].every(Number.isFinite)
    ? {
        x,
        y,
        distance,
        count: touches.length,
        ids: touches
          .map((touch) => touch.identifier)
          .sort()
          .join(':'),
      }
    : null;
}

/**
 * One owner for both axes only while browsing an enlarged page. Selection's
 * text/handle events remain entirely native. Pinch is opt-in for sources that
 * can resize without remounting native text; one-finger page swipes at 1x pass on.
 */
export function createBookViewportGesture(port: {
  state(): Viewport;
  scroll(x: number, y: number): void;
  zoom(value: number): void;
  claimed(): void;
}) {
  let start: { point: Point; view: Viewport } | null = null;
  let owned = false;
  let requested = false;
  let pinch: { x: number; y: number; point: Point; zoom: number; measured: boolean } | null = null;
  const begin = (event: GestureResponderEvent) => {
    const next = point(event);
    const view = port.state();
    start = next
      ? {
          point: next,
          view: { ...view, geometry: view.geometry ? { ...view.geometry } : undefined },
        }
      : null;
    pinch = null;
  };
  // Layout arrives after the zoom state update. Reapply the same source-relative
  // focal point to measured dimensions, including any rail/gutter changes.
  const layout = () => {
    const view = port.state();
    const geometry = view.geometry;
    if (!pinch || view.blocked || view.selection || !geometry) return;
    if (view.zoom !== pinch.zoom) {
      if (pinch.measured) pinch = null;
      return;
    }
    pinch.measured = true;
    port.scroll(
      clamp(
        pinch.x * geometry.width + geometry.insetX - (pinch.point.x - geometry.left),
        view.maximumX,
      ),
      clamp(
        pinch.y * geometry.height + geometry.insetY - (pinch.point.y - geometry.top),
        view.maximumY,
      ),
    );
  };
  const allowed = (next: Point) => {
    const view = port.state();
    return (
      !view.blocked &&
      !view.selection &&
      ((next.count === 2 && view.pinchEnabled !== false) || (next.count === 1 && view.zoom > 1))
    );
  };
  const apply = (event: GestureResponderEvent) => {
    if (!owned || !start) return;
    const next = point(event);
    if (!next || !allowed(next)) {
      cancel();
      return;
    }
    if (start.point.ids !== next.ids) {
      begin(event);
      return;
    }
    if (next.count === 2 && start.point.distance > 8) {
      const zoom =
        Math.round(clamp((start.view.zoom * next.distance) / start.point.distance, 3) * 100) / 100;
      const geometry = start.view.geometry;
      if (geometry && geometry.width > 0 && geometry.height > 0) {
        pinch = {
          x: (start.view.x + start.point.x - geometry.left - geometry.insetX) / geometry.width,
          y: (start.view.y + start.point.y - geometry.top - geometry.insetY) / geometry.height,
          point: next,
          zoom: Math.max(1, zoom),
          measured: false,
        };
      }
      port.zoom(Math.max(1, zoom));
    }
    if (pinch) {
      layout();
      return;
    }
    const view = port.state();
    port.scroll(
      clamp(start.view.x + start.point.x - next.x, view.maximumX),
      clamp(start.view.y + start.point.y - next.y, view.maximumY),
    );
  };
  const cancel = () => {
    start = null;
    owned = false;
    requested = false;
    pinch = null;
  };
  return {
    cancel,
    layout,
    get active() {
      return owned;
    },
    handlers: {
      onTouchStart(event: GestureResponderEvent) {
        const next = point(event);
        if (next && !allowed(next) && owned) cancel();
        else if (!owned || !start || next?.ids !== start.point.ids) begin(event);
      },
      onStartShouldSetResponderCapture(event: GestureResponderEvent) {
        const next = point(event);
        if (!next || next.count !== 2 || !allowed(next)) return false;
        begin(event);
        requested = true;
        return true;
      },
      onMoveShouldSetResponderCapture(event: GestureResponderEvent) {
        const next = point(event);
        if (!start || !next || !allowed(next)) return false;
        requested =
          next.count === 2 || Math.hypot(next.x - start.point.x, next.y - start.point.y) > 6;
        return requested;
      },
      onResponderGrant(event: GestureResponderEvent) {
        const next = point(event);
        if (!requested || !start || !next || !allowed(next)) return;
        owned = true;
        requested = false;
        port.claimed();
        apply(event);
      },
      onResponderMove: apply,
      onResponderRelease() {
        // A final pinch layout can arrive after UP; its measured focal restore
        // remains valid until a new gesture or an explicit lifecycle cancel.
        start = null;
        owned = false;
        requested = false;
      },
      onResponderTerminate: cancel,
      onResponderReject: cancel,
      onResponderTerminationRequest: () => !owned,
      onTouchCancel: cancel,
    },
  };
}
