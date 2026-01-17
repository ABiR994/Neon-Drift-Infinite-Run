// src/entities/Car.ts
import * as THREE from 'three';
import {
    CAR_WIDTH,
    CAR_HEIGHT,
    CAR_DEPTH,
    CAR_COLOR,
    CAR_ACCENT_COLOR,
    CAR_EMISSIVE_INTENSITY_MIN,
    CAR_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER,
    CAR_INITIAL_Z,
    LANE_WIDTH,
    ROAD_WIDTH,
    LANE_COUNT,
    CAR_MOVE_SPEED,
    CAR_MAX_TILT_ANGLE,
    CAR_TILT_SPEED,
    CAR_BOUNCE_AMPLITUDE,
    CAR_BOUNCE_FREQUENCY,
    CAR_VIBRATION_INTENSITY,
    CAR_VIBRATION_SPEED_THRESHOLD,
    CAR_VIBRATION_FREQUENCY,
    CAR_UNDERGLOW_COLOR,
    CAR_UNDERGLOW_INTENSITY,
    CAR_TRAIL_COLOR,
    CAR_TRAIL_LENGTH,
    CAR_TRAIL_WIDTH,
    GAME_SPEED_INITIAL,
    GAME_SPEED_MAX,
} from '../utils/constants';
import { clamp, lerp } from '../utils/helpers';

export class Car {
    public mesh: THREE.Group; // Changed to Group to manage multiple parts
    public collider: THREE.Box3;
    private targetLane: number; // 0-indexed, from left to right
    private currentLaneX: number; // Current X position for the center of the car
    private currentTiltAngle: number = 0; // Current tilt angle for the car
    private initialMeshPosition: THREE.Vector3; // Store initial position for vibration
    private emissiveMeshes: { mesh: THREE.Mesh, initialIntensity: number }[] = [];
    private mainBodyMaterial!: THREE.MeshStandardMaterial; // Asserted as definitely assigned
    private carTrail: THREE.Line | null = null;
    private scene: THREE.Scene; // Keep a reference to the scene for trail disposal

    constructor(scene: THREE.Scene) {
        this.scene = scene; // Store scene reference
        this.mesh = this.createCarMesh();
        this.mesh.position.y = CAR_HEIGHT / 2; // Position on the road
        this.mesh.position.z = CAR_INITIAL_Z; // Initial Z position
        this.mesh.castShadow = true; // Car casts shadows
        scene.add(this.mesh);

        this.initialMeshPosition = this.mesh.position.clone(); // Store initial position

        this.createCarTrail(); // Create and add car trail

        // Initialize collider - it will be updated in the update method
        this.collider = new THREE.Box3();

        // Set initial lane (center lane)
        this.targetLane = Math.floor(LANE_COUNT / 2);
        this.currentLaneX = this.getLanePositionX(this.targetLane);
        this.mesh.position.x = this.currentLaneX;
    }

    private createCarMesh(): THREE.Group {
        const carGroup = new THREE.Group();

        // Main Car Body (refine silhouette)
        this.mainBodyMaterial = new THREE.MeshStandardMaterial({
            color: CAR_COLOR,
            emissive: CAR_COLOR,
            emissiveIntensity: CAR_EMISSIVE_INTENSITY_MIN,
            metalness: 0.8,
            roughness: 0.3,
            flatShading: true // For a more stylized, low-poly look
        });
        // Main body emissive is handled via the material directly, no need to add to emissiveMeshes here if we modify material.emissiveIntensity
        // If there were separate emissive parts of the body, they'd go in emissiveMeshes.

        // Base body
        const baseGeometry = new THREE.BoxGeometry(CAR_WIDTH, CAR_HEIGHT * 0.6, CAR_DEPTH);
        const baseMesh = new THREE.Mesh(baseGeometry, this.mainBodyMaterial);
        baseMesh.position.y = -CAR_HEIGHT * 0.2; // Lower part
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        carGroup.add(baseMesh);

        // Cabin/Cockpit
        const cabinWidth = CAR_WIDTH * 0.8;
        const cabinHeight = CAR_HEIGHT * 0.8;
        const cabinDepth = CAR_DEPTH * 0.6;
        const cabinGeometry = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinDepth);
        const cabinMesh = new THREE.Mesh(cabinGeometry, this.mainBodyMaterial);
        cabinMesh.position.y = CAR_HEIGHT * 0.4;
        cabinMesh.position.z = CAR_DEPTH * 0.05; // Slightly forward
        cabinMesh.castShadow = true;
        cabinMesh.receiveShadow = true;
        carGroup.add(cabinMesh);

        // Angled front (using simple box for now, avoiding complex BufferGeometry issues)
        const frontWedge = new THREE.Mesh(new THREE.BoxGeometry(CAR_WIDTH * 0.9, CAR_HEIGHT * 0.4, CAR_DEPTH * 0.4), this.mainBodyMaterial);
        frontWedge.position.y = CAR_HEIGHT * 0.1;
        frontWedge.position.z = CAR_DEPTH * 0.4;
        frontWedge.rotation.x = Math.PI / 12; // Slight upward angle
        frontWedge.castShadow = true;
        frontWedge.receiveShadow = true;
        carGroup.add(frontWedge);


        // Rear spoiler/wing
        const spoilerGeometry = new THREE.BoxGeometry(CAR_WIDTH * 1.1, CAR_HEIGHT * 0.1, CAR_DEPTH * 0.2);
        const spoilerMesh = new THREE.Mesh(spoilerGeometry, this.mainBodyMaterial);
        spoilerMesh.position.y = CAR_HEIGHT * 0.8;
        spoilerMesh.position.z = -CAR_DEPTH * 0.5 + 0.1;
        spoilerMesh.castShadow = true;
        spoilerMesh.receiveShadow = true;
        carGroup.add(spoilerMesh);

        // Wheels
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.5 });
        const wheelEmissiveMaterial = new THREE.MeshBasicMaterial({ color: CAR_ACCENT_COLOR, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });

        const wheelRadius = CAR_HEIGHT * 0.25;
        const wheelThickness = CAR_WIDTH * 0.1;
        const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
        wheelGeometry.rotateX(Math.PI / 2); // Rotate to lay flat

        const wheelPositions = [
            { x: -CAR_WIDTH / 2 - wheelThickness / 2, y: -CAR_HEIGHT * 0.3, z: CAR_DEPTH * 0.3 }, // Front left
            { x: CAR_WIDTH / 2 + wheelThickness / 2, y: -CAR_HEIGHT * 0.3, z: CAR_DEPTH * 0.3 },  // Front right
            { x: -CAR_WIDTH / 2 - wheelThickness / 2, y: -CAR_HEIGHT * 0.3, z: -CAR_DEPTH * 0.3 }, // Rear left
            { x: CAR_WIDTH / 2 + wheelThickness / 2, y: -CAR_HEIGHT * 0.3, z: -CAR_DEPTH * 0.3 },  // Rear right
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            carGroup.add(wheel);

            // Add emissive ring inside wheel
            const ringGeometry = new THREE.RingGeometry(wheelRadius * 0.6, wheelRadius * 0.8, 16);
            const ringMesh = new THREE.Mesh(ringGeometry, wheelEmissiveMaterial);
            ringMesh.rotation.x = Math.PI / 2; // Face out
            ringMesh.position.set(pos.x, pos.y + wheelThickness / 2 + 0.01, pos.z);
            ringMesh.userData.originalColor = wheelEmissiveMaterial.color.clone(); // Store original color
            carGroup.add(ringMesh);
            this.emissiveMeshes.push({ mesh: ringMesh, initialIntensity: CAR_EMISSIVE_INTENSITY_MIN });
        });

        // Headlights (enhanced)
        const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
        const headlightGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.15, CAR_HEIGHT * 0.15, 0.1);

        const headlightLeft = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlightLeft.position.set(-CAR_WIDTH * 0.3, CAR_HEIGHT * 0.1, CAR_DEPTH / 2 + 0.1);
        headlightLeft.userData.originalColor = headlightMaterial.color.clone();
        carGroup.add(headlightLeft);
        this.emissiveMeshes.push({ mesh: headlightLeft, initialIntensity: CAR_EMISSIVE_INTENSITY_MIN * 2 });

        const headlightRight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlightRight.position.set(CAR_WIDTH * 0.3, CAR_HEIGHT * 0.1, CAR_DEPTH / 2 + 0.1);
        headlightRight.userData.originalColor = headlightMaterial.color.clone();
        carGroup.add(headlightRight);
        this.emissiveMeshes.push({ mesh: headlightRight, initialIntensity: CAR_EMISSIVE_INTENSITY_MIN * 2 });

        // Taillights
        const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
        const taillightGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.15, CAR_HEIGHT * 0.15, 0.1);

        const taillightLeft = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillightLeft.position.set(-CAR_WIDTH * 0.3, CAR_HEIGHT * 0.1, -CAR_DEPTH / 2 - 0.1);
        taillightLeft.userData.originalColor = taillightMaterial.color.clone();
        carGroup.add(taillightLeft);
        this.emissiveMeshes.push({ mesh: taillightLeft, initialIntensity: CAR_EMISSIVE_INTENSITY_MIN * 1.5 });

        const taillightRight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillightRight.position.set(CAR_WIDTH * 0.3, CAR_HEIGHT * 0.1, -CAR_DEPTH / 2 - 0.1);
        taillightRight.userData.originalColor = taillightMaterial.color.clone();
        carGroup.add(taillightRight);
        this.emissiveMeshes.push({ mesh: taillightRight, initialIntensity: CAR_EMISSIVE_INTENSITY_MIN * 1.5 });

        // Neon Accents (side stripes)
        const accentMaterial = new THREE.MeshBasicMaterial({ color: CAR_ACCENT_COLOR, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
        const accentGeometry = new THREE.BoxGeometry(0.1, CAR_HEIGHT * 0.1, CAR_DEPTH * 0.8); // Thin stripe

        const accentLeft = new THREE.Mesh(accentGeometry, accentMaterial);
        accentLeft.position.set(-CAR_WIDTH / 2 - 0.05, CAR_HEIGHT * 0.1, 0);
        accentLeft.userData.originalColor = accentMaterial.color.clone();
        carGroup.add(accentLeft);
        this.emissiveMeshes.push({ mesh: accentLeft, initialIntensity: CAR_EMISSIVE_INTENSITY_MIN * 1.8 });

        const accentRight = new THREE.Mesh(accentGeometry, accentMaterial);
        accentRight.position.set(CAR_WIDTH / 2 + 0.05, CAR_HEIGHT * 0.1, 0);
        accentRight.userData.originalColor = accentMaterial.color.clone();
        carGroup.add(accentRight);
        this.emissiveMeshes.push({ mesh: accentRight, initialIntensity: CAR_EMISSIVE_INTENSITY_MIN * 1.8 });

        // Underglow
        const underglowGeometry = new THREE.PlaneGeometry(CAR_WIDTH * 1.2, CAR_DEPTH * 1.2);
        const underglowMaterial = new THREE.MeshBasicMaterial({
            color: CAR_UNDERGLOW_COLOR,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const underglowMesh = new THREE.Mesh(underglowGeometry, underglowMaterial);
        underglowMesh.rotation.x = -Math.PI / 2; // Lay flat
        underglowMesh.position.y = -CAR_HEIGHT / 2 - 0.05; // Slightly below car
        underglowMesh.userData.originalColor = underglowMaterial.color.clone();
        carGroup.add(underglowMesh);
        this.emissiveMeshes.push({ mesh: underglowMesh, initialIntensity: CAR_UNDERGLOW_INTENSITY });

        // Correct car orientation: rotate 180 degrees around Y-axis if the model's front is currently -Z.
        // Assuming the model was built with +Z as forward, but it renders backward in the scene.
        carGroup.rotation.y = Math.PI;

        return carGroup;
    }

    private createCarTrail(): void {
        const trailMaterial = new THREE.LineBasicMaterial({
            color: CAR_TRAIL_COLOR,
            linewidth: CAR_TRAIL_WIDTH,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const points = [];
        // Start trail points at the car's initial position
        for (let i = 0; i < CAR_TRAIL_LENGTH; i++) {
            points.push(new THREE.Vector3(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z - (i + 1) * (CAR_DEPTH / CAR_TRAIL_LENGTH)));
        }
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(points);
        this.carTrail = new THREE.Line(trailGeometry, trailMaterial);
        this.scene.add(this.carTrail); // Add to the scene via the stored reference
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
     * Also applies car tilt, bounce, vibration, and emissive effects.
     * @param deltaTime The time elapsed since the last frame.
     * @param time The total elapsed time, for animation effects like bounce.
     * @param speed The current game speed.
     */
    public update(deltaTime: number, time: number, speed: number): void {
        const targetX = this.getLanePositionX(this.targetLane);

        // Smoothly interpolate the car's X position towards the target lane's X position
        // The interpolation factor ensures consistent movement speed regardless of FPS.
        this.currentLaneX = lerp(this.currentLaneX, targetX, clamp(CAR_MOVE_SPEED * deltaTime, 0, 1));
        this.mesh.position.x = this.currentLaneX;

        // Car Tilt: Tilt the car based on the difference between current X and target X
        const tiltFactor = (targetX - this.mesh.position.x) / (LANE_WIDTH / 2); // Normalize difference to -1 to 1
        const targetTilt = tiltFactor * CAR_MAX_TILT_ANGLE;
        this.currentTiltAngle = lerp(this.currentTiltAngle, targetTilt, clamp(CAR_TILT_SPEED * deltaTime, 0, 1));
        this.mesh.rotation.z = this.currentTiltAngle;

        // Car Bounce: Apply a subtle vertical bounce
        const bounceOffset = Math.sin(time * CAR_BOUNCE_FREQUENCY) * CAR_BOUNCE_AMPLITUDE;
        this.mesh.position.y = this.initialMeshPosition.y + bounceOffset; // Apply bounce on top of initial Y

        // Car Vibration: Subtle vibration at high speeds
        if (speed > CAR_VIBRATION_SPEED_THRESHOLD) {
            const vibrationFactor = (speed - CAR_VIBRATION_SPEED_THRESHOLD) / (GAME_SPEED_MAX - CAR_VIBRATION_SPEED_THRESHOLD);
            const clampedVibrationFactor = Math.max(0, Math.min(1, vibrationFactor));
            const vibrationX = Math.sin(time * CAR_VIBRATION_FREQUENCY * 0.9) * CAR_VIBRATION_INTENSITY * clampedVibrationFactor;
            const vibrationY = Math.cos(time * CAR_VIBRATION_FREQUENCY) * CAR_VIBRATION_INTENSITY * clampedVibrationFactor;
            this.mesh.position.x = this.currentLaneX + vibrationX; // Apply vibration on top of lane X
            this.mesh.position.y += vibrationY; // Apply vibration on top of bounce Y
        } else {
            // Reset X position if no vibration, only if not currently moving between lanes
            if (Math.abs(this.mesh.position.x - targetX) < 0.01) {
                this.mesh.position.x = this.currentLaneX;
            }
        }

        // Speed-based emissive intensity
        const normalizedSpeed = (speed - GAME_SPEED_INITIAL) / (GAME_SPEED_MAX - GAME_SPEED_INITIAL);
        const t = Math.max(0, Math.min(1, normalizedSpeed)); // Clamp t between 0 and 1
        const currentEmissiveFactor = (1 + t * (CAR_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER - 1));

        // Update main body material emissive intensity
        this.mainBodyMaterial.emissiveIntensity = CAR_EMISSIVE_INTENSITY_MIN * currentEmissiveFactor;


        this.emissiveMeshes.forEach(item => {
            const material = item.mesh.material;
            if (material instanceof THREE.MeshStandardMaterial) {
                material.emissiveIntensity = item.initialIntensity * currentEmissiveFactor;
            } else if (material instanceof THREE.MeshBasicMaterial) {
                // Reset to original color then multiply by factor
                material.color.copy(item.mesh.userData.originalColor);
                material.color.multiplyScalar(item.initialIntensity * currentEmissiveFactor);
            }
        });

        // Update car trail position
        if (this.carTrail) {
            const positions = this.carTrail.geometry.attributes.position.array as Float32Array;
            const carZ = this.mesh.position.z;
            const carY = this.mesh.position.y;
            const carX = this.mesh.position.x;

            // Shift all points forward, creating the illusion of movement
            for (let i = 2; i < positions.length; i += 3) {
                positions[i] += speed * deltaTime;
            }

            // Create new point at the car's current position and shift existing points
            // This creates a more dynamic trailing effect
            const newPositions = [];
            // Add current car position (rear center)
            newPositions.push(carX, carY + CAR_HEIGHT / 4, carZ - CAR_DEPTH / 2);
            for (let i = 0; i < CAR_TRAIL_LENGTH - 1; i++) {
                newPositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            }
            this.carTrail.geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
        }

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
        this.mesh.position.y = this.initialMeshPosition.y; // Reset Y position to initial
        this.mesh.rotation.z = 0; // Reset tilt
        this.currentTiltAngle = 0; // Reset current tilt angle

        // Reset emissive intensities
        this.mainBodyMaterial.emissiveIntensity = CAR_EMISSIVE_INTENSITY_MIN;
        this.emissiveMeshes.forEach(item => {
            const material = item.mesh.material;
            if (material instanceof THREE.MeshStandardMaterial) {
                material.emissiveIntensity = item.initialIntensity;
            } else if (material instanceof THREE.MeshBasicMaterial) {
                material.color.copy(item.mesh.userData.originalColor); // Reset to original color
            }
        });

        // Reset car trail
        if (this.carTrail) {
            const positions = this.carTrail.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < CAR_TRAIL_LENGTH; i++) {
                positions[i * 3] = this.mesh.position.x;
                positions[i * 3 + 1] = this.mesh.position.y + CAR_HEIGHT / 4;
                positions[i * 3 + 2] = this.mesh.position.z - (i + 1) * (CAR_DEPTH / CAR_TRAIL_LENGTH);
            }
            this.carTrail.geometry.attributes.position.needsUpdate = true;
        }

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
        if (this.carTrail) {
            scene.remove(this.carTrail);
            this.carTrail.geometry.dispose();
            (this.carTrail.material as THREE.Material).dispose();
            this.carTrail = null;
        }

        // Helper function to dispose of geometry and material for a single mesh
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

        // Dispose all children of the car group
        this.mesh.traverse(disposeObject);

        // Dispose main body material explicitly if not handled by traverse
        if (this.mainBodyMaterial) {
            this.mainBodyMaterial.dispose();
        }

        // Clear the emissiveMeshes array
        this.emissiveMeshes = [];
    }
}
