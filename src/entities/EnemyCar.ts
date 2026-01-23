// src/entities/EnemyCar.ts
import * as THREE from 'three';
import { CAR_WIDTH, CAR_HEIGHT, CAR_DEPTH, CAR_INITIAL_Z, LANE_WIDTH, LANE_COUNT } from '../utils/constants';
import { getLanePositionX, lerp, clamp } from '../utils/helpers';

export class EnemyCar {
    public mesh: THREE.Group;
    public collider: THREE.Box3;
    public lane: number;
    private targetLane: number;
    private currentX: number;
    private speedOffset: number;
    private laneChangeTimer: number = 0;
    private colliderSize: THREE.Vector3 = new THREE.Vector3(CAR_WIDTH, CAR_HEIGHT, CAR_DEPTH);

    constructor(scene: THREE.Scene, lane: number, spawnZ: number, gameSpeed: number) {
        this.lane = lane;
        this.targetLane = lane;
        this.currentX = getLanePositionX(lane);
        this.speedOffset = -gameSpeed * 0.2; // Move slightly slower than the road
        
        this.mesh = this.createEnemyMesh();
        this.mesh.position.set(this.currentX, CAR_HEIGHT / 2, spawnZ);
        scene.add(this.mesh);

        this.collider = new THREE.Box3();
        this.updateCollider();
    }

    private createEnemyMesh(): THREE.Group {
        const group = new THREE.Group();
        
        // Similar to player car but with different colors (e.g., Aggressive Orange/Red)
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            emissive: 0x661100,
            metalness: 0.8,
            roughness: 0.2
        });

        const bodyGeo = new THREE.BoxGeometry(CAR_WIDTH, CAR_HEIGHT, CAR_DEPTH);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Evil glowing eyes (headlights)
        const eyeGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.4, 0.2, CAR_DEPTH / 2);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.4, 0.2, CAR_DEPTH / 2);
        group.add(eyeR);

        return group;
    }

    public update(deltaTime: number, gameSpeed: number): void {
        // Move along road
        this.mesh.position.z += (gameSpeed + this.speedOffset) * deltaTime;
        
        // Random lane changes
        this.laneChangeTimer -= deltaTime;
        if (this.laneChangeTimer <= 0) {
            this.laneChangeTimer = 2 + Math.random() * 3;
            if (Math.random() > 0.7) {
                const dir = Math.random() > 0.5 ? 1 : -1;
                this.targetLane = clamp(this.lane + dir, 0, LANE_COUNT - 1);
            }
        }

        // Smoothly change lane
        const targetX = getLanePositionX(this.targetLane);
        this.currentX = lerp(this.currentX, targetX, 2 * deltaTime);
        this.mesh.position.x = this.currentX;
        this.lane = Math.round((this.currentX + (LANE_WIDTH * 1.5)) / LANE_WIDTH) - 2; // Simple lane tracking

        this.updateCollider();
    }

    private updateCollider(): void {
        const pos = this.mesh.position;
        const halfSize = this.colliderSize.clone().multiplyScalar(0.5);
        this.collider.min.set(pos.x - halfSize.x, pos.y - halfSize.y, pos.z - halfSize.z);
        this.collider.max.set(pos.x + halfSize.x, pos.y + halfSize.y, pos.z + halfSize.z);
    }

    public isOutOfView(): boolean {
        return this.mesh.position.z > CAR_INITIAL_Z + 10;
    }

    public dispose(scene: THREE.Scene): void {
        scene.remove(this.mesh);
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}
