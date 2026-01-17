// src/core/SceneManager.ts
import * as THREE from 'three';
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_INITIAL_POS_Y,
    CAMERA_INITIAL_POS_Z,
    CAMERA_LOOK_AT_Y,
    FOG_COLOR,
    AMBIENT_LIGHT_COLOR,
    DIRECTIONAL_LIGHT_COLOR,
    DIRECTIONAL_LIGHT_INTENSITY,
    ROAD_LENGTH,
    ROAD_WIDTH,
    CAR_INITIAL_Z,
    GAME_SPEED_INITIAL,
    GAME_SPEED_MAX,
    FOG_DENSITY_INITIAL,
    FOG_DENSITY_MAX_SPEED_MULTIPLIER,
    CAMERA_MAX_FOV_SPEED_MULTIPLIER,
    CAMERA_TILT_MAX_ANGLE,
    SKY_COLOR_TOP,
    SKY_COLOR_BOTTOM,
    AMBIENT_PARTICLE_COUNT,
    AMBIENT_PARTICLE_COLOR,
    AMBIENT_PARTICLE_SIZE,
    AMBIENT_PARTICLE_SPEED_MULTIPLIER,
    ROAD_SEGMENT_LENGTH,
    ROAD_COLOR,
    BUILDING_COLOR, BUILDING_EMISSIVE_COLOR, BUILDING_PARALLAX_FACTOR, BUILDING_SPAWN_INTERVAL, BUILDING_HEIGHT_MIN, BUILDING_HEIGHT_MAX, BUILDING_WIDTH_MIN, BUILDING_WIDTH_MAX, BUILDING_DEPTH_MIN, BUILDING_DEPTH_MAX,
    TREE_TRUNK_COLOR, TREE_EMISSIVE_COLOR, TREE_PARALLAX_FACTOR, TREE_SPAWN_INTERVAL, TREE_HEIGHT_MIN, TREE_HEIGHT_MAX, TREE_BASE_SIZE_MIN, TREE_BASE_SIZE_MAX,
    STAR_COUNT, STAR_COLOR, STAR_SIZE, STAR_SPEED_MULTIPLIER,
    RIM_LIGHT_COLOR, RIM_LIGHT_INTENSITY // NEW: Import Rim Light constants
} from '../utils/constants';
import { getRandomInt } from '../utils/helpers'; // Import getRandomInt

import * as TWEEN from '@tweenjs/tween.js'; // Import TWEEN.js

// This is a temporary bypass for a persistent LSP error.
// The CAMERA_NEAR constant should ideally be imported from constants.ts.
const CAMERA_NEAR_VALUE = 0.1;

export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private container: HTMLElement;
    private initialCameraFov: number; // Store initial FOV
    private initialCameraRotationX: number; // Store initial camera rotation X
    private initialCameraPosition: THREE.Vector3; // Store initial camera position for shake offset
    private directionalLight: THREE.DirectionalLight | null = null; // Store reference to directional light
    private originalDirectionalLightIntensity: number | null = null; // Store original directional light intensity
    private shakeTimer: number = 0; // Timer for camera shake duration
    private currentShakeIntensity: number = 0; // Current intensity for temporary shakes
    private ambientParticles: THREE.Points | null = null; // Store reference to ambient particles
    private buildings: THREE.Group = new THREE.Group(); // Group for buildings
    private trees: THREE.Group = new THREE.Group(); // Group for trees
    private stars: THREE.Points | null = null; // Store reference to stars

    constructor(containerId: string) {
        // Find the container element where the game will be rendered
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID "${containerId}" not found.`);
        }
        this.container = container;

        // Initialize scene
        this.scene = new THREE.Scene();
        // Use a gradient for the background by setting the background to a Color and configuring fog
        this.scene.background = new THREE.Color(SKY_COLOR_BOTTOM); // Start with the bottom color
        // Use FogExp2 for a more atmospheric effect, with initial density
        this.scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY_INITIAL);

        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_FOV,
            this.container.clientWidth / this.container.clientHeight,
            CAMERA_NEAR_VALUE, // Using a local literal to bypass LSP error
            CAMERA_FAR
        );
        // Store initial camera properties
        this.initialCameraFov = CAMERA_FOV;
        this.initialCameraRotationX = this.camera.rotation.x;

        // Position the camera slightly behind and above the car's initial position
        this.camera.position.set(0, CAMERA_INITIAL_POS_Y, CAMERA_INITIAL_POS_Z);
        this.initialCameraPosition = this.camera.position.clone(); // Store initial position for shake
        // Make the camera look towards the car's initial position on the road
        this.camera.lookAt(new THREE.Vector3(0, CAMERA_LOOK_AT_Y, CAR_INITIAL_Z)); // Using imported constant

        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true; // Enable shadows for more visual depth
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use PCFSoftShadowMap for softer shadow edges
        this.container.appendChild(this.renderer.domElement);

        // Setup lighting for the scene
        this.setupLighting();
        // Add ambient particles
        this.createAmbientParticles();
        // Add roadside elements
        this.createRoadsideElements();
        // Add stars to the sky
        this.createStars();

        // Register event listener for window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    private setupLighting(): void {
        // Ambient light to provide a general, non-directional illumination
        const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, 0.2); // Lower intensity
        this.scene.add(ambientLight);

        // Hemisphere light to simulate sky light and ground reflection
        // Sky color will blend from SKY_COLOR_TOP downwards, ground color is dark
        const hemiLight = new THREE.HemisphereLight(SKY_COLOR_TOP, ROAD_COLOR, 0.4); // Slightly higher intensity for more environmental light
        this.scene.add(hemiLight);

        // Directional light to simulate a strong, distant light source
        this.directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
        // Position the light source above and slightly ahead of the action
        this.directionalLight.position.set(5, 50, CAR_INITIAL_Z - 50); // Adjusted Z position to be further back, casting longer shadows
        // Point the light's target towards the area where the car and obstacles will be
        this.directionalLight.target.position.set(0, 0, CAR_INITIAL_Z);
        this.scene.add(this.directionalLight);
        this.scene.add(this.directionalLight.target);

        // Configure directional light to cast shadows
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048; // Increased shadow map resolution
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 200; // Increased far plane for shadows
        this.directionalLight.shadow.camera.left = -ROAD_WIDTH; // Expanded shadow camera frustum
        this.directionalLight.shadow.camera.right = ROAD_WIDTH;
        this.directionalLight.shadow.camera.top = ROAD_WIDTH;
        this.directionalLight.shadow.camera.bottom = -ROAD_WIDTH;
        this.directionalLight.shadow.bias = -0.001; // Adjust bias to reduce shadow artifacts

        // NEW: Rim Light for separation and accent
        const rimLight = new THREE.PointLight(RIM_LIGHT_COLOR, RIM_LIGHT_INTENSITY, 100); // PointLight for a spherical glow
        rimLight.position.set(0, 5, CAR_INITIAL_Z - 30); // Position behind the car, slightly above
        this.scene.add(rimLight);
        
        this.originalDirectionalLightIntensity = DIRECTIONAL_LIGHT_INTENSITY;
    }

    /**
     * Creates subtle ambient particles for atmospheric effect.
     */
    private createAmbientParticles(): void {
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < AMBIENT_PARTICLE_COUNT; i++) {
            // Distribute particles randomly within a volume
            positions.push(
                (Math.random() * 2 - 1) * (ROAD_WIDTH * 2), // X
                (Math.random() * 2 - 1) * (CAMERA_INITIAL_POS_Y * 2), // Y
                CAR_INITIAL_Z - Math.random() * ROAD_LENGTH * 1.5 // Z, in front of and around the car, extended range
            );
        }

        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            color: AMBIENT_PARTICLE_COLOR,
            size: AMBIENT_PARTICLE_SIZE,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending, // For glowing effect
            depthWrite: false // Avoid z-fighting with other transparent objects
        });

        this.ambientParticles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.ambientParticles);
    }

    /**
     * Updates the position of ambient particles to simulate subtle movement.
     * @param speed The current game speed for relative movement.
     * @param deltaTime The time elapsed since the last frame.
     */
    private updateAmbientParticles(speed: number, deltaTime: number): void {
        if (this.ambientParticles) {
            const positions = this.ambientParticles.geometry.attributes.position.array as Float32Array;
            const particleScrollSpeed = speed * AMBIENT_PARTICLE_SPEED_MULTIPLIER * deltaTime;

            for (let i = 2; i < positions.length; i += 3) {
                // Move particles towards the camera
                positions[i] += particleScrollSpeed;

                // If a particle moves past the camera, reposition it to the far end
                if (positions[i] > CAR_INITIAL_Z + ROAD_SEGMENT_LENGTH) {
                    positions[i] -= ROAD_LENGTH * 1.5; // Reposition further back
                }
            }
            this.ambientParticles.geometry.attributes.position.needsUpdate = true;
        }
    }

    /**
     * Creates static stars in the background for a proper sky effect.
     */
    private createStars(): void {
        const starsGeometry = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < STAR_COUNT; i++) {
            positions.push(
                (Math.random() * 2 - 1) * ROAD_WIDTH * 10,  // X, very wide
                (Math.random() * 2 - 1) * ROAD_LENGTH * 2,  // Y, very high
                CAR_INITIAL_Z - Math.random() * ROAD_LENGTH * 5 // Z, very far back
            );
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const starsMaterial = new THREE.PointsMaterial({
            color: STAR_COLOR,
            size: STAR_SIZE,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    /**
     * Updates the position of stars to simulate very slow movement.
     * @param speed The current game speed for relative movement.
     * @param deltaTime The time elapsed since the last frame.
     */
    private updateStars(speed: number, deltaTime: number): void {
        if (this.stars) {
            const positions = this.stars.geometry.attributes.position.array as Float32Array;
            const starScrollSpeed = speed * STAR_SPEED_MULTIPLIER * deltaTime;

            for (let i = 2; i < positions.length; i += 3) {
                positions[i] += starScrollSpeed;

                // If a star moves past the front, reposition it to the very far back
                if (positions[i] > CAR_INITIAL_Z + ROAD_LENGTH) {
                    positions[i] -= ROAD_LENGTH * 6; // Reposition very far back
                }
            }
            this.stars.geometry.attributes.position.needsUpdate = true;
        }
    }

    private createCyberTree(
        height: number,
        baseSize: number,
        trunkColor: number,
        emissiveColor: number
    ): THREE.Group {
        const treeGroup = new THREE.Group();

        // 1. Trunk: Dark material (Asphalt Dark Gray)
        const trunkGeometry = new THREE.CylinderGeometry(baseSize * 0.15, baseSize * 0.25, height, 6);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: trunkColor,
            roughness: 0.7,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = height / 2; // Position trunk base at Y=0
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // 2. Emissive Veins (Neon Cyan or Soft Violet)
        // Using small cylinders as veins running up the trunk
        const veinMaterial = new THREE.MeshBasicMaterial({
            color: emissiveColor,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const numVeins = getRandomInt(2, 4);
        for (let i = 0; i < numVeins; i++) {
            const veinHeight = height * (0.4 + Math.random() * 0.6); // Vein can be shorter than trunk
            const veinRadius = baseSize * 0.03;
            const veinGeometry = new THREE.CylinderGeometry(veinRadius, veinRadius, veinHeight, 4);
            const vein = new THREE.Mesh(veinGeometry, veinMaterial);

            // Position veins spiraling around the trunk
            const angle = (i / numVeins) * Math.PI * 2 + Math.random() * 0.5;
            vein.position.x = Math.cos(angle) * (baseSize * 0.1);
            vein.position.z = Math.sin(angle) * (baseSize * 0.1);
            vein.position.y = veinHeight / 2 + Math.random() * (height - veinHeight); // Random height along trunk
            vein.rotation.z = Math.random() * Math.PI; // Slight random tilt
            treeGroup.add(vein);
        }

        // 3. Crown: Stylized geometric shape (e.g., Tetrahedron or Dodecahedron)
        // Positioned directly on top of the trunk
        const crownShape = Math.random() < 0.5 ? new THREE.TetrahedronGeometry(baseSize * 0.8) : new THREE.DodecahedronGeometry(baseSize * 0.8);
        const crownMaterial = new THREE.MeshBasicMaterial({
            color: emissiveColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        const crown = new THREE.Mesh(crownShape, crownMaterial);
        crown.position.y = height + (baseSize * 0.4); // Place crown directly above the trunk
        crown.rotation.x = Math.random() * Math.PI; // Randomize orientation
        crown.rotation.y = Math.random() * Math.PI;
        treeGroup.add(crown);

        return treeGroup;
    }

    /**
     * Creates and positions roadside buildings and trees for environmental parallax.
     */
    private createRoadsideElements(): void {
        this.scene.add(this.buildings);
        this.scene.add(this.trees);

        // Building materials
        const buildingBodyMaterial = new THREE.MeshStandardMaterial({ color: BUILDING_COLOR });
        const buildingEmissiveMaterial = new THREE.MeshBasicMaterial({ color: BUILDING_EMISSIVE_COLOR, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });

        // Spawn buildings
        const numBuildings = Math.ceil(ROAD_LENGTH / BUILDING_SPAWN_INTERVAL);
        for (let i = 0; i < numBuildings; i++) {
            const zPosition = CAR_INITIAL_Z - i * BUILDING_SPAWN_INTERVAL - Math.random() * BUILDING_SPAWN_INTERVAL;
            const side = Math.random() < 0.5 ? -1 : 1;
            const xPosition = side * (ROAD_WIDTH / 2 + BUILDING_WIDTH_MAX / 2 + Math.random() * 5); // Outside road edges

            const height = BUILDING_HEIGHT_MIN + Math.random() * (BUILDING_HEIGHT_MAX - BUILDING_HEIGHT_MIN);
            const width = BUILDING_WIDTH_MIN + Math.random() * (BUILDING_WIDTH_MAX - BUILDING_WIDTH_MIN);
            const depth = BUILDING_DEPTH_MIN + Math.random() * (BUILDING_DEPTH_MAX - BUILDING_DEPTH_MIN);

            // Procedural building generation: combine multiple boxes
            const buildingGroup = new THREE.Group();

            // Main tower
            const mainTowerGeometry = new THREE.BoxGeometry(width, height, depth);
            const mainTower = new THREE.Mesh(mainTowerGeometry, buildingBodyMaterial);
            mainTower.position.set(0, height / 2, 0);
            buildingGroup.add(mainTower);

            // Smaller accent blocks on top
            if (Math.random() < 0.6) { // 60% chance for an accent block
                const accentHeight = height * (0.2 + Math.random() * 0.3);
                const accentWidth = width * (0.5 + Math.random() * 0.5);
                const accentDepth = depth * (0.5 + Math.random() * 0.5);
                const accentGeometry = new THREE.BoxGeometry(accentWidth, accentHeight, accentDepth);
                const accentBlock = new THREE.Mesh(accentGeometry, buildingBodyMaterial);
                accentBlock.position.set(
                    (Math.random() * 2 - 1) * (width / 4), // Random X offset
                    height + accentHeight / 2,
                    (Math.random() * 2 - 1) * (depth / 4)  // Random Z offset
                );
                buildingGroup.add(accentBlock);
            }

            // Emissive panels/windows
            if (Math.random() < 0.8) { // 80% chance for emissive panels
                const panelCount = getRandomInt(1, 3);
                for (let p = 0; p < panelCount; p++) {
                    const panelHeight = height * (0.1 + Math.random() * 0.3);
                    const panelWidth = width * (0.1 + Math.random() * 0.3);
                    const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
                    const panel = new THREE.Mesh(panelGeometry, buildingEmissiveMaterial);
                    
                    // Randomly place on one of the 4 sides
                    const sideChoice = getRandomInt(0, 3);
                    switch (sideChoice) {
                        case 0: // Front
                            panel.position.set(
                                (Math.random() * 2 - 1) * (width / 3),
                                height * (0.3 + Math.random() * 0.6),
                                depth / 2 + 0.01
                            );
                            break;
                        case 1: // Back
                            panel.position.set(
                                (Math.random() * 2 - 1) * (width / 3),
                                height * (0.3 + Math.random() * 0.6),
                                -depth / 2 - 0.01
                            );
                            panel.rotation.y = Math.PI;
                            break;
                        case 2: // Left
                            panel.position.set(
                                -width / 2 - 0.01,
                                height * (0.3 + Math.random() * 0.6),
                                (Math.random() * 2 - 1) * (depth / 3)
                            );
                            panel.rotation.y = -Math.PI / 2;
                            break;
                        case 3: // Right
                            panel.position.set(
                                width / 2 + 0.01,
                                height * (0.3 + Math.random() * 0.6),
                                (Math.random() * 2 - 1) * (depth / 3)
                            );
                            panel.rotation.y = Math.PI / 2;
                            break;
                    }
                    buildingGroup.add(panel);
                }
            }

            buildingGroup.position.set(xPosition, 0, zPosition);
            buildingGroup.traverse(obj => { // Ensure all parts cast/receive shadows
                if (obj instanceof THREE.Mesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                }
            });
            this.buildings.add(buildingGroup);
        }

        // Spawn trees (Modified to use createCyberTree)
        const numTrees = Math.ceil(ROAD_LENGTH / TREE_SPAWN_INTERVAL);
        for (let i = 0; i < numTrees; i++) {
            const zPosition = CAR_INITIAL_Z - i * TREE_SPAWN_INTERVAL - Math.random() * TREE_SPAWN_INTERVAL;
            const side = Math.random() < 0.5 ? -1 : 1;
            const xPosition = side * (ROAD_WIDTH / 2 + TREE_BASE_SIZE_MAX / 2 + Math.random() * 3); // Outside road edges, closer than buildings

            const height = TREE_HEIGHT_MIN + Math.random() * (TREE_HEIGHT_MAX - TREE_HEIGHT_MIN);
            const baseSize = TREE_BASE_SIZE_MIN + Math.random() * (TREE_BASE_SIZE_MAX - TREE_BASE_SIZE_MIN);

            const treeGroup = this.createCyberTree(height, baseSize, TREE_TRUNK_COLOR, TREE_EMISSIVE_COLOR);
            treeGroup.position.set(xPosition, 0, zPosition); // Trees are grounded at Y=0
            this.trees.add(treeGroup);
        }
    }

    /**
     * Updates the position of roadside elements to simulate parallax scrolling.
     * @param speed The current game speed for relative movement.
     * @param deltaTime The time elapsed since the last frame.
     */
    private updateRoadsideElements(speed: number, deltaTime: number): void {
        const scrollAmountBuildings = speed * BUILDING_PARALLAX_FACTOR * deltaTime;
        const scrollAmountTrees = speed * TREE_PARALLAX_FACTOR * deltaTime;

        // Update buildings
        this.buildings.children.forEach(child => {
            child.position.z += scrollAmountBuildings;
            if (child.position.z > CAR_INITIAL_Z + ROAD_LENGTH / 2) {
                child.position.z -= (ROAD_LENGTH + BUILDING_SPAWN_INTERVAL); // Reposition far back
            }
        });

        // Update trees
        this.trees.children.forEach(child => {
            child.position.z += scrollAmountTrees;
            if (child.position.z > CAR_INITIAL_Z + ROAD_LENGTH / 2) {
                child.position.z -= (ROAD_LENGTH + TREE_SPAWN_INTERVAL); // Reposition far back
            }
        });
    }

    /**
     * Handles window resize events to maintain aspect ratio and fill the screen.
     */
    private onWindowResize(): void {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix(); // Update camera's projection matrix after aspect change
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    public getRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }

    /**
     * Renders the scene from the camera's perspective. This is called in the main game loop.
     */
    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Disposes of the Three.js renderer and removes event listeners to prevent memory leaks,
     * crucial for clean restarts.
     */
    public dispose(): void {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.dispose();
        // Remove the renderer's canvas from the DOM
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        // Additional cleanup for scene objects might be needed here depending on complexity
        // Cast to THREE.Object3D to ensure type safety
        this.scene.children.forEach((child: THREE.Object3D) => {
            // Dispose of geometries and materials to free up GPU memory
            if ((child as THREE.Mesh).geometry) {
                ((child as THREE.Mesh).geometry as THREE.BufferGeometry).dispose();
            }
            if ((child as THREE.Mesh).material) {
                // If material is an array
                if (Array.isArray((child as THREE.Mesh).material)) {
                    ((child as THREE.Mesh).material as THREE.Material[]).forEach(material => material.dispose());
                } else {
                    ((child as THREE.Mesh).material as THREE.Material).dispose();
                }
            }
            this.scene.remove(child);
        });
        // Dispose ambient particles
        if (this.ambientParticles) {
            this.ambientParticles.geometry.dispose();
            (this.ambientParticles.material as THREE.Material).dispose();
            this.scene.remove(this.ambientParticles);
            this.ambientParticles = null;
        }

        // Dispose buildings and trees
        this.buildings.children.forEach(obj => {
            if (obj instanceof THREE.Mesh) { // Check if it's a Mesh before accessing geometry/material
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(material => material.dispose());
                } else {
                    (obj.material as THREE.Material).dispose();
                }
            }
        });
        this.scene.remove(this.buildings);
        this.buildings.clear(); // Clear children from the group
        this.trees.children.forEach(obj => {
            if (obj instanceof THREE.Mesh) { // Check if it's a Mesh before accessing geometry/material
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(material => material.dispose());
                } else {
                    (obj.material as THREE.Material).dispose();
                }
            }
        });
        this.scene.remove(this.trees);
        this.trees.clear(); // Clear children from the group

        // Dispose stars
        if (this.stars) {
            this.stars.geometry.dispose();
            (this.stars.material as THREE.Material).dispose();
            this.scene.remove(this.stars);
            this.stars = null;
        }

        // Reset camera properties to initial
        this.camera.rotation.x = this.initialCameraRotationX;
        this.camera.position.copy(this.initialCameraPosition);
    }

    /**
     * Triggers a small camera shake effect.
     * @param intensity The intensity of the shake.
     */
    public triggerSmallShake(intensity: number): void {
        this.currentShakeIntensity = intensity;
        this.shakeTimer = 0.2; // Shake for a short duration
    }

    /**
     * Triggers a temporary light flash effect.
     * @param duration The duration of the flash in seconds.
     */
    public triggerLightFlash(duration: number): void {
        if (this.directionalLight && this.originalDirectionalLightIntensity !== null) {
            // Flash up
            this.directionalLight.intensity = this.originalDirectionalLightIntensity * 3; // Boost intensity
            new TWEEN.Tween({ intensity: this.directionalLight.intensity })
                .to({ intensity: this.originalDirectionalLightIntensity }, duration * 1000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate((obj: { intensity: number }) => {
                    if (this.directionalLight) this.directionalLight.intensity = obj.intensity;
                })
                    .start();
            }
        }

    /**
     * Triggers a dramatic camera shake effect, typically for collisions.
     * @param intensity The intensity of the dramatic shake.
     */
    public triggerDramaticShake(intensity: number): void {
        this.currentShakeIntensity = intensity;
        this.shakeTimer = 0.5; // Dramatic shake lasts a bit longer
    }

    /**
     * Triggers a strong, temporary light flash effect, typically for collisions.
     * @param duration The duration of the flash in seconds.
     */
    public triggerCollisionFlash(duration: number): void {
        if (this.directionalLight && this.originalDirectionalLightIntensity !== null) {
            // Flash up with much higher intensity
            this.directionalLight.intensity = this.originalDirectionalLightIntensity * 5; // Very strong boost
            new TWEEN.Tween({ intensity: this.directionalLight.intensity })
                .to({ intensity: this.originalDirectionalLightIntensity }, duration * 1000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate((obj: { intensity: number }) => {
                    if (this.directionalLight) this.directionalLight.intensity = obj.intensity;
                })
                .start();
        }
    }

    /**
     * Updates environment effects based on game speed and time, such as fog density, camera FOV, camera tilt, and camera shake.
     * @param speed The current game speed.
     * @param time The total elapsed time, for pulsation and shake effects.
     * @param deltaTime The time elapsed since the last frame.
     */
     public updateEnvironment(speed: number, deltaTime: number): void {
        // Update ambient particles
        this.updateAmbientParticles(speed, deltaTime);
        // Update roadside elements
        this.updateRoadsideElements(speed, deltaTime);
        // Update stars
        this.updateStars(speed, deltaTime);

        // Normalize speed to a 0-1 range based on initial and max speed
        const normalizedSpeed = (speed - GAME_SPEED_INITIAL) / (GAME_SPEED_MAX - GAME_SPEED_INITIAL);
        const t = Math.max(0, Math.min(1, normalizedSpeed)); // Clamp t between 0 and 1

        // 1. Update Fog Density (exponential fog)
        // Lerp from initial density to (initial * max_speed_multiplier)
        const currentFogDensity = FOG_DENSITY_INITIAL * (1 + t * (FOG_DENSITY_MAX_SPEED_MULTIPLIER - 1));
        (this.scene.fog as THREE.FogExp2).density = currentFogDensity;

        // 2. Update Camera FOV
        // Lerp from initial FOV to (initial FOV * max_fov_speed_multiplier)
        const targetFov = this.initialCameraFov * (1 + t * (CAMERA_MAX_FOV_SPEED_MULTIPLIER - 1));
        if (this.camera.fov !== targetFov) {
            this.camera.fov = targetFov;
            this.camera.updateProjectionMatrix();
        }

        // 3. Update Camera Tilt (slight forward tilt at higher speeds)
        // Lerp from initial (0) tilt to CAMERA_TILT_MAX_ANGLE
        this.camera.rotation.x = this.initialCameraRotationX + CAMERA_TILT_MAX_ANGLE * t;

        // Reset camera position to initial before applying any shake
        this.camera.position.x = this.initialCameraPosition.x;
        this.camera.position.y = this.initialCameraPosition.y;

        // Apply temporary shake (e.g., from near-miss or collision)
        if (this.shakeTimer > 0) {
            const tempShakeX = (Math.random() * 2 - 1) * this.currentShakeIntensity;
            const tempShakeY = (Math.random() * 2 - 1) * this.currentShakeIntensity;
            this.camera.position.x += tempShakeX;
            this.camera.position.y += tempShakeY;

            this.shakeTimer -= deltaTime;
            if (this.shakeTimer <= 0) {
                this.shakeTimer = 0;
                this.currentShakeIntensity = 0;
                // Camera position will naturally return to initialCameraPosition in the next frame
                // because of the reset at the beginning of this block.
            }
        }

    }
}