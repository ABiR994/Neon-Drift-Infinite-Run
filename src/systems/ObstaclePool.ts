// src/systems/ObstaclePool.ts
import * as THREE from 'three';
import { Obstacle } from '../entities/Obstacle';

/**
 * Object pool for Obstacle instances to reduce garbage collection pressure.
 * Instead of creating and destroying obstacles, we reuse them from a pool.
 */
export class ObstaclePool {
    private pool: Obstacle[] = [];
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    /**
     * Acquires an obstacle from the pool or creates a new one if the pool is empty.
     * @param lane The lane index for the obstacle.
     * @param spawnZ The Z position to spawn the obstacle at.
     * @returns An Obstacle instance ready to use.
     */
    public acquire(lane: number, spawnZ: number): Obstacle {
        if (this.pool.length > 0) {
            const obstacle = this.pool.pop()!;
            obstacle.reset(lane, spawnZ);
            this.scene.add(obstacle.mesh);
            return obstacle;
        }
        return new Obstacle(this.scene, lane, spawnZ);
    }

    /**
     * Releases an obstacle back to the pool for reuse.
     * @param obstacle The obstacle to release.
     */
    public release(obstacle: Obstacle): void {
        this.scene.remove(obstacle.mesh);
        this.pool.push(obstacle);
    }

    /**
     * Disposes of all obstacles in the pool.
     */
    public dispose(): void {
        for (const obstacle of this.pool) {
            obstacle.dispose(this.scene);
        }
        this.pool = [];
    }

    /**
     * Returns the current pool size.
     */
    public getPoolSize(): number {
        return this.pool.length;
    }
}
