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
    ROAD_PULSE_AMPLITUDE,
    ROAD_PATTERN_COLOR,
    ROAD_PATTERN_EMISSIVE_INTENSITY,
    ROAD_PATTERN_SCROLL_SPEED_MULTIPLIER
} from '../utils/constants';

export class Road {
    private scene: THREE.Scene;
    private segments: THREE.Mesh[] = [];
    private laneLines: THREE.Mesh[] = [];
    private edgeLines: THREE.Mesh[] = [];
    private roadMaterial: THREE.MeshStandardMaterial;
    private laneLineMaterial: THREE.MeshStandardMaterial;
    private edgeLineMaterial: THREE.MeshStandardMaterial;
    private roadPatternMaterial: THREE.MeshStandardMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        // Initialize materials here
        this.roadMaterial = new THREE.MeshStandardMaterial({
            color: ROAD_COLOR,
            emissive: ROAD_COLOR,
            emissiveIntensity: ROAD_SEGMENT_EMISSIVE_INTENSITY,
            metalness: 0.9, // Make it highly reflective
            roughness: 0.3, // Adjust for desired shininess
            envMapIntensity: 1 // How much the environment map affects the material
        });
        this.laneLineMaterial = new THREE.MeshStandardMaterial({
            color: ROAD_LINE_COLOR,
            emissive: new THREE.Color(ROAD_LINE_COLOR), // Ensure emissive is a Color object
            emissiveIntensity: ROAD_LINE_EMISSIVE_INTENSITY_MIN,
            metalness: 0.5, // Some metallic reflection
            roughness: 0.2 // A bit shiny
        });
        this.edgeLineMaterial = new THREE.MeshStandardMaterial({
            color: ROAD_LINE_COLOR,
            emissive: new THREE.Color(ROAD_LINE_COLOR), // Ensure emissive is a Color object
            emissiveIntensity: ROAD_EDGE_EMISSIVE_INTENSITY_MIN,
            metalness: 0.5,
            roughness: 0.2
        });
        this.roadPatternMaterial = new THREE.MeshStandardMaterial({
            color: ROAD_PATTERN_COLOR,
            emissive: new THREE.Color(ROAD_PATTERN_COLOR),
            emissiveIntensity: ROAD_PATTERN_EMISSIVE_INTENSITY,
            transparent: true,
            opacity: 0.6,
            depthWrite: false // Important for transparent objects
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
        const segmentMaterial = this.roadMaterial;
        const patternMaterial = this.roadPatternMaterial;

        // Determine the number of segments needed to cover the viewable road length, plus some for seamless looping
        const numSegments = Math.ceil(ROAD_LENGTH / ROAD_SEGMENT_LENGTH);

        for (let i = 0; i < numSegments + 2; i++) { // Adding 2 extra segments for smooth transition when looping
            // Main road segment
            const segmentGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_SEGMENT_LENGTH);
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.rotation.x = -Math.PI / 2; // Rotate to lay flat on the XZ plane
            segment.position.z = CAR_INITIAL_Z - i * ROAD_SEGMENT_LENGTH;
            segment.receiveShadow = true; // Road surface should receive shadows from other objects
            segment.castShadow = false; // Road itself doesn't need to cast shadows (optional, performance)
            this.scene.add(segment);
            this.segments.push(segment);

            // Add subtle pattern on top of the road segment
            const patternGeometry = new THREE.PlaneGeometry(ROAD_WIDTH * 0.95, ROAD_SEGMENT_LENGTH * 0.95);
            const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
            pattern.rotation.x = -Math.PI / 2;
            pattern.position.z = segment.position.z;
            pattern.position.y = 0.02; // Slightly above road to prevent Z-fighting
            this.scene.add(pattern);
            this.segments.push(pattern); // Add pattern to segments array to be updated
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
            // This loop iterates based on the total number of primary road segments * 3 (for dashes)
            // It should not use this.segments.length as that now includes patterns
            const effectiveNumSegments = Math.ceil(ROAD_LENGTH / ROAD_SEGMENT_LENGTH);
            for (let j = 0; j < effectiveNumSegments * 3; j++) { // 3 lines per segment for dashes
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

        const numRoadSegmentsOnly = this.segments.length / 2; // Only main segments count for edge lines
        // Create edge lines for each road segment
        for (let i = 0; i < numRoadSegmentsOnly; i++) {
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

        // Loop through all road segments (and patterns) to update their positions
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            // Check if it's a pattern by index (odd indices are patterns, even are main segments)
            const isPattern = i % 2 !== 0; 

            // Patterns scroll slower to create parallax
            const effectiveScrollAmount = scrollAmount * (isPattern ? ROAD_PATTERN_SCROLL_SPEED_MULTIPLIER : 1);
            segment.position.z += effectiveScrollAmount;

            // Reposition if it moves past the camera's front
            // The repositioning logic needs to be careful to maintain the pairing of segment and pattern
            const numPrimarySegments = this.segments.length / 2; // Number of main road segments
            if (segment.position.z > CAR_INITIAL_Z + ROAD_SEGMENT_LENGTH / 2) {
                // If it's a main segment, move it back by total road length covered by primary segments
                if (!isPattern) {
                    segment.position.z -= numPrimarySegments * ROAD_SEGMENT_LENGTH;
                } else {
                    // If it's a pattern, move it back by total pattern length (which is also numPrimarySegments * ROAD_SEGMENT_LENGTH)
                    segment.position.z -= numPrimarySegments * ROAD_SEGMENT_LENGTH * ROAD_PATTERN_SCROLL_SPEED_MULTIPLIER;
                }
            }
        }

        // Loop through all lane lines and update their positions
        for (const line of this.laneLines) {
            line.position.z += scrollAmount;
            // Reposition lines if they move past the camera's front
            const effectiveNumLaneSegments = Math.ceil(ROAD_LENGTH / ROAD_SEGMENT_LENGTH); // This should be constant
            if (line.position.z > CAR_INITIAL_Z + ROAD_SEGMENT_LENGTH / 2) {
                line.position.z -= (effectiveNumLaneSegments * LANE_COUNT * 3) * (ROAD_SEGMENT_LENGTH / 3);
            }
        }

        // Loop through all edge lines and update their positions
        for (const edge of this.edgeLines) {
            edge.position.z += scrollAmount;
            // Reposition edge lines if they move past the camera's front
            const numEdgeSegmentsOnly = this.edgeLines.length / 2;
            if (edge.position.z > CAR_INITIAL_Z + ROAD_SEGMENT_LENGTH / 2) {
                edge.position.z -= numEdgeSegmentsOnly * ROAD_SEGMENT_LENGTH;
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

        // Reset road segments (and patterns)
        for (let i = 0; i < this.segments.length; i++) {
            // const isPattern = i % 2 !== 0; // Removed: 'isPattern' is declared but its value is never read.
            const segmentIndex = Math.floor(i / 2); // Get the index of the main road segment
            // Patterns are associated with main segments, so their initial Z is based on the segmentIndex
            this.segments[i].position.z = CAR_INITIAL_Z - segmentIndex * ROAD_SEGMENT_LENGTH;
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
        // Iterate through the actual number of edge lines pairs (each segment has two edge lines)
        const numEdgeLinePairs = this.edgeLines.length / 2;
        for (let i = 0; i < numEdgeLinePairs; i++) {
            const currentZ = CAR_INITIAL_Z - i * ROAD_SEGMENT_LENGTH;
            if (this.edgeLines[edgeIndex]) { // Left edge
                this.edgeLines[edgeIndex].position.z = currentZ;
                edgeIndex++;
            }
            if (this.edgeLines[edgeIndex]) { // Right edge
                this.edgeLines[edgeIndex].position.z = currentZ;
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
        this.roadPatternMaterial.dispose();
    }
}
