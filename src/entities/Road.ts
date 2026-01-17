// src/entities/Road.ts
import * as THREE from 'three';
import {
    ROAD_WIDTH,
    ROAD_LENGTH,
    ROAD_COLOR,
    ROAD_LINE_COLOR,
    ROAD_SEGMENT_LENGTH,
    LANE_COUNT,
    LANE_WIDTH,
    CAR_INITIAL_Z,
    GAME_SPEED_INITIAL, // For speed normalization
    GAME_SPEED_MAX,     // For speed normalization
    ROAD_LINE_EMISSIVE_INTENSITY_MIN,
    ROAD_LINE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER,
    ROAD_EDGE_EMISSIVE_INTENSITY_MIN,
    ROAD_EDGE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER,
    ROAD_SEGMENT_EMISSIVE_INTENSITY,
    ROAD_PULSE_SPEED,
    ROAD_PULSE_AMPLITUDE
} from '../utils/constants';

export class Road {
    private scene: THREE.Scene;
    private segments: THREE.Mesh[] = [];
    private laneLines: THREE.Mesh[] = [];
    private edgeLines: THREE.Mesh[] = [];
    private roadMaterial: THREE.MeshStandardMaterial;
    private laneLineMaterial: THREE.MeshStandardMaterial;
    private edgeLineMaterial: THREE.MeshStandardMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        // Initialize materials here
        this.roadMaterial = new THREE.MeshStandardMaterial({
            color: ROAD_COLOR,
            emissive: ROAD_COLOR,
            emissiveIntensity: ROAD_SEGMENT_EMISSIVE_INTENSITY,
            metalness: 0.8, // Make it reflective
            roughness: 0.5 // Adjust for desired shininess
        });
        this.laneLineMaterial = new THREE.MeshStandardMaterial({
            color: ROAD_LINE_COLOR,
            emissive: new THREE.Color(ROAD_LINE_COLOR), // Ensure emissive is a Color object
            emissiveIntensity: ROAD_LINE_EMISSIVE_INTENSITY_MIN,
            metalness: 0.2, // Some metallic reflection
            roughness: 0.3 // A bit shiny
        });
        this.edgeLineMaterial = new THREE.MeshStandardMaterial({
            color: ROAD_LINE_COLOR,
            emissive: new THREE.Color(ROAD_LINE_COLOR), // Ensure emissive is a Color object
            emissiveIntensity: ROAD_EDGE_EMISSIVE_INTENSITY_MIN,
            metalness: 0.2,
            roughness: 0.3
        });

        this.init();
    }

    private init(): void {
        this.createRoadSegments();
        this.createLaneLines();
        this.createEdgeLines();
    }

    /**
     * Creates and adds road segments to the scene.
     * Road segments are positioned to create a continuous scrolling effect.
     */
    private createRoadSegments(): void {
        // Use a standard material for the main road surface
        const segmentMaterial = this.roadMaterial;

        // Determine the number of segments needed to cover the viewable road length, plus some for seamless looping
        const numSegments = Math.ceil(ROAD_LENGTH / ROAD_SEGMENT_LENGTH);

        for (let i = 0; i < numSegments + 2; i++) { // Adding 2 extra segments for smooth transition when looping
            const segmentGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_SEGMENT_LENGTH);
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.rotation.x = -Math.PI / 2; // Rotate to lay flat on the XZ plane
            // Position segments stretching from the camera backwards. CAR_INITIAL_Z is typically where the car is,
            // so we offset relative to that.
            segment.position.z = CAR_INITIAL_Z - i * ROAD_SEGMENT_LENGTH;
            segment.receiveShadow = true; // Road surface should receive shadows from other objects
            segment.castShadow = false; // Road itself doesn't need to cast shadows (optional, performance)
            this.scene.add(segment);
            this.segments.push(segment);
        }
    }

    /**
     * Creates and adds lane divider lines to the road.
     * These lines are dashed and glow slightly for the neon aesthetic.
     */
    private createLaneLines(): void {
        // Use the pre-defined material with emissive property for a glowing effect
        const lineMaterial = this.laneLineMaterial;
        const lineGeometry = new THREE.PlaneGeometry(0.1, ROAD_SEGMENT_LENGTH / 3); // Shorter, dashed lines

        // Calculate x positions for lane lines based on LANE_WIDTH
        for (let i = 1; i < LANE_COUNT; i++) { // Loop for lines between lanes
            const xOffset = -ROAD_WIDTH / 2 + i * LANE_WIDTH;

            // Create multiple dashed lines to extend across all road segments
            for (let j = 0; j < this.segments.length * 3; j++) { // 3 lines per segment for dashes, adjusted for length
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.rotation.x = -Math.PI / 2;
                line.position.x = xOffset;
                // Position for dashed effect: space them out
                line.position.z = CAR_INITIAL_Z - j * (ROAD_SEGMENT_LENGTH / 3);
                line.position.y = 0.01; // Slightly above road to prevent Z-fighting
                this.scene.add(line);
                this.laneLines.push(line);
            }
        }
    }

    /**
     * Creates and adds glowing edge lines for the road boundaries.
     */
    private createEdgeLines(): void {
        // Use the pre-defined material with higher emissive intensity
        const edgeMaterial = this.edgeLineMaterial;
        const edgeGeometry = new THREE.PlaneGeometry(0.2, ROAD_SEGMENT_LENGTH); // Thicker, continuous lines

        const leftEdgeX = -ROAD_WIDTH / 2; // X-coordinate for the left edge
        const rightEdgeX = ROAD_WIDTH / 2; // X-coordinate for the right edge

        // Create edge lines for each road segment
        for (let i = 0; i < this.segments.length; i++) {
            const currentZ = CAR_INITIAL_Z - i * ROAD_SEGMENT_LENGTH;

            const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            leftEdge.rotation.x = -Math.PI / 2;
            leftEdge.position.x = leftEdgeX;
            leftEdge.position.z = currentZ;
            leftEdge.position.y = 0.01;
            this.scene.add(leftEdge);
            this.edgeLines.push(leftEdge);

            const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            rightEdge.rotation.x = -Math.PI / 2;
            rightEdge.position.x = rightEdgeX;
            rightEdge.position.z = currentZ;
            rightEdge.position.y = 0.01;
            this.scene.add(rightEdge);
            this.edgeLines.push(rightEdge);
        }
    }

    /**
     * Updates the position of road segments and lines to simulate continuous scrolling.
     * Also updates the emissive intensity of lane and edge lines based on speed and a pulsing effect.
     * @param deltaTime The time elapsed since the last frame.
     * @param speed The current game speed, affecting scroll rate.
     * @param time The total elapsed time, for pulsation effects.
     */
    public update(deltaTime: number, speed: number, time: number): void {
        // Calculate how much the road should scroll based on speed and delta time
        const scrollAmount = speed * deltaTime;

        // Loop through all road segments to update their positions
        for (const segment of this.segments) {
            segment.position.z += scrollAmount;
            // If a segment moves past the camera's front, reposition it to the far end of the road
            if (segment.position.z > CAR_INITIAL_Z + ROAD_SEGMENT_LENGTH) { // Check if it's past the viewable area + some margin
                segment.position.z -= this.segments.length * ROAD_SEGMENT_LENGTH;
            }
        }

        // Loop through all lane lines and update their positions
        for (const line of this.laneLines) {
            line.position.z += scrollAmount;
            // Reposition lines if they move past the camera's front
            if (line.position.z > CAR_INITIAL_Z + ROAD_SEGMENT_LENGTH / 2) {
                line.position.z -= this.laneLines.length * (ROAD_SEGMENT_LENGTH / 3);
            }
        }

        // Loop through all edge lines and update their positions
        for (const edge of this.edgeLines) {
            edge.position.z += scrollAmount;
            // Reposition edge lines if they move past the camera's front
            if (edge.position.z > CAR_INITIAL_Z + ROAD_SEGMENT_LENGTH) {
                edge.position.z -= (this.edgeLines.length / 2) * ROAD_SEGMENT_LENGTH; // Divide by 2 because there are two edge lines per logical segment
            }
        }

        // Update emissive intensity of lane and edge lines
        const normalizedSpeed = (speed - GAME_SPEED_INITIAL) / (GAME_SPEED_MAX - GAME_SPEED_INITIAL);
        const t = Math.max(0, Math.min(1, normalizedSpeed)); // Clamp t between 0 and 1

        // Lane lines pulsation
        const baseLaneIntensity = ROAD_LINE_EMISSIVE_INTENSITY_MIN * (1 + t * (ROAD_LINE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER - 1));
        const pulseLane = Math.sin(time * ROAD_PULSE_SPEED) * ROAD_PULSE_AMPLITUDE + 1; // 1 to 1+AMPLITUDE
        this.laneLineMaterial.emissiveIntensity = baseLaneIntensity * pulseLane;

        // Edge lines pulsation
        const baseEdgeIntensity = ROAD_EDGE_EMISSIVE_INTENSITY_MIN * (1 + t * (ROAD_EDGE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER - 1));
        const pulseEdge = Math.sin(time * ROAD_PULSE_SPEED + Math.PI / 2) * ROAD_PULSE_AMPLITUDE + 1; // Offset phase for a more dynamic look
        this.edgeLineMaterial.emissiveIntensity = baseEdgeIntensity * pulseEdge;
    }

    /**
     * Resets the road to its initial configuration.
     * This involves repositioning all segments and lines to their original Z-coordinates.
     */
    public reset(): void {
        const numSegments = Math.ceil(ROAD_LENGTH / ROAD_SEGMENT_LENGTH);

        // Reset road segments
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].position.z = CAR_INITIAL_Z - i * ROAD_SEGMENT_LENGTH;
        }

        // Reset lane lines
        let lineIndex = 0;
        for (let i = 1; i < LANE_COUNT; i++) {
            for (let j = 0; j < numSegments * 3; j++) {
                if (this.laneLines[lineIndex]) {
                    this.laneLines[lineIndex].position.z = CAR_INITIAL_Z - j * (ROAD_SEGMENT_LENGTH / 3);
                    lineIndex++;
                }
            }
        }

        // Reset edge lines
        let edgeIndex = 0;
        for (let i = 0; i < numSegments; i++) {
            const currentZ = CAR_INITIAL_Z - i * ROAD_SEGMENT_LENGTH;
            if (this.edgeLines[edgeIndex]) {
                this.edgeLines[edgeIndex].position.z = currentZ; // Left edge
                edgeIndex++;
            }
            if (this.edgeLines[edgeIndex]) {
                this.edgeLines[edgeIndex].position.z = currentZ; // Right edge
                edgeIndex++;
            }
        }
        // Also reset emissive intensity
        this.laneLineMaterial.emissiveIntensity = ROAD_LINE_EMISSIVE_INTENSITY_MIN;
        this.edgeLineMaterial.emissiveIntensity = ROAD_EDGE_EMISSIVE_INTENSITY_MIN;
    }


    /**
     * Disposes of all road-related Three.js geometries and materials
     * and removes them from the scene to prevent memory leaks.
     */
    public dispose(): void {
        const disposeMesh = (mesh: THREE.Mesh) => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(material => material.dispose());
            } else {
                (mesh.material as THREE.Material).dispose(); // Ensure material is treated as THREE.Material
            }
        };

        this.segments.forEach(disposeMesh);
        this.laneLines.forEach(disposeMesh);
        this.edgeLines.forEach(disposeMesh);

        this.segments = [];
        this.laneLines = [];
        this.edgeLines = [];

        this.roadMaterial.dispose();
        this.laneLineMaterial.dispose();
        this.edgeLineMaterial.dispose();
    }
}
