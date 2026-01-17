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
    CAMERA_SHAKE_MAX_INTENSITY,
    CAMERA_SHAKE_SPEED_THRESHOLD,
    CAMERA_SHAKE_FREQUENCY
} from '../utils/constants';

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

    constructor(containerId: string) {
        // Find the container element where the game will be rendered
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID "${containerId}" not found.`);
        }
        this.container = container;

        // Initialize scene
        this.scene = new THREE.Scene();
        // Set background color
        this.scene.background = new THREE.Color(FOG_COLOR);
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

        // Register event listener for window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    private setupLighting(): void {
        // Ambient light to provide a general, non-directional illumination
        const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR);
        this.scene.add(ambientLight);

        // Directional light to simulate a strong, distant light source
        this.directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
        // Position the light source above and slightly ahead of the action
        this.directionalLight.position.set(5, 50, ROAD_LENGTH / 2);
        // Point the light's target towards the area where the car and obstacles will be
        this.directionalLight.target.position.set(0, 0, CAR_INITIAL_Z); // Using imported constant
        this.scene.add(this.directionalLight);
        this.scene.add(this.directionalLight.target); // It's important to add the target to the scene for it to work correctly

        // Configure directional light to cast shadows
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 1024; // Shadow map resolution
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 0.5; // Near plane for shadow camera frustum
        this.directionalLight.shadow.camera.far = 100; // Far plane for shadow camera frustum
        // Define the shadow camera's frustum size to cover the road width
        this.directionalLight.shadow.camera.left = -ROAD_WIDTH / 2;
        this.directionalLight.shadow.camera.right = ROAD_WIDTH / 2;
        this.directionalLight.shadow.camera.top = ROAD_WIDTH / 2;
        this.directionalLight.shadow.camera.bottom = -ROAD_WIDTH / 2;
        // directionalLight.shadow.bias = -0.0005; // Adjust bias to reduce shadow artifacts

        this.originalDirectionalLightIntensity = DIRECTIONAL_LIGHT_INTENSITY; // Store original intensity
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
            // Fade back down using Tween.js
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
            // Fade back down using Tween.js
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
     public updateEnvironment(speed: number, time: number, deltaTime: number): void {
        // TWEEN.update(time * 1000); // Removed: Now handled in Game.ts

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

        // 4. Implement Camera Shake (subtle at high speeds)
        if (speed > CAMERA_SHAKE_SPEED_THRESHOLD) {
            const shakeFactor = (speed - CAMERA_SHAKE_SPEED_THRESHOLD) / (GAME_SPEED_MAX - CAMERA_SHAKE_SPEED_THRESHOLD);
            const clampedShakeFactor = Math.max(0, Math.min(1, shakeFactor));

            // Apply Perlin-like noise for shake (using sine/cosine for simplicity)
            const shakeX = Math.sin(time * CAMERA_SHAKE_FREQUENCY) * CAMERA_SHAKE_MAX_INTENSITY * clampedShakeFactor;
            const shakeY = Math.cos(time * CAMERA_SHAKE_FREQUENCY * 0.7) * CAMERA_SHAKE_MAX_INTENSITY * clampedShakeFactor;

            this.camera.position.x = this.initialCameraPosition.x + shakeX;
            this.camera.position.y = this.initialCameraPosition.y + shakeY;
        } else {
            // Reset camera position if speed is below threshold
            this.camera.position.x = this.initialCameraPosition.x;
            this.camera.position.y = this.initialCameraPosition.y;
        }

        // Apply temporary shake (e.g., from near-miss)
        if (this.shakeTimer > 0) {
            const tempShakeX = (Math.random() * 2 - 1) * this.currentShakeIntensity;
            const tempShakeY = (Math.random() * 2 - 1) * this.currentShakeIntensity;
            this.camera.position.x += tempShakeX;
            this.camera.position.y += tempShakeY;

            this.shakeTimer -= deltaTime;
            if (this.shakeTimer <= 0) {
                this.shakeTimer = 0;
                this.currentShakeIntensity = 0;
                // Ensure camera returns to its non-temporary-shaken position
                if (speed <= CAMERA_SHAKE_SPEED_THRESHOLD) { // Only if speed-based shake is not active
                    this.camera.position.x = this.initialCameraPosition.x;
                    this.camera.position.y = this.initialCameraPosition.y;
                }
            }
        }
    }
}