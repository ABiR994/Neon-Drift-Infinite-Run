// src/systems/CollisionSystem.ts
import { Car } from '../entities/Car';
import { Obstacle } from '../entities/Obstacle';
import { NEAR_MISS_DISTANCE, CAR_WIDTH, CAR_DEPTH, OBSTACLE_WIDTH, OBSTACLE_DEPTH } from '../utils/constants';

export class CollisionSystem {
    private car: Car;
    private obstacles: Obstacle[];
    private onCollisionCallback: () => void; // Callback to notify when a collision occurs
    private onNearMissCallback: () => void; // Callback to notify when a near miss occurs

    constructor(car: Car, obstacles: Obstacle[], onCollision: () => void, onNearMiss: () => void) {
        this.car = car;
        this.obstacles = obstacles;
        this.onCollisionCallback = onCollision;
        this.onNearMissCallback = onNearMiss;
    }

    /**
     * Checks for collisions between the player's car and all active obstacles.
     * Also checks for near-misses to provide additional player feedback.
     * If a collision is detected, the registered `onCollisionCallback` is invoked,
     * signaling the game to enter a 'game over' state.
     */
    public update(): void {
        let nearMissDetectedThisFrame = false;

        // Iterate through each obstacle to check for potential collisions and near misses with the car
        for (const obstacle of this.obstacles) {
            // THREE.Box3.intersectsBox performs an AABB (Axis-Aligned Bounding Box) intersection test
            if (this.car.collider.intersectsBox(obstacle.collider)) {
                // Collision detected! Invoke the callback and immediately exit.
                // We only care about the first collision in a frame.
                this.onCollisionCallback();
                return;
            }

            // Check for near miss: If the car and obstacle are close but not colliding
            // Only check if not already colliding
            if (!nearMissDetectedThisFrame) { // Check only once per frame
                // Use constants for dimensions since car mesh is a Group
                const zDistance = Math.abs(this.car.mesh.position.z - obstacle.mesh.position.z) - (CAR_DEPTH / 2) - (OBSTACLE_DEPTH / 2);
                const xDistance = Math.abs(this.car.mesh.position.x - obstacle.mesh.position.x) - (CAR_WIDTH / 2) - (OBSTACLE_WIDTH / 2);

                if (zDistance < NEAR_MISS_DISTANCE && zDistance > -NEAR_MISS_DISTANCE / 2 && // Close in Z, but car hasn't fully passed yet
                    xDistance < NEAR_MISS_DISTANCE && xDistance > -CAR_WIDTH) { // Close in X
                    nearMissDetectedThisFrame = true;
                }
            }
        }

        if (nearMissDetectedThisFrame) {
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
     * For this system, there isn't much internal state beyond the `obstacles` list,
     * which is typically managed by `setObstacles` during a game reset.
     */
    public reset(): void {
        this.obstacles = []; // Clear the list of obstacles upon reset
    }

    /**
     * Disposes of any resources held by the collision system.
     * In this simple implementation, no special disposal is needed as it primarily
     * manages references to existing game objects.
     */
    public dispose(): void {
        // No specific resources to dispose of in this system.
    }
}
