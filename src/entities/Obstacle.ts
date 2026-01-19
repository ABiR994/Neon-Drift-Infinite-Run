// src/entities/Obstacle.ts
import * as THREE from 'three';
import { OBSTACLE_WIDTH, OBSTACLE_HEIGHT, OBSTACLE_DEPTH, CAR_INITIAL_Z,
    OBSTACLE_EMISSIVE_INTENSITY_MIN, OBSTACLE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER,
    OBSTACLE_PULSE_SPEED, OBSTACLE_PULSE_AMPLITUDE
} from '../utils/constants';
import { getLanePositionX, getNormalizedSpeed } from '../utils/helpers';

export class Obstacle {
    public mesh: THREE.Group;
    public collider: THREE.Box3;
    public lane: number; // The lane this obstacle is in
    // Store collision box dimensions for manual collider (since mesh is a Group)
    private colliderSize: THREE.Vector3;
    // Store references to emissive materials for pulsing effect
    private emissiveMaterials: THREE.MeshStandardMaterial[] = [];

    constructor(scene: THREE.Scene, lane: number, spawnZ: number) {
        this.lane = lane;

        this.mesh = this.createObstacleMesh();
        this.mesh.position.y = OBSTACLE_HEIGHT / 2; // Position on the road
        this.mesh.position.z = spawnZ; // Spawn position
        this.mesh.position.x = this.getLanePositionX(lane); // Position in the center of the specified lane
        scene.add(this.mesh);

        // Initialize collider with fixed size based on obstacle dimensions
        this.collider = new THREE.Box3();
        this.colliderSize = new THREE.Vector3(OBSTACLE_WIDTH, OBSTACLE_HEIGHT, OBSTACLE_DEPTH);
        this.updateCollider();
    }

    private createObstacleMesh(): THREE.Group {
        const obstacleGroup = new THREE.Group();

        // === MAIN FRAME - Hexagonal barrier posts ===
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a1a2e,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x1a0a1e,
            emissiveIntensity: 0.2
        });

        // Left pillar
        const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.2, OBSTACLE_HEIGHT, 6);
        const leftPillar = new THREE.Mesh(pillarGeometry, frameMaterial);
        leftPillar.position.set(-OBSTACLE_WIDTH / 2 + 0.2, 0, 0);
        obstacleGroup.add(leftPillar);

        // Right pillar
        const rightPillar = new THREE.Mesh(pillarGeometry, frameMaterial);
        rightPillar.position.set(OBSTACLE_WIDTH / 2 - 0.2, 0, 0);
        obstacleGroup.add(rightPillar);

        // === ENERGY CORE - Central glowing barrier ===
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xff2266,
            emissive: 0xff1144,
            emissiveIntensity: OBSTACLE_EMISSIVE_INTENSITY_MIN,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        this.emissiveMaterials.push(coreMaterial);

        // Main energy field (thin plane between pillars)
        const coreGeometry = new THREE.BoxGeometry(OBSTACLE_WIDTH - 0.5, OBSTACLE_HEIGHT * 0.7, 0.15);
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.set(0, 0.1, 0);
        obstacleGroup.add(core);

        // === HORIZONTAL BARS - Top and bottom frame ===
        const barMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 0.6,
            metalness: 0.7,
            roughness: 0.3
        });
        this.emissiveMaterials.push(barMaterial);

        const barGeometry = new THREE.BoxGeometry(OBSTACLE_WIDTH - 0.3, 0.12, 0.25);
        
        // Top bar
        const topBar = new THREE.Mesh(barGeometry, barMaterial);
        topBar.position.set(0, OBSTACLE_HEIGHT * 0.4, 0);
        obstacleGroup.add(topBar);

        // Bottom bar
        const bottomBar = new THREE.Mesh(barGeometry, barMaterial);
        bottomBar.position.set(0, -OBSTACLE_HEIGHT * 0.4, 0);
        obstacleGroup.add(bottomBar);

        // === WARNING LIGHTS - Corner accent lights ===
        const warningLightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8
        });
        this.emissiveMaterials.push(warningLightMaterial);

        const lightGeometry = new THREE.SphereGeometry(0.1, 8, 8);

        // Top left light
        const topLeftLight = new THREE.Mesh(lightGeometry, warningLightMaterial);
        topLeftLight.position.set(-OBSTACLE_WIDTH / 2 + 0.2, OBSTACLE_HEIGHT * 0.5, 0.15);
        obstacleGroup.add(topLeftLight);

        // Top right light
        const topRightLight = new THREE.Mesh(lightGeometry, warningLightMaterial);
        topRightLight.position.set(OBSTACLE_WIDTH / 2 - 0.2, OBSTACLE_HEIGHT * 0.5, 0.15);
        obstacleGroup.add(topRightLight);

        // Bottom left light
        const bottomLeftLight = new THREE.Mesh(lightGeometry, warningLightMaterial);
        bottomLeftLight.position.set(-OBSTACLE_WIDTH / 2 + 0.2, -OBSTACLE_HEIGHT * 0.5 + 0.15, 0.15);
        obstacleGroup.add(bottomLeftLight);

        // Bottom right light
        const bottomRightLight = new THREE.Mesh(lightGeometry, warningLightMaterial);
        bottomRightLight.position.set(OBSTACLE_WIDTH / 2 - 0.2, -OBSTACLE_HEIGHT * 0.5 + 0.15, 0.15);
        obstacleGroup.add(bottomRightLight);

        // === DANGER STRIPES - Diagonal hazard pattern on pillars ===
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0044,
            emissive: 0xff0022,
            emissiveIntensity: 0.5
        });
        this.emissiveMaterials.push(stripeMaterial);

        // Add stripe rings to pillars
        const stripeGeometry = new THREE.TorusGeometry(0.18, 0.03, 8, 6);
        
        // Left pillar stripes
        for (let i = -1; i <= 1; i++) {
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.rotation.x = Math.PI / 2;
            stripe.position.set(-OBSTACLE_WIDTH / 2 + 0.2, i * 0.4, 0);
            obstacleGroup.add(stripe);
        }

        // Right pillar stripes
        for (let i = -1; i <= 1; i++) {
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.rotation.x = Math.PI / 2;
            stripe.position.set(OBSTACLE_WIDTH / 2 - 0.2, i * 0.4, 0);
            obstacleGroup.add(stripe);
        }

        // === BASE PLATE - Ground anchor ===
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.6,
            roughness: 0.4
        });

        const baseGeometry = new THREE.BoxGeometry(OBSTACLE_WIDTH, 0.1, OBSTACLE_DEPTH * 0.8);
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, -OBSTACLE_HEIGHT / 2 + 0.05, 0);
        obstacleGroup.add(base);

        // === HOLOGRAPHIC SCAN LINES - Animated detail ===
        const scanLineMaterial = new THREE.MeshStandardMaterial({
            color: 0xff66aa,
            emissive: 0xff4488,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.6
        });
        this.emissiveMaterials.push(scanLineMaterial);

        // Horizontal scan lines across the energy core
        const scanLineGeometry = new THREE.BoxGeometry(OBSTACLE_WIDTH - 0.6, 0.03, 0.2);
        for (let i = -2; i <= 2; i++) {
            const scanLine = new THREE.Mesh(scanLineGeometry, scanLineMaterial);
            scanLine.position.set(0, i * 0.18, 0.08);
            obstacleGroup.add(scanLine);
        }

        return obstacleGroup;
    }

    /**
     * Updates the collider box based on obstacle position.
     * Uses fixed dimensions since the mesh is a Group.
     */
    private updateCollider(): void {
        const pos = this.mesh.position;
        const halfSize = this.colliderSize.clone().multiplyScalar(0.5);
        this.collider.min.set(
            pos.x - halfSize.x,
            pos.y - halfSize.y,
            pos.z - halfSize.z
        );
        this.collider.max.set(
            pos.x + halfSize.x,
            pos.y + halfSize.y,
            pos.z + halfSize.z
        );
    }

    /**
     * Calculates the X position for the center of a given lane.
     * Uses the shared helper function.
     * @param laneIndex The 0-indexed lane number (0 for leftmost).
     * @returns The X coordinate for the center of the lane.
     */
    private getLanePositionX(laneIndex: number): number {
        return getLanePositionX(laneIndex);
    }

    /**
     * Updates the obstacle's position, moving it towards the player.
     * @param deltaTime The time elapsed since the last frame.
     * @param speed The current game speed.
     */
    public update(deltaTime: number, speed: number): void {
        this.mesh.position.z += speed * deltaTime;
        // Update the bounding box collider using manual calculation
        this.updateCollider();
    }

    /**
     * Updates the visual properties of the obstacle, such as emissive intensity based on speed and pulsation.
     * @param speed The current game speed.
     * @param time The total elapsed time, for pulsation effects.
     */
    public updateVisuals(speed: number, time: number): void {
        const t = getNormalizedSpeed(speed);

        const baseEmissiveIntensity = OBSTACLE_EMISSIVE_INTENSITY_MIN * (1 + t * (OBSTACLE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER - 1));
        const pulse = Math.sin(time * OBSTACLE_PULSE_SPEED) * OBSTACLE_PULSE_AMPLITUDE + 1; // 1 to 1+AMPLITUDE
        
        // Update all emissive materials with the pulsing effect
        for (const material of this.emissiveMaterials) {
            material.emissiveIntensity = baseEmissiveIntensity * pulse;
        }
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
     * Resets the obstacle to a new lane and spawn position (for object pooling).
     * @param lane The new lane index.
     * @param spawnZ The new Z spawn position.
     */
    public reset(lane: number, spawnZ: number): void {
        this.lane = lane;
        this.mesh.position.x = this.getLanePositionX(lane);
        this.mesh.position.y = OBSTACLE_HEIGHT / 2;
        this.mesh.position.z = spawnZ;
        // Update collider using manual calculation
        this.updateCollider();
        // Reset emissive intensity for all materials
        for (const material of this.emissiveMaterials) {
            material.emissiveIntensity = OBSTACLE_EMISSIVE_INTENSITY_MIN;
        }
    }

    /**
     * Disposes of the obstacle's mesh and geometry/materials.
     * @param scene The Three.js scene to remove the mesh from.
     */
    public dispose(scene: THREE.Scene): void {
        scene.remove(this.mesh);
        
        // Helper function to dispose of geometry and material
        const disposeObject = (obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((material: THREE.Material) => material.dispose());
                } else {
                    (obj.material as THREE.Material).dispose();
                }
            }
        };

        // Dispose all children in the group
        this.mesh.children.forEach(child => disposeObject(child));
        
        // Clear the emissive materials array
        this.emissiveMaterials.length = 0;
    }
}