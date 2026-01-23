// src/entities/Credit.ts
import * as THREE from 'three';
import { getLanePositionX } from '../utils/helpers';
import { CAR_INITIAL_Z } from '../utils/constants';

export class Credit {
    public mesh: THREE.Group;
    public collider: THREE.Box3;
    public lane: number;
    private colliderSize: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

    constructor(scene: THREE.Scene, lane: number, spawnZ: number) {
        this.lane = lane;
        this.mesh = this.createCreditMesh();
        this.mesh.position.set(getLanePositionX(lane), 0.8, spawnZ);
        scene.add(this.mesh);

        this.collider = new THREE.Box3();
        this.updateCollider();
    }

    private createCreditMesh(): THREE.Group {
        const group = new THREE.Group();
        const color = 0xffff00; // Neon Yellow/Gold

        // Diamond shape for credit
        const geometry = new THREE.OctahedronGeometry(0.4);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1.5,
            metalness: 1,
            roughness: 0
        });

        const main = new THREE.Mesh(geometry, material);
        group.add(main);

        // Small particles/glow around it
        const ringGeo = new THREE.TorusGeometry(0.5, 0.02, 8, 16);
        const ringMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        return group;
    }

    public update(deltaTime: number, speed: number, time: number): void {
        this.mesh.position.z += speed * deltaTime;
        this.mesh.rotation.y += deltaTime * 3;
        this.mesh.position.y = 0.8 + Math.sin(time * 5) * 0.15;
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
        this.mesh.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                (child.material as THREE.Material).dispose();
            }
        });
    }
}
