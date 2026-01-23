// src/entities/Car.ts
import * as THREE from 'three';
import {
    CAR_WIDTH,
    CAR_HEIGHT,
    CAR_DEPTH,
    CAR_INITIAL_Z,
    LANE_WIDTH,
    LANE_COUNT,
    CAR_MOVE_SPEED,
    CAR_MAX_TILT_ANGLE,
    CAR_TILT_SPEED,
    CAR_BOUNCE_AMPLITUDE,
    CAR_BOUNCE_FREQUENCY
} from '../utils/constants';
import { clamp, lerp, getLanePositionX } from '../utils/helpers';

export class Car {
    public mesh: THREE.Group;
    public collider: THREE.Box3;
    private targetLane: number; // 0-indexed, from left to right
    private currentLaneX: number; // Current X position for the center of the car
    private currentTiltAngle: number = 0; // Current tilt angle for the car
    // Store collision box dimensions for manual collider
    private colliderSize: THREE.Vector3;
    // Wheel references for spinning animation
    private wheels: THREE.Mesh[] = [];
    private shieldMesh: THREE.Mesh | null = null;

    constructor(scene: THREE.Scene) {
        this.mesh = this.createCarMesh();
        this.mesh.position.y = CAR_HEIGHT / 2; // Position on the road
        this.mesh.position.z = CAR_INITIAL_Z; // Initial Z position
        scene.add(this.mesh);

        // Initialize collider with fixed size based on car dimensions
        this.collider = new THREE.Box3();
        this.colliderSize = new THREE.Vector3(CAR_WIDTH, CAR_HEIGHT, CAR_DEPTH);

        // Set initial lane (center lane)
        this.targetLane = Math.floor(LANE_COUNT / 2);
        this.currentLaneX = this.getLanePositionX(this.targetLane);
        this.mesh.position.x = this.currentLaneX;
        
        // Initial collider update
        this.updateCollider();
    }

    private createCarMesh(): THREE.Group {
        // Create a group to hold all car parts
        const carGroup = new THREE.Group();

        // Wheel dimensions
        const wheelRadius = 0.28;
        const wheelWidth = 0.18;
        const wheelYPos = -CAR_HEIGHT / 2 + wheelRadius + 0.02; // Slightly above ground

        // === MATERIALS ===
        
        // Main body - Vibrant cyan metallic
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            metalness: 0.85,
            roughness: 0.15,
            emissive: 0x003344,
            emissiveIntensity: 0.4
        });

        // Secondary purple accent
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0x8844ff,
            metalness: 0.7,
            roughness: 0.25,
            emissive: 0x4422aa,
            emissiveIntensity: 0.3
        });

        // Dark carbon fiber for structural parts
        const carbonMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.4,
            roughness: 0.6
        });

        // Tire rubber
        const tireMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.1,
            roughness: 0.9
        });

        // Wheel rim - chrome with cyan tint
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            metalness: 0.95,
            roughness: 0.1,
            emissive: 0x004466,
            emissiveIntensity: 0.2
        });

        // Neon glow materials
        const neonCyan = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.95
        });

        const neonPink = new THREE.MeshStandardMaterial({
            color: 0xff44ff,
            emissive: 0xff22ff,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });

        const neonWhite = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.9
        });

        // === MAIN BODY - Low-profile sports car shape ===
        
        // Lower chassis (wider, flatter)
        const chassisShape = new THREE.Shape();
        chassisShape.moveTo(-CAR_WIDTH / 2, 0);
        chassisShape.lineTo(CAR_WIDTH / 2, 0);
        chassisShape.lineTo(CAR_WIDTH / 2.2, CAR_HEIGHT * 0.35);
        chassisShape.lineTo(-CAR_WIDTH / 2.2, CAR_HEIGHT * 0.35);
        chassisShape.closePath();

        const chassisGeometry = new THREE.ExtrudeGeometry(chassisShape, { 
            depth: CAR_DEPTH * 0.95, 
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.03,
            bevelSegments: 2
        });
        chassisGeometry.center();
        const chassis = new THREE.Mesh(chassisGeometry, bodyMaterial);
        chassis.rotation.x = Math.PI / 2;
        chassis.position.y = CAR_HEIGHT * 0.18;
        carGroup.add(chassis);

        // Upper cabin (sleek, tapered)
        const cabinShape = new THREE.Shape();
        cabinShape.moveTo(-CAR_WIDTH / 2.8, 0);
        cabinShape.lineTo(CAR_WIDTH / 2.8, 0);
        cabinShape.lineTo(CAR_WIDTH / 3.5, CAR_HEIGHT * 0.4);
        cabinShape.lineTo(-CAR_WIDTH / 3.5, CAR_HEIGHT * 0.4);
        cabinShape.closePath();

        const cabinGeometry = new THREE.ExtrudeGeometry(cabinShape, { 
            depth: CAR_DEPTH * 0.5, 
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 2
        });
        cabinGeometry.center();
        const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
        cabin.rotation.x = Math.PI / 2;
        cabin.position.y = CAR_HEIGHT * 0.55;
        cabin.position.z = -CAR_DEPTH * 0.1;
        carGroup.add(cabin);

        // === COCKPIT - Tinted glass canopy ===
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a2a,
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.7,
            emissive: 0x001122,
            emissiveIntensity: 0.2
        });

        const cockpitGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.5, CAR_HEIGHT * 0.25, CAR_DEPTH * 0.35);
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, CAR_HEIGHT * 0.72, -CAR_DEPTH * 0.08);
        carGroup.add(cockpit);

        // === WHEEL WELLS / FENDERS ===
        const fenderGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.22, CAR_HEIGHT * 0.25, wheelRadius * 2.5);
        
        // Front left fender
        const fenderFL = new THREE.Mesh(fenderGeometry, accentMaterial);
        fenderFL.position.set(-CAR_WIDTH / 2.5, CAR_HEIGHT * 0.08, CAR_DEPTH / 3);
        carGroup.add(fenderFL);

        // Front right fender
        const fenderFR = new THREE.Mesh(fenderGeometry, accentMaterial);
        fenderFR.position.set(CAR_WIDTH / 2.5, CAR_HEIGHT * 0.08, CAR_DEPTH / 3);
        carGroup.add(fenderFR);

        // Rear left fender
        const fenderRL = new THREE.Mesh(fenderGeometry, accentMaterial);
        fenderRL.position.set(-CAR_WIDTH / 2.5, CAR_HEIGHT * 0.08, -CAR_DEPTH / 3);
        carGroup.add(fenderRL);

        // Rear right fender
        const fenderRR = new THREE.Mesh(fenderGeometry, accentMaterial);
        fenderRR.position.set(CAR_WIDTH / 2.5, CAR_HEIGHT * 0.08, -CAR_DEPTH / 3);
        carGroup.add(fenderRR);

        // === WHEELS WITH TIRES ===
        const createWheel = (x: number, z: number): THREE.Mesh => {
            const wheelGroup = new THREE.Group();

            // Tire (outer ring)
            const tireGeometry = new THREE.TorusGeometry(wheelRadius, wheelWidth * 0.5, 16, 32);
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.rotation.y = Math.PI / 2;
            wheelGroup.add(tire);

            // Rim (center disc)
            const rimGeometry = new THREE.CylinderGeometry(wheelRadius * 0.7, wheelRadius * 0.7, wheelWidth * 0.6, 16);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);

            // Rim spokes (5-spoke design)
            const spokeGeometry = new THREE.BoxGeometry(wheelWidth * 0.4, wheelRadius * 0.15, wheelRadius * 1.3);
            for (let i = 0; i < 5; i++) {
                const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
                spoke.rotation.x = (i * Math.PI * 2) / 5;
                wheelGroup.add(spoke);
            }

            // Center hub with neon accent
            const hubGeometry = new THREE.CylinderGeometry(wheelRadius * 0.2, wheelRadius * 0.2, wheelWidth * 0.7, 8);
            const hub = new THREE.Mesh(hubGeometry, neonCyan);
            hub.rotation.z = Math.PI / 2;
            wheelGroup.add(hub);

            // Create a single mesh to represent the wheel for rotation
            // We'll use a simple cylinder as the rotation target
            const wheelMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            wheelMesh.rotation.z = Math.PI / 2;
            wheelMesh.position.set(x, wheelYPos, z);
            wheelMesh.add(wheelGroup);

            return wheelMesh;
        };

        // Create and position all 4 wheels
        const wheelPositions = [
            { x: -CAR_WIDTH / 2 + wheelWidth / 2, z: CAR_DEPTH / 3 },      // Front left
            { x: CAR_WIDTH / 2 - wheelWidth / 2, z: CAR_DEPTH / 3 },       // Front right
            { x: -CAR_WIDTH / 2 + wheelWidth / 2, z: -CAR_DEPTH / 3 },     // Rear left
            { x: CAR_WIDTH / 2 - wheelWidth / 2, z: -CAR_DEPTH / 3 }       // Rear right
        ];

        for (const pos of wheelPositions) {
            const wheel = createWheel(pos.x, pos.z);
            carGroup.add(wheel);
            this.wheels.push(wheel);
        }

        // === SIDE SKIRTS ===
        const skirtGeometry = new THREE.BoxGeometry(0.08, CAR_HEIGHT * 0.15, CAR_DEPTH * 0.5);
        
        const leftSkirt = new THREE.Mesh(skirtGeometry, carbonMaterial);
        leftSkirt.position.set(-CAR_WIDTH / 2 + 0.04, 0, 0);
        carGroup.add(leftSkirt);

        const rightSkirt = new THREE.Mesh(skirtGeometry, carbonMaterial);
        rightSkirt.position.set(CAR_WIDTH / 2 - 0.04, 0, 0);
        carGroup.add(rightSkirt);

        // === NEON ACCENT STRIPS ===
        
        // Side neon strips (along the body)
        const sideStripGeometry = new THREE.BoxGeometry(0.04, 0.06, CAR_DEPTH * 0.85);
        
        const leftStrip = new THREE.Mesh(sideStripGeometry, neonCyan);
        leftStrip.position.set(-CAR_WIDTH / 2 + 0.06, CAR_HEIGHT * 0.2, 0);
        carGroup.add(leftStrip);

        const rightStrip = new THREE.Mesh(sideStripGeometry, neonCyan);
        rightStrip.position.set(CAR_WIDTH / 2 - 0.06, CAR_HEIGHT * 0.2, 0);
        carGroup.add(rightStrip);

        // Front accent line
        const frontStripGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.8, 0.05, 0.05);
        const frontStrip = new THREE.Mesh(frontStripGeometry, neonCyan);
        frontStrip.position.set(0, CAR_HEIGHT * 0.15, CAR_DEPTH / 2 - 0.08);
        carGroup.add(frontStrip);

        // === HEADLIGHTS ===
        const headlightGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.25, 0.08, 0.12);
        
        const headlightLeft = new THREE.Mesh(headlightGeometry, neonWhite);
        headlightLeft.position.set(-CAR_WIDTH / 3.5, CAR_HEIGHT * 0.28, CAR_DEPTH / 2 - 0.02);
        carGroup.add(headlightLeft);

        const headlightRight = new THREE.Mesh(headlightGeometry, neonWhite);
        headlightRight.position.set(CAR_WIDTH / 3.5, CAR_HEIGHT * 0.28, CAR_DEPTH / 2 - 0.02);
        carGroup.add(headlightRight);

        // Headlight spotlights
        const spotLightLeft = new THREE.SpotLight(0xffffff, 2.5, 35, Math.PI / 12, 0.5, 1);
        spotLightLeft.position.set(-CAR_WIDTH / 3.5, CAR_HEIGHT * 0.28, CAR_DEPTH / 2);
        spotLightLeft.target.position.set(-CAR_WIDTH / 4, 0, CAR_DEPTH / 2 + 25);
        carGroup.add(spotLightLeft);
        carGroup.add(spotLightLeft.target);

        const spotLightRight = new THREE.SpotLight(0xffffff, 2.5, 35, Math.PI / 12, 0.5, 1);
        spotLightRight.position.set(CAR_WIDTH / 3.5, CAR_HEIGHT * 0.28, CAR_DEPTH / 2);
        spotLightRight.target.position.set(CAR_WIDTH / 4, 0, CAR_DEPTH / 2 + 25);
        carGroup.add(spotLightRight);
        carGroup.add(spotLightRight.target);

        // === TAIL LIGHTS ===
        const tailLightGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.2, 0.1, 0.08);
        
        const tailLightLeft = new THREE.Mesh(tailLightGeometry, neonPink);
        tailLightLeft.position.set(-CAR_WIDTH / 3, CAR_HEIGHT * 0.3, -CAR_DEPTH / 2 + 0.04);
        carGroup.add(tailLightLeft);

        const tailLightRight = new THREE.Mesh(tailLightGeometry, neonPink);
        tailLightRight.position.set(CAR_WIDTH / 3, CAR_HEIGHT * 0.3, -CAR_DEPTH / 2 + 0.04);
        carGroup.add(tailLightRight);

        // Rear connecting strip
        const rearStripGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.4, 0.04, 0.04);
        const rearStrip = new THREE.Mesh(rearStripGeometry, neonPink);
        rearStrip.position.set(0, CAR_HEIGHT * 0.3, -CAR_DEPTH / 2 + 0.04);
        carGroup.add(rearStrip);

        // === SPOILER ===
        const spoilerWingGeometry = new THREE.BoxGeometry(CAR_WIDTH * 1.15, 0.06, 0.35);
        const spoiler = new THREE.Mesh(spoilerWingGeometry, carbonMaterial);
        spoiler.position.set(0, CAR_HEIGHT * 0.85, -CAR_DEPTH / 2 + 0.25);
        carGroup.add(spoiler);

        // Spoiler supports
        const spoilerSupportGeometry = new THREE.BoxGeometry(0.06, CAR_HEIGHT * 0.25, 0.08);
        
        const leftSupport = new THREE.Mesh(spoilerSupportGeometry, carbonMaterial);
        leftSupport.position.set(-CAR_WIDTH / 3, CAR_HEIGHT * 0.7, -CAR_DEPTH / 2 + 0.25);
        carGroup.add(leftSupport);

        const rightSupport = new THREE.Mesh(spoilerSupportGeometry, carbonMaterial);
        rightSupport.position.set(CAR_WIDTH / 3, CAR_HEIGHT * 0.7, -CAR_DEPTH / 2 + 0.25);
        carGroup.add(rightSupport);

        // Spoiler neon edge
        const spoilerNeonGeometry = new THREE.BoxGeometry(CAR_WIDTH * 1.1, 0.03, 0.03);
        const spoilerNeon = new THREE.Mesh(spoilerNeonGeometry, neonPink);
        spoilerNeon.position.set(0, CAR_HEIGHT * 0.88, -CAR_DEPTH / 2 + 0.08);
        carGroup.add(spoilerNeon);

        // === AIR INTAKES ===
        const intakeGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.12, 0.08, 0.15);
        
        const leftIntake = new THREE.Mesh(intakeGeometry, carbonMaterial);
        leftIntake.position.set(-CAR_WIDTH / 4, CAR_HEIGHT * 0.45, CAR_DEPTH * 0.15);
        carGroup.add(leftIntake);

        const rightIntake = new THREE.Mesh(intakeGeometry, carbonMaterial);
        rightIntake.position.set(CAR_WIDTH / 4, CAR_HEIGHT * 0.45, CAR_DEPTH * 0.15);
        carGroup.add(rightIntake);

        // === FRONT SPLITTER ===
        const splitterGeometry = new THREE.BoxGeometry(CAR_WIDTH * 1.1, 0.04, 0.2);
        const splitter = new THREE.Mesh(splitterGeometry, carbonMaterial);
        splitter.position.set(0, -CAR_HEIGHT / 2 + 0.05, CAR_DEPTH / 2 - 0.05);
        carGroup.add(splitter);

        // === REAR DIFFUSER ===
        const diffuserGeometry = new THREE.BoxGeometry(CAR_WIDTH * 0.9, 0.06, 0.3);
        const diffuser = new THREE.Mesh(diffuserGeometry, carbonMaterial);
        diffuser.position.set(0, -CAR_HEIGHT / 2 + 0.06, -CAR_DEPTH / 2 + 0.1);
        carGroup.add(diffuser);

        // === EXHAUST TIPS ===
        const exhaustGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.15, 12);
        const exhaustMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.9,
            roughness: 0.2
        });

        const exhaustLeft = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaustLeft.rotation.x = Math.PI / 2;
        exhaustLeft.position.set(-CAR_WIDTH / 4, -CAR_HEIGHT / 2 + 0.12, -CAR_DEPTH / 2);
        carGroup.add(exhaustLeft);

        const exhaustRight = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaustRight.rotation.x = Math.PI / 2;
        exhaustRight.position.set(CAR_WIDTH / 4, -CAR_HEIGHT / 2 + 0.12, -CAR_DEPTH / 2);
        carGroup.add(exhaustRight);

        // Exhaust glow
        const exhaustGlowGeometry = new THREE.CylinderGeometry(0.04, 0.05, 0.05, 12);
        const exhaustGlowMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            emissive: 0xff2200,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
        });

        const exhaustGlowLeft = new THREE.Mesh(exhaustGlowGeometry, exhaustGlowMaterial);
        exhaustGlowLeft.rotation.x = Math.PI / 2;
        exhaustGlowLeft.position.set(-CAR_WIDTH / 4, -CAR_HEIGHT / 2 + 0.12, -CAR_DEPTH / 2 - 0.08);
        carGroup.add(exhaustGlowLeft);

        const exhaustGlowRight = new THREE.Mesh(exhaustGlowGeometry, exhaustGlowMaterial);
        exhaustGlowRight.rotation.x = Math.PI / 2;
        exhaustGlowRight.position.set(CAR_WIDTH / 4, -CAR_HEIGHT / 2 + 0.12, -CAR_DEPTH / 2 - 0.08);
        carGroup.add(exhaustGlowRight);

        // === UNDERCARRIAGE GLOW ===
        const underglowMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const underglowGeometry = new THREE.PlaneGeometry(CAR_WIDTH * 0.6, CAR_DEPTH * 0.7);
        const underglow = new THREE.Mesh(underglowGeometry, underglowMaterial);
        underglow.rotation.x = -Math.PI / 2;
        underglow.position.set(0, -CAR_HEIGHT / 2 + 0.02, 0);
        carGroup.add(underglow);

        // === SHIELD BUBBLE ===
        const shieldGeo = new THREE.SphereGeometry(CAR_DEPTH * 0.6, 32, 32);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.3,
            emissive: 0x0088ff,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMesh.visible = false;
        carGroup.add(this.shieldMesh);

        return carGroup;
    }

    public setShieldVisible(visible: boolean): void {
        if (this.shieldMesh) {
            this.shieldMesh.visible = visible;
        }
    }

    /**
     * Spins the wheels based on current speed.
     * @param speed The current game speed.
     * @param deltaTime Time since last frame.
     */
    private spinWheels(speed: number, deltaTime: number): void {
        // Calculate rotation speed based on game speed
        const wheelRadius = 0.28;
        const rotationSpeed = (speed / wheelRadius) * deltaTime;
        
        for (const wheel of this.wheels) {
            // Rotate around the X axis (forward rolling)
            wheel.rotation.x += rotationSpeed;
        }
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
     * Updates the collider box based on car position.
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
     * Updates the car's position, smoothly interpolating towards the target lane.
     * Also applies car tilt, bounce effects, and wheel spinning.
     * @param deltaTime The time elapsed since the last frame.
     * @param time The total elapsed time, for animation effects like bounce.
     * @param speed The current game speed (for wheel spinning).
     */
    public update(deltaTime: number, time: number, speed: number = 15): void {
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
        this.mesh.position.y = CAR_HEIGHT / 2 + bounceOffset;

        // Spin the wheels based on speed
        this.spinWheels(speed, deltaTime);

        // Update the bounding box collider to match the car's new position
        this.updateCollider();
    }

    /**
     * Resets the car to its initial position and center lane.
     */
    public reset(): void {
        this.targetLane = Math.floor(LANE_COUNT / 2); // Reset to middle lane
        this.currentLaneX = this.getLanePositionX(this.targetLane);
        this.mesh.position.x = this.currentLaneX;
        this.mesh.position.z = CAR_INITIAL_Z;
        this.mesh.position.y = CAR_HEIGHT / 2; // Reset Y position to base
        this.mesh.rotation.z = 0; // Reset tilt
        this.currentTiltAngle = 0; // Reset current tilt angle
        // Ensure collider is also reset/updated
        this.updateCollider();
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
