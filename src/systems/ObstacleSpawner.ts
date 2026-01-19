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

        // Determine obstacle pattern
        const patternType = Math.random() < OBSTACLE_PATTERN_CHANCE_DOUBLE ? 'DOUBLE' : 'SINGLE';

        if (patternType === 'SINGLE') {
            const randomLane = getRandomInt(0, LANE_COUNT - 1);
            const obstacle = this.pool.acquire(randomLane, spawnZ);
            this.obstacles.push(obstacle);
        } else if (patternType === 'DOUBLE') {
            // Ensure there are at least 2 lanes for a double obstacle
            if (LANE_COUNT >= 2) {
                let lane1 = getRandomInt(0, LANE_COUNT - 1);
                let lane2 = getRandomInt(0, LANE_COUNT - 1);

                // Ensure two different lanes are selected
                while (lane2 === lane1) {
                    lane2 = getRandomInt(0, LANE_COUNT - 1);
                }

                this.obstacles.push(this.pool.acquire(lane1, spawnZ));
                this.obstacles.push(this.pool.acquire(lane2, spawnZ));
            } else {
                // Fallback to single if not enough lanes for double
                const randomLane = getRandomInt(0, LANE_COUNT - 1);
                const obstacle = this.pool.acquire(randomLane, spawnZ);
                this.obstacles.push(obstacle);
            }
        }
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
