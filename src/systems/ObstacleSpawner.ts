// src/systems/ObstacleSpawner.ts
import * as THREE from 'three';
import { Obstacle } from '../entities/Obstacle';
import {
    ROAD_LENGTH,
    LANE_COUNT,
    OBSTACLE_SPAWN_INTERVAL_INITIAL,
    OBSTACLE_SPAWN_INTERVAL_MIN,
    OBSTACLE_SPAWN_INTERVAL_DECREASE_RATE,
    CAR_INITIAL_Z,
    OBSTACLE_PATTERN_CHANCE_DOUBLE, // Import new constant
    OBSTACLE_TYPE_BARRIER, OBSTACLE_TYPE_ENERGY_WALL, OBSTACLE_TYPE_HOLO_BLOCK // Import new obstacle types
} from '../utils/constants';
import { getRandomInt } from '../utils/helpers'; // Only getRandomInt is used from helpers

export class ObstacleSpawner {
    private scene: THREE.Scene;
    private obstacles: Obstacle[] = [];
    private timeSinceLastSpawn: number = 0;
    private currentSpawnInterval: number;
    private totalGameTime: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
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
            this.spawnObstacle(currentTime / 1000); // Pass current time in seconds
            this.timeSinceLastSpawn = 0;
        }

        // Update existing obstacles and remove those out of view
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.update(deltaTime, gameSpeed, currentTime / 1000); // Pass current time for obstacle visuals

            if (obstacle.isOutOfView()) {
                obstacle.dispose(this.scene);
                this.obstacles.splice(i, 1);
            }
        }
    }

    /**
     * Spawns a new obstacle in a random lane ahead of the player.
     * The Z position is calculated to be sufficiently far ahead of the camera.
     * @param time The current game time for obstacle spawn effects.
     */
    private spawnObstacle(time: number): void {
        const spawnZ = CAR_INITIAL_Z - ROAD_LENGTH - getRandomInt(ROAD_LENGTH / 4, ROAD_LENGTH / 2);

        // Determine obstacle pattern
        const patternType = Math.random() < OBSTACLE_PATTERN_CHANCE_DOUBLE ? 'DOUBLE' : 'SINGLE';

        // Randomly select an obstacle type for the new obstacle(s)
        const obstacleTypes = [OBSTACLE_TYPE_BARRIER, OBSTACLE_TYPE_ENERGY_WALL, OBSTACLE_TYPE_HOLO_BLOCK];
        const randomObstacleType = obstacleTypes[getRandomInt(0, obstacleTypes.length - 1)];

        if (patternType === 'SINGLE') {
            const randomLane = getRandomInt(0, LANE_COUNT - 1);
            const newObstacle = new Obstacle(this.scene, randomLane, spawnZ, randomObstacleType, time);
            this.obstacles.push(newObstacle);
        } else if (patternType === 'DOUBLE') {
            // Ensure there are at least 2 lanes for a double obstacle
            if (LANE_COUNT >= 2) {
                let lane1 = getRandomInt(0, LANE_COUNT - 1);
                let lane2 = getRandomInt(0, LANE_COUNT - 1);

                // Ensure two different lanes are selected
                while (lane2 === lane1) {
                    lane2 = getRandomInt(0, LANE_COUNT - 1);
                }

                this.obstacles.push(new Obstacle(this.scene, lane1, spawnZ, randomObstacleType, time));
                this.obstacles.push(new Obstacle(this.scene, lane2, spawnZ, randomObstacleType, time));
            } else {
                // Fallback to single if not enough lanes for double
                const randomLane = getRandomInt(0, LANE_COUNT - 1);
                const newObstacle = new Obstacle(this.scene, randomLane, spawnZ, randomObstacleType, time);
                this.obstacles.push(newObstacle);
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
     * Resets the spawner's state and clears all active obstacles from the scene.
     */
    public reset(): void {
        this.obstacles.forEach(obstacle => obstacle.dispose(this.scene));
        this.obstacles = [];
        this.timeSinceLastSpawn = 0;
        this.currentSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
        this.totalGameTime = 0;
    }

    /**
     * Disposes of all resources managed by the spawner.
     * Currently, this reuses the reset logic.
     */
    public dispose(): void {
        this.reset();
    }
}
