// src/systems/ObstacleSpawner.ts
import * as THREE from 'three';
import { Obstacle } from '../entities/Obstacle';
import { ObstaclePool } from './ObstaclePool';
import {
    ROAD_LENGTH,
    LANE_COUNT,
    OBSTACLE_SPAWN_INTERVAL_INITIAL,
    OBSTACLE_SPAWN_INTERVAL_MIN,
    OBSTACLE_SPAWN_INTERVAL_DECREASE_RATE,
    CAR_INITIAL_Z,
    OBSTACLE_PATTERN_CHANCE_DOUBLE
} from '../utils/constants';
import { getRandomInt } from '../utils/helpers';

export class ObstacleSpawner {
    private obstacles: Obstacle[] = [];
    private pool: ObstaclePool;
    private timeSinceLastSpawn: number = 0;
    private currentSpawnInterval: number;
    private totalGameTime: number = 0;
    private lastSpawnLanes: number[] = [];
    private lastSpawnZ: number = 0;
    private readonly SAFE_Z_DISTANCE: number = 25; // Minimum Z distance to consider obstacles as a "cluster"

    constructor(scene: THREE.Scene) {
        this.pool = new ObstaclePool(scene);
        this.currentSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
    }

    /**
     * Updates the spawner, checking for new spawns and managing existing obstacles.
     * @param deltaTime The time elapsed since the last frame.
     * @param gameSpeed The current speed of the game, influencing obstacle movement.
     * @param currentTime The total elapsed time, for pulsation effects.
     */
    public update(deltaTime: number, gameSpeed: number, currentTime: DOMHighResTimeStamp): void {
        this.timeSinceLastSpawn += deltaTime;
        this.totalGameTime += deltaTime;

        // Decrease spawn interval over time to increase difficulty
        this.currentSpawnInterval = Math.max(
            OBSTACLE_SPAWN_INTERVAL_MIN,
            OBSTACLE_SPAWN_INTERVAL_INITIAL - (this.totalGameTime * OBSTACLE_SPAWN_INTERVAL_DECREASE_RATE)
        );

        // Spawn a new obstacle if enough time has passed
        if (this.timeSinceLastSpawn >= this.currentSpawnInterval) {
            this.spawnObstacle();
            this.timeSinceLastSpawn = 0;
        }

        // Update existing obstacles and release those out of view back to pool
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.update(deltaTime, gameSpeed);
            obstacle.updateVisuals(gameSpeed, currentTime / 1000);

            if (obstacle.isOutOfView()) {
                this.pool.release(obstacle);
                this.obstacles.splice(i, 1);
            }
        }
    }

    /**
     * Spawns a new obstacle in a random lane ahead of the player.
     * Uses object pooling to reduce garbage collection.
     */
    private spawnObstacle(): void {
        const spawnZ = CAR_INITIAL_Z - ROAD_LENGTH - getRandomInt(ROAD_LENGTH / 4, ROAD_LENGTH / 2);
        
        // Determine which lanes are "fair" to spawn in
        let availableLanes = Array.from({ length: LANE_COUNT }, (_, i) => i);
        
        // If this spawn is too close to the last one, don't block the lane that was left open
        if (Math.abs(spawnZ - this.lastSpawnZ) < this.SAFE_Z_DISTANCE && this.lastSpawnLanes.length > 0) {
            // Find lanes that were NOT blocked in the last spawn
            const previouslyOpenLanes = availableLanes.filter(lane => !this.lastSpawnLanes.includes(lane));
            
            // If we have limited open lanes, make sure we don't block them all now
            if (previouslyOpenLanes.length === 1) {
                // The single open lane must stay open if we are too close
                availableLanes = availableLanes.filter(lane => lane !== previouslyOpenLanes[0]);
            }
        }

        // Determine obstacle pattern
        const patternType = Math.random() < OBSTACLE_PATTERN_CHANCE_DOUBLE ? 'DOUBLE' : 'SINGLE';
        const spawnedLanes: number[] = [];

        if (patternType === 'SINGLE' || availableLanes.length < 2) {
            const laneIndex = getRandomInt(0, availableLanes.length - 1);
            const lane = availableLanes[laneIndex];
            const obstacle = this.pool.acquire(lane, spawnZ);
            this.obstacles.push(obstacle);
            spawnedLanes.push(lane);
        } else if (patternType === 'DOUBLE') {
            // Pick two different lanes from available ones
            let idx1 = getRandomInt(0, availableLanes.length - 1);
            let idx2 = getRandomInt(0, availableLanes.length - 1);
            while (idx2 === idx1) {
                idx2 = getRandomInt(0, availableLanes.length - 1);
            }
            
            const lane1 = availableLanes[idx1];
            const lane2 = availableLanes[idx2];
            
            this.obstacles.push(this.pool.acquire(lane1, spawnZ));
            this.obstacles.push(this.pool.acquire(lane2, spawnZ));
            spawnedLanes.push(lane1, lane2);
        }

        this.lastSpawnLanes = spawnedLanes;
        this.lastSpawnZ = spawnZ;
    }

    /**
     * Returns an array of currently active obstacles.
     */
    public getObstacles(): Obstacle[] {
        return this.obstacles;
    }

    /**
     * Resets the spawner's state and releases all active obstacles back to the pool.
     */
    public reset(): void {
        // Release all active obstacles back to the pool
        for (const obstacle of this.obstacles) {
            this.pool.release(obstacle);
        }
        this.obstacles = [];
        this.timeSinceLastSpawn = 0;
        this.currentSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
        this.totalGameTime = 0;
        this.lastSpawnLanes = [];
        this.lastSpawnZ = 0;
    }

    /**
     * Disposes of all resources managed by the spawner including the pool.
     */
    public dispose(): void {
        // Release active obstacles to pool first
        for (const obstacle of this.obstacles) {
            this.pool.release(obstacle);
        }
        this.obstacles = [];
        // Now dispose the pool entirely
        this.pool.dispose();
    }
}
