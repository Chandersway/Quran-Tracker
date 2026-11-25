import type { CanonicalMushafWord } from '../../../domain/selectableMushaf';

export type MushafTouch = {
  x: number;
  y: number;
  /** Wall clock, also used by the existing word-press callbacks. */
  time: number;
  /** Native event clock: avoids deriving swipe speed from delayed JS delivery. */
  timestamp?: number;
  touches: number;
};
export type MushafPageBounds = { left: number; width: number };
export type MushafSwipeMetrics = {
  /** Position at DOWN relative to the actual page, in density-independent units. */
  startX: number;
  pageWidth: number;
  dx: number;
  dy: number;
  elapsed: number;
  /** Delay before movement first exceeds tap slop, measured from DOWN. */
  movementDelay: number;
  maximumX: number;
  maximumY: number;
  maximumDistance: number;
  horizontalTravel: number;
  verticalTravel: number;
};

// The native observer supplies measurements to this same policy. Keep all
// recognition thresholds here: distances are dp/points, time ms, speed dp/s.
export const MUSHAF_GESTURE = {
  maxDuration: 400,
  maxEdgePanDuration: 800,
  maxMovementDelay: 180,
  minDistance: 64,
  maxTapDistance: 12,
  axisRatio: 3,
  straightness: 0.85,
  edgeFraction: 0.18,
  minEdge: 32,
  maxEdge: 72,
  fastEdgeFraction: 0.55,
  widenFromSpeed: 600,
  widenFullyAtSpeed: 1400,
  interiorExtraDistance: 32,
};

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));
const elapsedTouchTime = (start: MushafTouch, point: MushafTouch) =>
  Number.isFinite(point.timestamp) && Number.isFinite(start.timestamp)
    ? point.timestamp! - start.timestamp!
    : point.time - start.time;

/** A passive, shared classifier for both native text and printed-page touches. */
export function mushafSwipeDirection(
  motion: MushafSwipeMetrics,
  edges = { top: false, bottom: false },
): 1 | -1 | null {
  const {
    dx,
    dy,
    elapsed,
    movementDelay,
    maximumX,
    maximumY,
    maximumDistance,
    horizontalTravel,
    verticalTravel,
  } = motion;
  if (
    ![
      dx,
      dy,
      elapsed,
      movementDelay,
      maximumX,
      maximumY,
      maximumDistance,
      horizontalTravel,
      verticalTravel,
    ].every(Number.isFinite) ||
    elapsed <= 0 ||
    elapsed > MUSHAF_GESTURE.maxEdgePanDuration
  )
    return null;
  const distanceX = Math.abs(dx);
  const distanceY = Math.abs(dy);
  const horizontal =
    distanceX >= MUSHAF_GESTURE.minDistance &&
    distanceX >= maximumY * MUSHAF_GESTURE.axisRatio &&
    distanceX >= maximumDistance * MUSHAF_GESTURE.straightness &&
    distanceX >= horizontalTravel * MUSHAF_GESTURE.straightness;
  if (horizontal) {
    const { startX, pageWidth } = motion;
    if (!Number.isFinite(startX) || !Number.isFinite(pageWidth) || pageWidth <= 0) return null;
    if (startX < 0 || startX > pageWidth) return null;
    // Arabic pages advance from the left edge toward the right; reverse from
    // the right edge. Use DOWN, never the finger's eventual release position.
    const originDistance = dx > 0 ? startX : pageWidth - startX;
    const widestEdge = pageWidth * MUSHAF_GESTURE.fastEdgeFraction;
    const normalEdge = Math.min(
      widestEdge,
      Math.max(
        MUSHAF_GESTURE.minEdge,
        Math.min(MUSHAF_GESTURE.maxEdge, pageWidth * MUSHAF_GESTURE.edgeFraction),
      ),
    );
    // Longer edge pans are intentional only when motion began promptly.
    // Holding still and flicking late must remain available to text selection.
    if (
      elapsed > MUSHAF_GESTURE.maxDuration &&
      (originDistance > normalEdge || movementDelay > MUSHAF_GESTURE.maxMovementDelay)
    )
      return null;
    const speed = (distanceX * 1000) / elapsed;
    const speedProgress = clampUnit(
      (speed - MUSHAF_GESTURE.widenFromSpeed) /
        (MUSHAF_GESTURE.widenFullyAtSpeed - MUSHAF_GESTURE.widenFromSpeed),
    );
    const allowedEdge = normalEdge + (widestEdge - normalEdge) * speedProgress;
    if (originDistance > allowedEdge) return null;
    // A fast middle flick needs more actual travel than an edge swipe. Speed
    // widens the edge envelope; it never replaces the displacement requirement.
    const inwardProgress =
      widestEdge > normalEdge
        ? clampUnit((originDistance - normalEdge) / (widestEdge - normalEdge))
        : 0;
    if (
      distanceX <
      MUSHAF_GESTURE.minDistance + MUSHAF_GESTURE.interiorExtraDistance * inwardProgress
    )
      return null;
    return dx > 0 ? 1 : -1;
  }
  if (
    elapsed <= MUSHAF_GESTURE.maxDuration &&
    distanceY >= MUSHAF_GESTURE.minDistance &&
    distanceY >= maximumX * MUSHAF_GESTURE.axisRatio &&
    distanceY >= maximumDistance * MUSHAF_GESTURE.straightness &&
    distanceY >= verticalTravel * MUSHAF_GESTURE.straightness &&
    ((dy < 0 && edges.bottom) || (dy > 0 && edges.top))
  )
    return dy < 0 ? 1 : -1;
  return null;
}

/** Passive classification only: this never claims the responder from native text selection. */
export function createMushafTextGesture() {
  let touch: {
    start: MushafTouch;
    previous: MushafTouch;
    startX: number;
    pageWidth: number;
    distance: number;
    maximumX: number;
    maximumY: number;
    horizontalTravel: number;
    verticalTravel: number;
    movementDelay: number | null;
    blocked: boolean;
    longPress: boolean;
    ended: boolean;
  } | null = null;
  let word: { id: number; time: number; longPress: boolean } | null = null;
  let selection = false;
  return {
    start(point: MushafTouch, bounds?: MushafPageBounds | null) {
      const started = {
        start: point,
        previous: point,
        startX: Number.NaN,
        pageWidth: 0,
        distance: 0,
        maximumX: 0,
        maximumY: 0,
        horizontalTravel: 0,
        verticalTravel: 0,
        movementDelay: null as number | null,
        blocked: point.touches !== 1 || selection,
        longPress: false,
        ended: false,
      };
      touch = started;
      word = null;
      // React Native's measure callback is asynchronous. Capture this gesture
      // so a late measurement cannot change a new gesture or revive a release.
      const setPageBounds = (measured: MushafPageBounds | null | undefined) => {
        if (touch !== started || started.ended || started.blocked || !measured) return;
        started.startX = point.x - measured.left;
        started.pageWidth = measured.width;
      };
      setPageBounds(bounds);
      return setPageBounds;
    },
    move(point: MushafTouch) {
      if (!touch || touch.ended) return;
      touch.distance = Math.max(
        touch.distance,
        Math.hypot(point.x - touch.start.x, point.y - touch.start.y),
      );
      touch.maximumX = Math.max(touch.maximumX, Math.abs(point.x - touch.start.x));
      touch.maximumY = Math.max(touch.maximumY, Math.abs(point.y - touch.start.y));
      if (touch.movementDelay === null && touch.distance > MUSHAF_GESTURE.maxTapDistance)
        touch.movementDelay = elapsedTouchTime(touch.start, point);
      touch.horizontalTravel += Math.abs(point.x - touch.previous.x);
      touch.verticalTravel += Math.abs(point.y - touch.previous.y);
      touch.previous = point;
      if (point.touches > 1) touch.blocked = true;
    },
    end(point: MushafTouch, edges = { top: false, bottom: false }): 1 | -1 | null {
      if (!touch || touch.ended) return null;
      this.move(point);
      touch.ended = true;
      const { start } = touch;
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      const elapsed = elapsedTouchTime(start, point);
      if (touch.blocked || touch.longPress || selection || word?.longPress) return null;
      return mushafSwipeDirection(
        {
          startX: touch.startX,
          pageWidth: touch.pageWidth,
          dx,
          dy,
          elapsed,
          movementDelay: touch.movementDelay ?? elapsed,
          maximumX: touch.maximumX,
          maximumY: touch.maximumY,
          maximumDistance: touch.distance,
          horizontalTravel: touch.horizontalTravel,
          verticalTravel: touch.verticalTravel,
        },
        edges,
      );
    },
    cancel() {
      if (touch) touch.blocked = true;
      word = null;
    },
    selection(active: boolean) {
      selection = active;
      if (active && touch && !touch.ended) touch.blocked = true;
    },
    wordStart(id: number, time: number) {
      word = { id, time, longPress: false };
    },
    longPress() {
      if (word) word.longPress = true;
      // Android can deliver a span's pressIn before the ancestor raw-start.
      // The native-selection guard must belong to the touch, not only that span record.
      if (touch) touch.longPress = true;
    },
    wordTap(id: number, time: number) {
      const press = word;
      const completedTouch = touch;
      word = null;
      // Consume the touch with its Pressability callback. A later screen-reader
      // activation has no raw-touch sequence and must not inherit this hold/drag.
      touch = null;
      if (
        selection ||
        completedTouch?.blocked ||
        completedTouch?.longPress ||
        (completedTouch && time - completedTouch.start.time >= 450) ||
        (completedTouch?.distance ?? 0) > MUSHAF_GESTURE.maxTapDistance
      )
        return false;
      // Accessibility activation can invoke onPress without a preceding touch.
      return !press || (press.id === id && !press.longPress && time - press.time < 450);
    },
  };
}

export function sameMushafWord(a: CanonicalMushafWord | null | undefined, b: CanonicalMushafWord) {
  return a?.surah === b.surah && a.ayah === b.ayah && a.word === b.word;
}
