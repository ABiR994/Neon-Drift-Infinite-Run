// src/systems/EnvironmentSystem.ts
import * as THREE from 'three';
import { ROAD_LENGTH, CAR_INITIAL_Z } from '../utils/constants';

export class EnvironmentSystem {
    private scene: THREE.Scene;
    private buildings: THREE.Group[] = [];
    private billboards: THREE.Group[] = [];
    private drones: THREE.Group[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.init();
    }

    private init(): void {
        // Pre-populate some buildings
        for (let i = 0; i < 15; i++) {
            this.spawnBuilding(CAR_INITIAL_Z - (i * 40));
        }
    }

    private spawnBuilding(z: number): void {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (25 + Math.random() * 30);
        
        const group = new THREE.Group();
        
        const width = 10 + Math.random() * 15;
        const height = 40 + Math.random() * 80;
        const depth = 15 + Math.random() * 15;
        
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x050510,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x00ffff,
            emissiveIntensity: 0.05
        });
        
        const building = new THREE.Mesh(geo, mat);
        building.position.y = height / 2;
        group.add(building);
        
        // Add neon windows
        const windowGeo = new THREE.PlaneGeometry(width + 0.1, 1);
        const windowMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0x00ffff : 0xff00ff,
            emissive: Math.random() > 0.5 ? 0x00ffff : 0xff00ff,
            emissiveIntensity: 1
        });
        
        for (let h = 5; h < height - 5; h += 8) {
            if (Math.random() > 0.3) {
                const win = new THREE.Mesh(windowGeo, windowMat);
                win.position.y = h - height / 2;
                win.position.z = depth / 2 + 0.05;
                building.add(win);
            }
        }
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        this.buildings.push(group);
    }

    private spawnBillboard(z: number): void {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * 15;
        
        const group = new THREE.Group();
        
        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 15);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 7.5;
        group.add(pole);
        
        // Board
        const boardGeo = new THREE.BoxGeometry(10, 6, 0.5);
        const color = Math.random() > 0.5 ? 0x00ffff : 0xff00ff;
        const boardMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: color,
            emissiveIntensity: 2
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 15;
        group.add(board);
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        this.billboards.push(group);
    }

    public update(deltaTime: number, speed: number, time: number): void {
        const scrollAmount = speed * deltaTime;

        // Update buildings
        for (let i = this.buildings.length - 1; i >= 0; i--) {
            const b = this.buildings[i];
            b.position.z += scrollAmount;
            if (b.position.z > CAR_INITIAL_Z + 50) {
                b.position.z -= 15 * 40; // Teleport back
                // Randomize X and side again for variety
                const side = Math.random() > 0.5 ? 1 : -1;
                b.position.x = side * (25 + Math.random() * 30);
            }
        }

        // Update billboards
        if (Math.random() < 0.01 && this.billboards.length < 5) {
            this.spawnBillboard(CAR_INITIAL_Z - ROAD_LENGTH);
        }

        for (let i = this.billboards.length - 1; i >= 0; i--) {
            const b = this.billboards[i];
            b.position.z += scrollAmount;
            if (b.position.z > CAR_INITIAL_Z + 50) {
                this.scene.remove(b);
                this.billboards.splice(i, 1);
            }
        }

        // Update Drones
        if (Math.random() < 0.005 && this.drones.length < 3) {
            this.spawnDrone();
        }

        for (let i = this.drones.length - 1; i >= 0; i--) {
            const d = this.drones[i];
            d.position.z += (speed * 0.8) * deltaTime; // Drones fly slightly slower than road
            d.position.x += Math.sin(time + i) * 2 * deltaTime;
            d.position.y = 15 + Math.sin(time * 2 + i) * 2;
            
            if (d.position.z > CAR_INITIAL_Z + 50) {
                this.scene.remove(d);
                this.drones.splice(i, 1);
            }
        }
    }

    private spawnDrone(): void {
        const group = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(1, 0.2, 1);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        group.position.set((Math.random() - 0.5) * 40, 15, CAR_INITIAL_Z - ROAD_LENGTH);
        this.scene.add(group);
        this.drones.push(group);
    }

    public reset(): void {
        this.billboards.forEach(b => this.scene.remove(b));
        this.billboards = [];
        this.drones.forEach(d => this.scene.remove(d));
        this.drones = [];
        // Buildings are just repositioned
        for (let i = 0; i < this.buildings.length; i++) {
            this.buildings[i].position.z = CAR_INITIAL_Z - (i * 40);
        }
    }

    public dispose(): void {
        this.buildings.forEach(b => {
            this.scene.remove(b);
            b.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
        });
        this.billboards.forEach(b => {
            this.scene.remove(b);
            b.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
        });
        this.drones.forEach(d => {
            this.scene.remove(d);
            d.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
        });
    }
}
