// src/entities/HunterBoss.ts
import * as THREE from 'three';
import { CAR_WIDTH, CAR_HEIGHT, CAR_DEPTH, CAR_INITIAL_Z, LANE_COUNT } from '../utils/constants';
import { getLanePositionX, lerp, clamp } from '../utils/helpers';

export class HunterBoss {
    public mesh: THREE.Group;
    public collider: THREE.Box3;
    private targetLane: number = 1;
    private currentX: number = 0;
    private active: boolean = false;
    private laserMesh: THREE.Mesh | null = null;
    private attackTimer: number = 0;
    private isAttacking: boolean = false;

    constructor(scene: THREE.Scene) {
        this.mesh = this.createBossMesh();
        this.mesh.position.set(0, 5, CAR_INITIAL_Z + 20); // Starts behind and above
        this.mesh.visible = false;
        scene.add(this.mesh);

        this.collider = new THREE.Box3();
    }

    private createBossMesh(): THREE.Group {
        const group = new THREE.Group();
        
        // Massive truck-like pursuit vehicle
        const bodyGeo = new THREE.BoxGeometry(CAR_WIDTH * 2, CAR_HEIGHT * 2, CAR_DEPTH * 1.5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 1,
            roughness: 0,
            emissive: 0xff0000,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Huge glowing red grill
        const grillGeo = new THREE.BoxGeometry(CAR_WIDTH * 1.8, 1, 0.2);
        const grillMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
        const grill = new THREE.Mesh(grillGeo, grillMat);
        grill.position.set(0, 0, -CAR_DEPTH * 0.75);
        group.add(grill);

        // Laser Cannon
        const cannonGeo = new THREE.CylinderGeometry(0.5, 0.8, 2);
        const cannon = new THREE.Mesh(cannonGeo, bodyMat);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.y = 2;
        group.add(cannon);

        // Targeting laser
        const laserGeo = new THREE.CylinderGeometry(0.05, 0.05, 100);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3 });
        this.laserMesh = new THREE.Mesh(laserGeo, laserMat);
        this.laserMesh.rotation.x = Math.PI / 2;
        this.laserMesh.position.set(0, 2, -50);
        this.laserMesh.visible = false;
        group.add(this.laserMesh);

        return group;
    }

    public activate(): void {
        this.active = true;
        this.mesh.visible = true;
        this.mesh.position.z = CAR_INITIAL_Z + 50;
        this.attackTimer = 5;
    }

    public deactivate(): void {
        this.active = false;
        this.mesh.visible = false;
        if (this.laserMesh) this.laserMesh.visible = false;
        this.isAttacking = false;
    }

    public update(deltaTime: number, playerX: number, time: number): void {
        if (!this.active) return;

        // Follow player loosely in Z
        this.mesh.position.z = lerp(this.mesh.position.z, CAR_INITIAL_Z + 15, deltaTime);
        
        // Attack logic
        this.attackTimer -= deltaTime;
        if (!this.isAttacking && this.attackTimer <= 0) {
            this.startAttack();
        }

        if (this.isAttacking) {
            // Charging attack
            if (this.attackTimer > -2) {
                // Track player during charge
                this.targetLane = Math.round((playerX + (4.5 * 1.5)) / 4.5) - 2; // Approximate lane
                const targetX = getLanePositionX(clamp(this.targetLane, 0, LANE_COUNT - 1));
                this.currentX = lerp(this.currentX, targetX, 2 * deltaTime);
                this.mesh.position.x = this.currentX;
                
                // Flicker laser
                if (this.laserMesh) {
                    this.laserMesh.visible = Math.floor(time * 10) % 2 === 0;
                    (this.laserMesh.material as THREE.Material).opacity = 0.3 + (Math.abs(this.attackTimer) / 2) * 0.7;
                }
            } else if (this.attackTimer > -3) {
                // FIRING
                if (this.laserMesh) {
                    this.laserMesh.visible = true;
                    (this.laserMesh.material as THREE.Material).opacity = 1;
                    this.laserMesh.scale.set(5, 1, 5); // Thicken beam
                }
            } else {
                // End attack
                this.isAttacking = false;
                this.attackTimer = 5 + Math.random() * 5;
                if (this.laserMesh) {
                    this.laserMesh.visible = false;
                    this.laserMesh.scale.set(1, 1, 1);
                }
            }
        } else {
            // Hover around
            this.currentX = lerp(this.currentX, Math.sin(time) * 5, deltaTime);
            this.mesh.position.x = this.currentX;
            this.mesh.position.y = 5 + Math.sin(time * 2) * 1;
        }

        this.updateCollider();
    }

    private startAttack(): void {
        this.isAttacking = true;
    }

    private updateCollider(): void {
        // Only dangerous when firing
        if (this.isAttacking && this.attackTimer <= -2 && this.attackTimer > -3) {
            const pos = this.mesh.position;
            this.collider.setFromCenterAndSize(
                new THREE.Vector3(pos.x, 1, pos.z - 50),
                new THREE.Vector3(2, 2, 100)
            );
        } else {
            this.collider.makeEmpty();
        }
    }

    public isActive(): boolean {
        return this.active;
    }

    public isFiring(): boolean {
        return this.isAttacking && this.attackTimer <= -2 && this.attackTimer > -3;
    }
}
