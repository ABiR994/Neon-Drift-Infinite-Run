// src/entities/PowerUp.ts
import * as THREE from 'three';
import { getLanePositionX } from '../utils/helpers';
import { CAR_INITIAL_Z } from '../utils/constants';

export type PowerUpType = 'SHIELD' | 'BOOST' | 'MULTIPLIER' | 'MAGNET';

export const PowerUpTypes = {
    SHIELD: 'SHIELD' as PowerUpType,
    BOOST: 'BOOST' as PowerUpType,
    MULTIPLIER: 'MULTIPLIER' as PowerUpType,
    MAGNET: 'MAGNET' as PowerUpType
};

export class PowerUp {
    public mesh: THREE.Group;
    public collider: THREE.Box3;
    public type: PowerUpType;
    public lane: number;
    private colliderSize: THREE.Vector3 = new THREE.Vector3(1.2, 1.2, 1.2);

    constructor(scene: THREE.Scene, type: PowerUpType, lane: number, spawnZ: number) {
        this.type = type;
        this.lane = lane;
        this.mesh = this.createPowerUpMesh();
        this.mesh.position.set(getLanePositionX(lane), 1, spawnZ);
        scene.add(this.mesh);

        this.collider = new THREE.Box3();
        this.updateCollider();
    }

    private createPowerUpMesh(): THREE.Group {
        const group = new THREE.Group();
        
        let color = 0x00ffff;
        switch (this.type) {
            case 'SHIELD': color = 0x0088ff; break;
            case 'BOOST': color = 0xffaa00; break;
            case 'MULTIPLIER': color = 0x00ff44; break;
            case 'MAGNET': color = 0xaa00ff; break;
        }

        const geometry = new THREE.OctahedronGeometry(0.6);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });

        const main = new THREE.Mesh(geometry, material);
        group.add(main);

        // Outer ring
        const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        return group;
    }

    public update(deltaTime: number, speed: number, time: number): void {
        this.mesh.position.z += speed * deltaTime;
        this.mesh.rotation.y += deltaTime * 2;
        this.mesh.position.y = 1 + Math.sin(time * 3) * 0.2;
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

    public reset(type: PowerUpType, lane: number, spawnZ: number): void {
        this.type = type;
        this.lane = lane;
        this.mesh.position.set(getLanePositionX(lane), 1, spawnZ);
        
        // Update color
        let color = 0x00ffff;
        switch (this.type) {
            case 'SHIELD': color = 0x0088ff; break;
            case 'BOOST': color = 0xffaa00; break;
            case 'MULTIPLIER': color = 0x00ff44; break;
            case 'MAGNET': color = 0xaa00ff; break;
        }
        
        this.mesh.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
                (child.material as THREE.MeshStandardMaterial).color.setHex(color);
                (child.material as THREE.MeshStandardMaterial).emissive.setHex(color);
            }
        });
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
