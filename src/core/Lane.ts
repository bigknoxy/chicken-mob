/**
 * Lane — Geometry helpers for lane-based positioning.
 *
 * The game area is a portrait canvas. Lanes run vertically from
 * the cannon (bottom) to the fort (top). Multiple lanes are spaced
 * evenly across the horizontal width.
 *
 * Position 0.0 = cannon end (bottom), 1.0 = fort end (top).
 */

export interface LaneGeometry {
    /** Number of lanes */
    count: number;
    /** Canvas width */
    canvasWidth: number;
    /** Canvas height */
    canvasHeight: number;
    /** Top margin (where fort sits) */
    topMargin: number;
    /** Bottom margin (where cannon sits) */
    bottomMargin: number;
}

/** Get the horizontal center X for a lane index */
export function laneX(geo: LaneGeometry, lane: number): number {
    const laneWidth = geo.canvasWidth / geo.count;
    return laneWidth * lane + laneWidth / 2;
}

/** Get the width of each lane */
export function laneWidth(geo: LaneGeometry): number {
    return geo.canvasWidth / geo.count;
}

/** Convert a lane position (0..1) to screen Y coordinate */
export function positionToY(geo: LaneGeometry, position: number): number {
    const playAreaTop = geo.topMargin;
    const playAreaBottom = geo.canvasHeight - geo.bottomMargin;
    const playAreaHeight = playAreaBottom - playAreaTop;
    // position 0 = bottom (cannon), position 1 = top (fort)
    return playAreaBottom - position * playAreaHeight;
}

/** Convert screen Y back to lane position (0..1) */
export function yToPosition(geo: LaneGeometry, y: number): number {
    const playAreaTop = geo.topMargin;
    const playAreaBottom = geo.canvasHeight - geo.bottomMargin;
    const playAreaHeight = playAreaBottom - playAreaTop;
    return (playAreaBottom - y) / playAreaHeight;
}

/** Get the X range for a lane (left edge, right edge) */
export function laneBounds(geo: LaneGeometry, lane: number): [number, number] {
    const w = laneWidth(geo);
    return [w * lane, w * (lane + 1)];
}

/** Create a LaneGeometry from canvas dimensions and lane count */
export function createLaneGeometry(
    canvasWidth: number,
    canvasHeight: number,
    laneCount: number,
): LaneGeometry {
    return {
        count: laneCount,
        canvasWidth,
        canvasHeight,
        topMargin: canvasHeight * 0.08,    // 8% for fort / HUD
        bottomMargin: canvasHeight * 0.12, // 12% for cannon area
    };
}
