// src/entities/Obstacle.ts
import * as THREE from 'three';
import { OBSTACLE_WIDTH, OBSTACLE_HEIGHT, OBSTACLE_DEPTH, OBSTACLE_COLOR, LANE_WIDTH, ROAD_WIDTH, CAR_INITIAL_Z,
    GAME_SPEED_INITIAL, GAME_SPEED_MAX,
    OBSTACLE_EMISSIVE_INTENSITY_MIN, OBSTACLE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER,
    OBSTACLE_PULSE_SPEED, OBSTACLE_PULSE_AMPLITUDE,
    OBSTACLE_TYPE_BARRIER, OBSTACLE_TYPE_ENERGY_WALL, OBSTACLE_TYPE_HOLO_BLOCK,
    OBSTACLE_HOVER_AMPLITUDE, OBSTACLE_HOVER_FREQUENCY, OBSTACLE_ROTATION_SPEED,
    OBSTACLE_APPROACH_GLOW_DISTANCE, OBSTACLE_SPAWN_FLASH_INTENSITY, OBSTACLE_SPAWN_FLASH_DURATION
} from '../utils/constants';
import { clamp } from '../utils/helpers';
import * as TWEEN from '@tweenjs/tween.js'; // Import TWEEN.js

export class Obstacle {
    public mesh: THREE.Group; // Changed to Group to manage multiple parts
    public collider: THREE.Box3;
    public lane: number; // The lane this obstacle is in
    private obstacleType: string;
    private emissiveMeshes: { mesh: THREE.Mesh, initialIntensity: number }[] = [];
    private mainMaterial!: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial; // Main material, assigned in createObstacleMesh
    private initialScale: THREE.Vector3;
    private spawnTime: number; // For spawn flash effect

    constructor(scene: THREE.Scene, lane: number, spawnZ: number, obstacleType: string, time: number) {
        this.lane = lane;
        this.obstacleType = obstacleType;
        this.spawnTime = time;

        this.mesh = this.createObstacleMesh();
        this.mesh.position.y = OBSTACLE_HEIGHT / 2; // Base position on the road
        this.mesh.position.z = spawnZ; // Spawn position
        this.mesh.position.x = this.getLanePositionX(lane); // Position in the center of the specified lane
        this.mesh.castShadow = true; // Obstacle casts shadows
        this.mesh.receiveShadow = true; // Obstacle can receive shadows
        scene.add(this.mesh);

        this.initialScale = this.mesh.scale.clone(); // Store initial scale

        // Initialize collider, it will be updated in the update method
        this.collider = new THREE.Box3();
        this.mesh.updateMatrixWorld(true);
        this.collider.setFromObject(this.mesh);
    }

    private createObstacleMesh(): THREE.Group {
        const obstacleGroup = new THREE.Group();
        let geometry: THREE.BufferGeometry;

        switch (this.obstacleType) {
            case OBSTACLE_TYPE_BARRIER:
                // Main body: elongated box with strong emissive color
                geometry = new THREE.BoxGeometry(OBSTACLE_WIDTH, OBSTACLE_HEIGHT, OBSTACLE_DEPTH);
                this.mainMaterial = new THREE.MeshStandardMaterial({
                    color: OBSTACLE_COLOR,
                    emissive: OBSTACLE_COLOR,
                    emissiveIntensity: OBSTACLE_EMISSIVE_INTENSITY_MIN,
                    metalness: 0.1,
                    roughness: 0.5
                });
                const barrierMesh = new THREE.Mesh(geometry, this.mainMaterial);
                obstacleGroup.add(barrierMesh);
                this.emissiveMeshes.push({ mesh: barrierMesh, initialIntensity: OBSTACLE_EMISSIVE_INTENSITY_MIN });

                // Add diagonal emissive stripes
                const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }); // Orange
                const stripeGeometry = new THREE.BoxGeometry(OBSTACLE_WIDTH * 0.1, OBSTACLE_HEIGHT * 1.2, OBSTACLE_DEPTH * 1.2);
                
                const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
                stripe1.rotation.z = Math.PI / 4;
                stripe1.position.x = -OBSTACLE_WIDTH * 0.2;
                stripe1.userData.originalColor = stripeMaterial.color.clone();
                obstacleGroup.add(stripe1);
                this.emissiveMeshes.push({ mesh: stripe1, initialIntensity: 1.5 });

                const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
                stripe2.rotation.z = -Math.PI / 4;
                stripe2.position.x = OBSTACLE_WIDTH * 0.2;
                stripe2.userData.originalColor = stripeMaterial.color.clone();
                obstacleGroup.add(stripe2);
                this.emissiveMeshes.push({ mesh: stripe2, initialIntensity: 1.5 });
                break;

            case OBSTACLE_TYPE_ENERGY_WALL:
                // Outer shell: translucent box
                geometry = new THREE.BoxGeometry(OBSTACLE_WIDTH * 1.2, OBSTACLE_HEIGHT * 1.2, OBSTACLE_DEPTH * 1.2);
                this.mainMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00ffff, // Cyan
                    transparent: true,
                    opacity: 0.2,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });
                const shellMesh = new THREE.Mesh(geometry, this.mainMaterial);
                shellMesh.userData.originalColor = this.mainMaterial.color.clone();
                obstacleGroup.add(shellMesh);
                this.emissiveMeshes.push({ mesh: shellMesh, initialIntensity: OBSTACLE_EMISSIVE_INTENSITY_MIN });

                // Inner core: glowing cylinder
                const coreGeometry = new THREE.CylinderGeometry(OBSTACLE_WIDTH * 0.3, OBSTACLE_WIDTH * 0.3, OBSTACLE_HEIGHT * 0.8, 16);
                const coreMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff00ff, // Magenta
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });
                const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
                coreMesh.rotation.x = Math.PI / 2; // Stand upright
                coreMesh.userData.originalColor = coreMaterial.color.clone();
                obstacleGroup.add(coreMesh);
                this.emissiveMeshes.push({ mesh: coreMesh, initialIntensity: 2.0 });
                break;

            case OBSTACLE_TYPE_HOLO_BLOCK:
                // Main body: highly transparent cube
                geometry = new THREE.BoxGeometry(OBSTACLE_WIDTH, OBSTACLE_HEIGHT, OBSTACLE_DEPTH);
                this.mainMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00ff00, // Green
                    transparent: true,
                    opacity: 0.1,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });
                const holoMesh = new THREE.Mesh(geometry, this.mainMaterial);
                holoMesh.userData.originalColor = this.mainMaterial.color.clone();
                obstacleGroup.add(holoMesh);
                this.emissiveMeshes.push({ mesh: holoMesh, initialIntensity: OBSTACLE_EMISSIVE_INTENSITY_MIN });

                // Wireframe outline
                const edges = new THREE.EdgesGeometry(geometry);
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
                const wireframe = new THREE.LineSegments(edges, lineMaterial);
                // wireframe.position.copy(holoMesh.position); // Ensure position matches
                obstacleGroup.add(wireframe);
                // Note: LineBasicMaterial does not have emissiveIntensity or emissive color.
                // To animate, one would change its 'color' property.
                // For simplicity, we'll keep it static here unless a specific request for line glow animation.
                break;

            default: // Default to a simple glowing box if type is unknown
                geometry = new THREE.BoxGeometry(OBSTACLE_WIDTH, OBSTACLE_HEIGHT, OBSTACLE_DEPTH);
                this.mainMaterial = new THREE.MeshStandardMaterial({
                    color: OBSTACLE_COLOR,
                    emissive: OBSTACLE_COLOR,
                    emissiveIntensity: OBSTACLE_EMISSIVE_INTENSITY_MIN
                });
                const defaultMesh = new THREE.Mesh(geometry, this.mainMaterial);
                obstacleGroup.add(defaultMesh);
                this.emissiveMeshes.push({ mesh: defaultMesh, initialIntensity: OBSTACLE_EMISSIVE_INTENSITY_MIN });
                break;
        }

        return obstacleGroup;
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
     * Updates the obstacle's position, visuals, and collider.
     * @param deltaTime The time elapsed since the last frame.
     * @param speed The current game speed.
     * @param time The total elapsed time, for pulsation and other effects.
     */
    public update(deltaTime: number, speed: number, time: number): void {
        this.mesh.position.z += speed * deltaTime;

        // Visual updates based on speed, time, and proximity
        const normalizedSpeed = (speed - GAME_SPEED_INITIAL) / (GAME_SPEED_MAX - GAME_SPEED_INITIAL);
        const t = Math.max(0, Math.min(1, normalizedSpeed));

        // Proximity glow: intensify glow as obstacle gets closer to CAR_INITIAL_Z
        const distanceToCar = Math.abs(this.mesh.position.z - CAR_INITIAL_Z);
        const proximityFactor = 1 - clamp(distanceToCar / OBSTACLE_APPROACH_GLOW_DISTANCE, 0, 1); // 1 when close, 0 when far

        // Combined emissive factor (speed-based + pulse + proximity)
        const speedEmissiveFactor = (1 + t * (OBSTACLE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER - 1));
        const pulseFactor = Math.sin((time - this.spawnTime) * OBSTACLE_PULSE_SPEED) * OBSTACLE_PULSE_AMPLITUDE + 1; // 1 to 1+AMPLITUDE, start pulse from spawn
        const finalEmissiveFactor = speedEmissiveFactor * pulseFactor * (1 + proximityFactor * 0.5); // Boost by proximity

        // Apply emissive intensity to all tracked emissive meshes
        this.emissiveMeshes.forEach(item => {
            const material = item.mesh.material;
            const currentIntensity = item.initialIntensity * finalEmissiveFactor;

            if (material instanceof THREE.MeshStandardMaterial) {
                material.emissiveIntensity = currentIntensity;
            } else if (material instanceof THREE.MeshBasicMaterial) {
                if (item.mesh.userData.originalColor) {
                    material.color.copy(item.mesh.userData.originalColor);
                    material.color.multiplyScalar(currentIntensity);
                } else {
                    material.color.multiplyScalar(currentIntensity); // Fallback if originalColor not stored
                }
            }
        });

        // Hover motion
        this.mesh.position.y = OBSTACLE_HEIGHT / 2 + Math.sin(time * OBSTACLE_HOVER_FREQUENCY) * OBSTACLE_HOVER_AMPLITUDE;

        // Rotation motion (only for energy wall or holo block)
        if (this.obstacleType === OBSTACLE_TYPE_ENERGY_WALL || this.obstacleType === OBSTACLE_TYPE_HOLO_BLOCK) {
            this.mesh.rotation.y += OBSTACLE_ROTATION_SPEED * deltaTime;
        }

        // Scale pulse for danger (subtle)
        const scalePulse = Math.sin(time * OBSTACLE_PULSE_SPEED * 0.5) * 0.05 + 1; // +/- 5% scale
        this.mesh.scale.set(this.initialScale.x * scalePulse, this.initialScale.y * scalePulse, this.initialScale.z * scalePulse);
        
        // Spawn flash effect
        if (time - this.spawnTime < OBSTACLE_SPAWN_FLASH_DURATION) {
            const flashProgress = (time - this.spawnTime) / OBSTACLE_SPAWN_FLASH_DURATION;
            const flashIntensity = TWEEN.Easing.Quadratic.Out(1 - flashProgress) * OBSTACLE_SPAWN_FLASH_INTENSITY;
            // Apply flash to all emissive parts
            this.emissiveMeshes.forEach(item => {
                const material = item.mesh.material;
                if (material instanceof THREE.MeshStandardMaterial) {
                    material.emissiveIntensity = item.initialIntensity * flashIntensity;
                } else if (material instanceof THREE.MeshBasicMaterial) {
                    if (item.mesh.userData.originalColor) {
                        material.color.copy(item.mesh.userData.originalColor);
                        material.color.multiplyScalar(item.initialIntensity * flashIntensity);
                    }
                }
            });
        }

        // Update the bounding box collider
        this.mesh.updateMatrixWorld(true);
        this.collider.setFromObject(this.mesh);
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
        
        // Helper function to dispose of geometry and material for a single mesh
        const disposeObject = (obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(material => material.dispose());
                } else {
                    (obj.material as THREE.Material).dispose();
                }
            } else if (obj instanceof THREE.LineSegments) { // Handle wireframes
                obj.geometry.dispose();
                (obj.material as THREE.Material).dispose();
            }
        };

        // Dispose all children of the obstacle group
        this.mesh.traverse(disposeObject);

        // Dispose main material explicitly if it's not a child or was disposed already
        if (this.mainMaterial) {
             // Only dispose if not already disposed by traverse and is not part of a multi-material array
            if (!(this.mainMaterial as any).isDisposed && !Array.isArray(this.mainMaterial)) {
                 this.mainMaterial.dispose();
            }
        }
        
        this.emissiveMeshes = [];
    }
}