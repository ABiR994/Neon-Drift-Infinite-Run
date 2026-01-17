// src/entities/Car.ts
import * as THREE from 'three';
import {
    CAR_WIDTH,
    CAR_HEIGHT,
    CAR_DEPTH,
    CAR_COLOR,
    CAR_INITIAL_Z,
    LANE_WIDTH,
    ROAD_WIDTH,
    LANE_COUNT,
    CAR_MOVE_SPEED
} from '../utils/constants';
import { clamp, lerp } from '../utils/helpers';

export class Car {
    public mesh: THREE.Mesh;
    public collider: THREE.Box3;
    private targetLane: number; // 0-indexed, from left to right
    private currentLaneX: number; // Current X position for the center of the car

    constructor(scene: THREE.Scene) {
        this.mesh = this.createCarMesh();
        this.mesh.position.y = CAR_HEIGHT / 2; // Position on the road
        this.mesh.position.z = CAR_INITIAL_Z; // Initial Z position
        this.mesh.castShadow = true; // Car casts shadows
        scene.add(this.mesh);

        // Initialize collider - it will be updated in the update method
        this.collider = new THREE.Box3();

        // Set initial lane (center lane)
        this.targetLane = Math.floor(LANE_COUNT / 2);
        this.currentLaneX = this.getLanePositionX(this.targetLane);
        this.mesh.position.x = this.currentLaneX;
    }

    private createCarMesh(): THREE.Mesh {
        // Simple box geometry for the car body
        const carGeometry = new THREE.BoxGeometry(CAR_WIDTH, CAR_HEIGHT, CAR_DEPTH);
        const carMaterial = new THREE.MeshStandardMaterial({
            color: CAR_COLOR,
            emissive: CAR_COLOR,
            emissiveIntensity: 0.2 // Subtle glow for the car body
        } as THREE.MeshStandardMaterialParameters); // Explicit cast

        const car = new THREE.Mesh(carGeometry, carMaterial);

        // Add some basic "headlights" for aesthetic (and potentially to cast light later)
        const headlightGeometry = new THREE.BoxGeometry(CAR_WIDTH / 4, CAR_HEIGHT / 4, 0.1);
        const headlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00, // Yellowish neon
            emissive: 0xffff00,
            emissiveIntensity: 1 // Strong glow for headlights
        } as THREE.MeshBasicMaterialParameters); // Explicit cast

        const headlightLeft = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlightLeft.position.set(-CAR_WIDTH / 4, CAR_HEIGHT / 4, CAR_DEPTH / 2 + 0.05); // Position at front-left
        car.add(headlightLeft);

        const headlightRight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlightRight.position.set(CAR_WIDTH / 4, CAR_HEIGHT / 4, CAR_DEPTH / 2 + 0.05); // Position at front-right
        car.add(headlightRight);

        // Add a back "fin" or spoiler for more car-like shape
        const finGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.8, CAR_HEIGHT * 0.5, 0.2);
        const finMaterial = new THREE.MeshStandardMaterial({ color: CAR_COLOR }); // No emissive, so no cast needed
        const fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.position.set(0, CAR_HEIGHT * 0.75, -CAR_DEPTH / 2 + 0.1); // Position at rear-top
        car.add(fin);


        return car;
    }

    /**
     * Calculates the X position for the center of a given lane.
     * @param laneIndex The 0-indexed lane number (0 for leftmost).
     * @returns The X coordinate for the center of the lane.
     */
    private getLanePositionX(laneIndex: number): number {
        // Calculate the leftmost edge of the road
        const roadLeftEdge = -ROAD_WIDTH / 2;
        // Calculate the center of the target lane
        return roadLeftEdge + (laneIndex * LANE_WIDTH) + (LANE_WIDTH / 2);
    }

    /**
     * Moves the car to the left by changing its target lane index.
     */
    public moveLeft(): void {
        this.targetLane = clamp(this.targetLane - 1, 0, LANE_COUNT - 1);
    }

    /**
     * Moves the car to the right by changing its target lane index.
     */
    public moveRight(): void {
        this.targetLane = clamp(this.targetLane + 1, 0, LANE_COUNT - 1);
    }

    /**
     * Moves the car to the middle lane.
     */
    public moveToMiddleLane(): void {
        this.targetLane = Math.floor(LANE_COUNT / 2);
    }

    /**
     * Updates the car's position, smoothly interpolating towards the target lane.
     * @param deltaTime The time elapsed since the last frame.
     */
    public update(deltaTime: number): void {
        const targetX = this.getLanePositionX(this.targetLane);

        // Smoothly interpolate the car's X position towards the target lane's X position
        // The interpolation factor ensures consistent movement speed regardless of FPS.
        this.currentLaneX = lerp(this.currentLaneX, targetX, clamp(CAR_MOVE_SPEED * deltaTime, 0, 1));
        this.mesh.position.x = this.currentLaneX;

        // Update the bounding box collider to match the car's new position
        this.mesh.updateMatrixWorld(true); // Ensure world matrix is up-to-date
        this.collider.setFromObject(this.mesh);
    }

    /**
     * Resets the car to its initial position and center lane.
     */
    public reset(): void {
        this.targetLane = Math.floor(LANE_COUNT / 2); // Reset to middle lane
        this.currentLaneX = this.getLanePositionX(this.targetLane);
        this.mesh.position.x = this.currentLaneX;
        this.mesh.position.z = CAR_INITIAL_Z;
        this.mesh.position.y = CAR_HEIGHT / 2;
        // Ensure collider is also reset/updated
        this.mesh.updateMatrixWorld(true);
        this.collider.setFromObject(this.mesh);
    }

    /**
     * Disposes of the car's mesh and geometry/materials to prevent memory leaks.
     * @param scene The Three.js scene to remove the mesh from.
     */
    public dispose(scene: THREE.Scene): void {
        scene.remove(this.mesh);
        // Helper function to dispose of geometry and material
        const disposeObject = (obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(material => material.dispose());
                } else {
                    (obj.material as THREE.Material).dispose();
                }
            }
        };

        disposeObject(this.mesh); // Dispose main car mesh
        this.mesh.children.forEach(child => disposeObject(child)); // Dispose headlights and fin
    }
}
