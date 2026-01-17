// src/entities/Obstacle.ts
import * as THREE from 'three';
import { OBSTACLE_WIDTH, OBSTACLE_HEIGHT, OBSTACLE_DEPTH, OBSTACLE_COLOR, LANE_WIDTH, ROAD_WIDTH, CAR_INITIAL_Z,
    GAME_SPEED_INITIAL, GAME_SPEED_MAX,
    OBSTACLE_EMISSIVE_INTENSITY_MIN, OBSTACLE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER,
    OBSTACLE_PULSE_SPEED, OBSTACLE_PULSE_AMPLITUDE
} from '../utils/constants';

export class Obstacle {
    public mesh: THREE.Mesh;
    public collider: THREE.Box3;
    public lane: number; // The lane this obstacle is in

    constructor(scene: THREE.Scene, lane: number, spawnZ: number) {
        this.lane = lane;

        this.mesh = this.createObstacleMesh();
        this.mesh.position.y = OBSTACLE_HEIGHT / 2; // Position on the road
        this.mesh.position.z = spawnZ; // Spawn position
        this.mesh.position.x = this.getLanePositionX(lane); // Position in the center of the specified lane
        this.mesh.castShadow = true; // Obstacle casts shadows
        this.mesh.receiveShadow = true; // Obstacle can receive shadows
        scene.add(this.mesh);

        // Initialize collider, it will be updated in the update method
        this.collider = new THREE.Box3();
        this.mesh.updateMatrixWorld(true);
        this.collider.setFromObject(this.mesh);
    }

    private createObstacleMesh(): THREE.Mesh {
        const obstacleGeometry = new THREE.BoxGeometry(OBSTACLE_WIDTH, OBSTACLE_HEIGHT, OBSTACLE_DEPTH);
        const obstacleMaterial = new THREE.MeshStandardMaterial({
            color: OBSTACLE_COLOR,
            emissive: OBSTACLE_COLOR,
            emissiveIntensity: OBSTACLE_EMISSIVE_INTENSITY_MIN // Initial glowing effect for obstacles
        } as THREE.MeshStandardMaterialParameters); // Explicit cast to resolve LSP error

        return new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    }

    /**
     * Calculates the X position for the center of a given lane.
     * @param laneIndex The 0-indexed lane number (0 for leftmost).
     * @returns The X coordinate for the center of the lane.
     */
    private getLanePositionX(laneIndex: number): number {
        const roadLeftEdge = -ROAD_WIDTH / 2;
        return roadLeftEdge + (laneIndex * LANE_WIDTH) + (LANE_WIDTH / 2);
    }

    /**
     * Updates the obstacle's position, moving it towards the player.
     * @param deltaTime The time elapsed since the last frame.
     * @param speed The current game speed.
     */
    public update(deltaTime: number, speed: number): void {
        this.mesh.position.z += speed * deltaTime;
        // Update the bounding box collider
        this.mesh.updateMatrixWorld(true);
        this.collider.setFromObject(this.mesh);
    }

    /**
     * Updates the visual properties of the obstacle, such as emissive intensity based on speed and pulsation.
     * @param speed The current game speed.
     * @param time The total elapsed time, for pulsation effects.
     */
    public updateVisuals(speed: number, time: number): void {
        const normalizedSpeed = (speed - GAME_SPEED_INITIAL) / (GAME_SPEED_MAX - GAME_SPEED_INITIAL);
        const t = Math.max(0, Math.min(1, normalizedSpeed));

        const baseEmissiveIntensity = OBSTACLE_EMISSIVE_INTENSITY_MIN * (1 + t * (OBSTACLE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER - 1));
        const pulse = Math.sin(time * OBSTACLE_PULSE_SPEED) * OBSTACLE_PULSE_AMPLITUDE + 1; // 1 to 1+AMPLITUDE
        (this.mesh.material as any).emissiveIntensity = baseEmissiveIntensity * pulse;
    }

    /**
     * Checks if the obstacle is out of view (behind the camera).
     * This is determined by checking if its front face has passed the CAR_INITIAL_Z position.
     */
    public isOutOfView(): boolean {
        // Obstacle is considered out of view if its front face (mesh.position.z + OBSTACLE_DEPTH / 2)
        // moves beyond a point behind the car (CAR_INITIAL_Z + some margin).
        // If the Z position of the mesh's back is greater than the car's initial Z, it means it's passed the car.
        return this.mesh.position.z > CAR_INITIAL_Z + OBSTACLE_DEPTH / 2 + 5; // Added margin of 5 units
    }

    /**
     * Disposes of the obstacle's mesh and geometry/materials.
     * @param scene The Three.js scene to remove the mesh from.
     */
    public dispose(scene: THREE.Scene): void {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (Array.isArray(this.mesh.material)) {
            this.mesh.material.forEach(material => material.dispose());
        } else {
            (this.mesh.material as THREE.Material).dispose();
        }
    }
}