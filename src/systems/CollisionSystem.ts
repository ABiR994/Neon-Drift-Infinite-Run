// src/systems/CollisionSystem.ts
import * as THREE from 'three';
import { Car } from '../entities/Car';
import { Obstacle } from '../entities/Obstacle';
import { NEAR_MISS_DISTANCE, CAR_WIDTH, PERFECT_DODGE_DISTANCE } from '../utils/constants';

export class CollisionSystem {
    private car: Car;
    private obstacles: Obstacle[];
    private onCollisionCallback: () => void; // Callback to notify when a collision occurs
    private onNearMissCallback: () => void; // Callback to notify when a near miss occurs
    private onPerfectDodgeCallback: () => void; // Callback to notify when a perfect dodge occurs
    private lastNearMissObstacle: Obstacle | null = null; // Track the last obstacle for near/perfect miss
    private lastNearMissFrame: number = -1; // To prevent multiple near miss triggers per obstacle per frame

    constructor(car: Car, obstacles: Obstacle[], onCollision: () => void, onNearMiss: () => void, onPerfectDodge: () => void) {
        this.car = car;
        this.obstacles = obstacles;
        this.onCollisionCallback = onCollision;
        this.onNearMissCallback = onNearMiss;
        this.onPerfectDodgeCallback = onPerfectDodge;
    }

    /**
     * Checks for collisions between the player's car and all active obstacles.
     * Also checks for near-misses and perfect dodges to provide additional player feedback.
     * If a collision is detected, the registered `onCollisionCallback` is invoked,
     * signaling the game to enter a 'game over' state.
     */
    public update(): void {
        let nearMissDetectedThisFrame = false;
        let perfectDodgeDetectedThisFrame = false;

        // Iterate through each obstacle to check for potential collisions and near misses with the car
        for (const obstacle of this.obstacles) {
            // THREE.Box3.intersectsBox performs an AABB (Axis-Aligned Bounding Box) intersection test
            if (this.car.collider.intersectsBox(obstacle.collider)) {
                // Collision detected! Invoke the callback and immediately exit.
                this.onCollisionCallback();
                return;
            }

            // --- Near Miss and Perfect Dodge Logic ---
            // Only check if not already colliding and not already triggered for this obstacle in this frame
            if (obstacle !== this.lastNearMissObstacle || this.lastNearMissFrame !== performance.now()) {
                const obstacleDepth = (obstacle.mesh.geometry as THREE.BoxGeometry).parameters.depth;
                const carDepth = (this.car.mesh.geometry as THREE.BoxGeometry).parameters.depth;
                const obstacleWidth = (obstacle.mesh.geometry as THREE.BoxGeometry).parameters.width;

                // Calculate overlap in Z-axis (how much the car has passed the obstacle)
                const carFrontZ = this.car.mesh.position.z + carDepth / 2;
                const carBackZ = this.car.mesh.position.z - carDepth / 2;
                const obstacleFrontZ = obstacle.mesh.position.z + obstacleDepth / 2;
                const obstacleBackZ = obstacle.mesh.position.z - obstacleDepth / 2;

                const zOverlapFront = Math.max(0, obstacleFrontZ - carBackZ);
                const zOverlapBack = Math.max(0, carFrontZ - obstacleBackZ);

                // For near/perfect miss, we care when the car is just passing the obstacle
                const isCarPassingObstacle = carFrontZ > obstacleFrontZ && carBackZ < obstacleBackZ; // Car is fully covering obstacle in Z

                // If the car has passed the obstacle's front edge, and is within the near miss range behind it
                const distanceBehindObstacle = this.car.mesh.position.z - obstacle.mesh.position.z;

                if (distanceBehindObstacle > 0 && distanceBehindObstacle < NEAR_MISS_DISTANCE) {
                    // Check lateral distance
                    const lateralDistance = Math.abs(this.car.mesh.position.x - obstacle.mesh.position.x);
                    const combinedHalfWidths = (CAR_WIDTH / 2) + (obstacleWidth / 2);

                    const gap = lateralDistance - combinedHalfWidths;

                    if (gap < NEAR_MISS_DISTANCE && gap > -combinedHalfWidths) { // If there's a small gap
                        if (gap <= PERFECT_DODGE_DISTANCE) {
                            perfectDodgeDetectedThisFrame = true;
                        } else {
                            nearMissDetectedThisFrame = true;
                        }
                        this.lastNearMissObstacle = obstacle;
                        this.lastNearMissFrame = performance.now();
                    }
                }
            }
        }
        if (perfectDodgeDetectedThisFrame) {
            this.onPerfectDodgeCallback();
        } else if (nearMissDetectedThisFrame) {
            this.onNearMissCallback();
        }
    }

    /**
     * Updates the internal list of obstacles that the system will check against.
     * This method is crucial as obstacles are dynamically spawned and removed from the scene.
     * @param obstacles The current array of active `Obstacle` instances in the game.
     */
    public setObstacles(obstacles: Obstacle[]): void {
        this.obstacles = obstacles;
    }

    /**
     * Resets the collision system to its initial state.
     */
    public reset(): void {
        this.obstacles = []; // Clear the list of obstacles upon reset
        this.lastNearMissObstacle = null;
        this.lastNearMissFrame = -1;
    }

    /**
     * Disposes of any resources held by the collision system.
     */
    public dispose(): void {
        // No specific resources to dispose of in this system.
    }
}

