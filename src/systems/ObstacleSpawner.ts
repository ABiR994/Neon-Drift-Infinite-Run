// src/systems/ObstacleSpawner.ts
import * as THREE from 'three';
import { Obstacle } from '../entities/Obstacle';
import { EnemyCar } from '../entities/EnemyCar';
import { ObstaclePool } from './ObstaclePool';
import {
    ROAD_LENGTH,
    LANE_COUNT,
    OBSTACLE_SPAWN_INTERVAL_INITIAL,
    OBSTACLE_SPAWN_INTERVAL_MIN,
    OBSTACLE_SPAWN_INTERVAL_DECREASE_RATE,
    CAR_INITIAL_Z,
    OBSTACLE_PATTERN_CHANCE_DOUBLE,
    GAME_SPEED_MAX
} from '../utils/constants';
import { getRandomInt } from '../utils/helpers';

export class ObstacleSpawner {
    private obstacles: Obstacle[] = [];
    private enemyCars: EnemyCar[] = [];
    private allCollidables: (Obstacle | EnemyCar)[] = [];
    private pool: ObstaclePool;
    private scene: THREE.Scene;
    private timeSinceLastSpawn: number = 0;
    private currentSpawnInterval: number;
    private totalGameTime: number = 0;
    private lastSpawnLanes: number[] = [];
    private lastSpawnZ: number = 0;
    private readonly SAFE_Z_DISTANCE: number = 45; // Minimum Z distance to ensure a continuous path

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.pool = new ObstaclePool(scene);
        this.currentSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
    }

    public update(deltaTime: number, gameSpeed: number, currentTime: DOMHighResTimeStamp): void {
        this.timeSinceLastSpawn += deltaTime;
        this.totalGameTime += deltaTime;

        this.currentSpawnInterval = Math.max(
            OBSTACLE_SPAWN_INTERVAL_MIN,
            OBSTACLE_SPAWN_INTERVAL_INITIAL - (this.totalGameTime * OBSTACLE_SPAWN_INTERVAL_DECREASE_RATE)
        );

        if (this.timeSinceLastSpawn >= this.currentSpawnInterval) {
            this.spawnObstacle(gameSpeed);
            this.timeSinceLastSpawn = 0;
        }

        this.allCollidables = [];

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.update(deltaTime, gameSpeed);
            obstacle.updateVisuals(gameSpeed, currentTime / 1000);

            if (obstacle.isOutOfView()) {
                this.pool.release(obstacle);
                this.obstacles.splice(i, 1);
            } else {
                this.allCollidables.push(obstacle);
            }
        }

        for (let i = this.enemyCars.length - 1; i >= 0; i--) {
            const enemy = this.enemyCars[i];
            enemy.update(deltaTime, gameSpeed);
            if (enemy.isOutOfView()) {
                enemy.dispose(this.scene);
                this.enemyCars.splice(i, 1);
            } else {
                this.allCollidables.push(enemy);
            }
        }
    }

    private spawnObstacle(gameSpeed: number): void {
        const spawnZ = CAR_INITIAL_Z - ROAD_LENGTH - getRandomInt(ROAD_LENGTH / 4, ROAD_LENGTH / 2);
        let availableLanes = Array.from({ length: LANE_COUNT }, (_, i) => i);
        
        if (Math.abs(spawnZ - this.lastSpawnZ) < this.SAFE_Z_DISTANCE && this.lastSpawnLanes.length > 0) {
            const previouslyOpenLanes = availableLanes.filter(lane => !this.lastSpawnLanes.includes(lane));
            if (previouslyOpenLanes.length > 0) {
                const safeLaneIndex = getRandomInt(0, previouslyOpenLanes.length - 1);
                const safeLane = previouslyOpenLanes[safeLaneIndex];
                availableLanes = availableLanes.filter(lane => lane !== safeLane);
            }
        }

        const speedFactor = (gameSpeed - 15) / (GAME_SPEED_MAX - 15);
        const enemySpawnChance = speedFactor * 0.4;
        const spawnedLanes: number[] = [];

        if (Math.random() < enemySpawnChance) {
            const laneIndex = getRandomInt(0, availableLanes.length - 1);
            const lane = availableLanes[laneIndex];
            const enemy = new EnemyCar(this.scene, lane, spawnZ, gameSpeed);
            this.enemyCars.push(enemy);
            spawnedLanes.push(lane);
        } else {
            const patternType = Math.random() < OBSTACLE_PATTERN_CHANCE_DOUBLE ? 'DOUBLE' : 'SINGLE';
            if (patternType === 'SINGLE' || availableLanes.length < 2) {
                const laneIndex = getRandomInt(0, availableLanes.length - 1);
                const lane = availableLanes[laneIndex];
                const obstacle = this.pool.acquire(lane, spawnZ);
                this.obstacles.push(obstacle);
                spawnedLanes.push(lane);
            } else if (patternType === 'DOUBLE') {
                let idx1 = getRandomInt(0, availableLanes.length - 1);
                let idx2 = getRandomInt(0, availableLanes.length - 1);
                while (idx2 === idx1) idx2 = getRandomInt(0, availableLanes.length - 1);
                const lane1 = availableLanes[idx1];
                const lane2 = availableLanes[idx2];
                this.obstacles.push(this.pool.acquire(lane1, spawnZ));
                this.obstacles.push(this.pool.acquire(lane2, spawnZ));
                spawnedLanes.push(lane1, lane2);
            }
        }

        this.lastSpawnLanes = spawnedLanes;
        this.lastSpawnZ = spawnZ;
    }

    public getObstacles(): (Obstacle | EnemyCar)[] {
        return this.allCollidables;
    }

    public reset(): void {
        for (const obstacle of this.obstacles) this.pool.release(obstacle);
        this.obstacles = [];
        for (const enemy of this.enemyCars) enemy.dispose(this.scene);
        this.enemyCars = [];
        this.allCollidables = [];
        this.timeSinceLastSpawn = 0;
        this.currentSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
        this.totalGameTime = 0;
        this.lastSpawnLanes = [];
        this.lastSpawnZ = 0;
    }

    public dispose(): void {
        this.reset();
        this.pool.dispose();
    }
}
