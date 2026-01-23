// src/entities/SpecialObstacle.ts
import * as THREE from 'three';
import { CAR_INITIAL_Z, OBSTACLE_DEPTH, OBSTACLE_WIDTH } from '../utils/constants';
import { getLanePositionX } from '../utils/helpers';

export type SpecialObstacleType = 'RAMP' | 'LASER' | 'OIL';

export class SpecialObstacle {
    public mesh: THREE.Group;
    public collider: THREE.Box3;
    public type: SpecialObstacleType;
    public lane: number;
    private laserActive: boolean = true;
    private laserTimer: number = 0;

    constructor(scene: THREE.Scene, type: SpecialObstacleType, lane: number, spawnZ: number) {
        this.type = type;
        this.lane = lane;
        this.mesh = this.createMesh();
        this.mesh.position.set(getLanePositionX(lane), 0, spawnZ);
        scene.add(this.mesh);

        this.collider = new THREE.Box3();
        this.updateCollider();
    }

    private createMesh(): THREE.Group {
        const group = new THREE.Group();
        
        if (this.type === 'RAMP') {
            const geo = new THREE.BoxGeometry(OBSTACLE_WIDTH, 2, 6);
            const mat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x00ffff, emissiveIntensity: 0.5 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -0.3; // Angle up
            mesh.position.y = 0.5;
            group.add(mesh);
        } else if (this.type === 'LASER') {
            // Posts
            const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 5);
            const postMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const p1 = new THREE.Mesh(postGeo, postMat);
            p1.position.set(-OBSTACLE_WIDTH/2, 2.5, 0);
            group.add(p1);
            const p2 = new THREE.Mesh(postGeo, postMat);
            p2.position.set(OBSTACLE_WIDTH/2, 2.5, 0);
            group.add(p2);
            
            // Laser beam
            const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, OBSTACLE_WIDTH);
            const beamMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 5, transparent: true, opacity: 0.8 });
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.rotation.z = Math.PI / 2;
            beam.position.y = 2.5;
            beam.name = 'laser_beam';
            group.add(beam);
        } else if (this.type === 'OIL') {
            const geo = new THREE.CircleGeometry(2, 16);
            const mat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1, roughness: 0, emissive: 0x330066, emissiveIntensity: 0.2 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.05;
            group.add(mesh);
        }

        return group;
    }

    public update(deltaTime: number, speed: number): void {
        this.mesh.position.z += speed * deltaTime;

        if (this.type === 'LASER') {
            this.laserTimer += deltaTime;
            if (this.laserTimer >= 1.5) {
                this.laserTimer = 0;
                this.laserActive = !this.laserActive;
                const beam = this.mesh.getObjectByName('laser_beam');
                if (beam) beam.visible = this.laserActive;
            }
        }

        this.updateCollider();
    }

    private updateCollider(): void {
        const pos = this.mesh.position;
        if (this.type === 'LASER' && !this.laserActive) {
            this.collider.makeEmpty();
            return;
        }
        
        const size = new THREE.Vector3(OBSTACLE_WIDTH, 2, this.type === 'RAMP' ? 6 : OBSTACLE_DEPTH);
        this.collider.setFromCenterAndSize(pos.clone().add(new THREE.Vector3(0, 1, 0)), size);
    }

    public isOutOfView(): boolean {
        return this.mesh.position.z > CAR_INITIAL_Z + 10;
    }

    public dispose(scene: THREE.Scene): void {
        scene.remove(this.mesh);
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }
}
