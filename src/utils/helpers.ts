// src/utils/helpers.ts

import { GAME_SPEED_INITIAL, GAME_SPEED_MAX, ROAD_WIDTH, LANE_WIDTH } from './constants';

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param min The minimum value.
 * @param max The maximum value.
 */
export function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Linearly interpolates between two values.
 * @param a Start value.
 * @param b End value.
 * @param t Interpolation factor (0.0 to 1.0).
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Clamps a value between a minimum and maximum.
 * @param value The value to clamp.
 * @param min The minimum allowed value.
 * @param max The maximum allowed value.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

/**
 * Calculates the X position for the center of a given lane.
 * @param laneIndex The 0-indexed lane number (0 for leftmost).
 * @returns The X coordinate for the center of the lane.
 */
export function getLanePositionX(laneIndex: number): number {
    const roadLeftEdge = -ROAD_WIDTH / 2;
    return roadLeftEdge + (laneIndex * LANE_WIDTH) + (LANE_WIDTH / 2);
}

/**
 * Calculates the normalized speed factor (0 to 1) based on current speed.
 * @param speed The current game speed.
 * @returns A value between 0 and 1 representing the speed progression.
 */
export function getNormalizedSpeed(speed: number): number {
    const normalizedSpeed = (speed - GAME_SPEED_INITIAL) / (GAME_SPEED_MAX - GAME_SPEED_INITIAL);
    return clamp(normalizedSpeed, 0, 1);
}
