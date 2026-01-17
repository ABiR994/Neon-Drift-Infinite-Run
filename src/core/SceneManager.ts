// src/core/SceneManager.ts
import * as THREE from 'three';
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_INITIAL_POS_Y,
    CAMERA_INITIAL_POS_Z,
    CAMERA_LOOK_AT_Y,
    FOG_COLOR,
    FOG_FAR,
    FOG_NEAR, // Keep FOG_NEAR here as it is used directly
    AMBIENT_LIGHT_COLOR,
    DIRECTIONAL_LIGHT_COLOR,
    DIRECTIONAL_LIGHT_INTENSITY,
    ROAD_LENGTH,
    ROAD_WIDTH,
    CAR_INITIAL_Z // Import CAR_INITIAL_Z to correctly position the camera lookAt target
} from '../utils/constants';

// This is a temporary bypass for a persistent LSP error.
// The CAMERA_NEAR constant should ideally be imported from constants.ts.
const CAMERA_NEAR_VALUE = 0.1;

export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private container: HTMLElement;

    constructor(containerId: string) {
        // Find the container element where the game will be rendered
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID "${containerId}" not found.`);
        }
        this.container = container;

        // Initialize scene
        this.scene = new THREE.Scene();
        // Set background color and fog for the neon aesthetic
        this.scene.background = new THREE.Color(FOG_COLOR);
        this.scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_FOV,
            this.container.clientWidth / this.container.clientHeight,
            CAMERA_NEAR_VALUE, // Using a local literal to bypass LSP error
            CAMERA_FAR
        );
        // Position the camera slightly behind and above the car's initial position
        this.camera.position.set(0, CAMERA_INITIAL_POS_Y, CAMERA_INITIAL_POS_Z);
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
        const directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
        // Position the light source above and slightly ahead of the action
        directionalLight.position.set(5, 50, ROAD_LENGTH / 2);
        // Point the light's target towards the area where the car and obstacles will be
        directionalLight.target.position.set(0, 0, CAR_INITIAL_Z); // Using imported constant
        this.scene.add(directionalLight);
        this.scene.add(directionalLight.target); // It's important to add the target to the scene for it to work correctly

        // Configure directional light to cast shadows
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024; // Shadow map resolution
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5; // Near plane for shadow camera frustum
        directionalLight.shadow.camera.far = 100; // Far plane for shadow camera frustum
        // Define the shadow camera's frustum size to cover the road width
        directionalLight.shadow.camera.left = -ROAD_WIDTH / 2;
        directionalLight.shadow.camera.right = ROAD_WIDTH / 2;
        directionalLight.shadow.camera.top = ROAD_WIDTH / 2;
        directionalLight.shadow.camera.bottom = -ROAD_WIDTH / 2;
        // directionalLight.shadow.bias = -0.0005; // Adjust bias to reduce shadow artifacts
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
    }
}
