// src/systems/PowerUpSpawner.ts
import * as THREE from 'three';
import { PowerUp } from '../entities/PowerUp';
import type { PowerUpType } from '../entities/PowerUp';
import {
    ROAD_LENGTH,
    LANE_COUNT,
    CAR_INITIAL_Z,
    POWERUP_SPAWN_CHANCE,
    POWERUP_SPAWN_INTERVAL
} from '../utils/constants';
import { getRandomInt } from '../utils/helpers';

export class PowerUpSpawner {
    private powerUps: PowerUp[] = [];
    private scene: THREE.Scene;
    private timeSinceLastSpawn: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public update(deltaTime: number, gameSpeed: number, time: number): void {
        this.timeSinceLastSpawn += deltaTime;

        if (this.timeSinceLastSpawn >= POWERUP_SPAWN_INTERVAL) {
            this.timeSinceLastSpawn = 0;
            if (Math.random() < POWERUP_SPAWN_CHANCE) {
                this.spawnPowerUp();
            }
        }

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.update(deltaTime, gameSpeed, time);
            if (p.isOutOfView()) {
                p.dispose(this.scene);
                this.powerUps.splice(i, 1);
            }
        }
    }

    private spawnPowerUp(): void {
        const lane = getRandomInt(0, LANE_COUNT - 1);
        const spawnZ = CAR_INITIAL_Z - ROAD_LENGTH;
        
        const types: PowerUpType[] = ['SHIELD', 'BOOST', 'MULTIPLIER', 'MAGNET'];
        const type = types[getRandomInt(0, types.length - 1)];
        
        const p = new PowerUp(this.scene, type, lane, spawnZ);
        this.powerUps.push(p);
    }

    public getPowerUps(): PowerUp[] {
        return this.powerUps;
    }

    public removePowerUp(p: PowerUp): void {
        const index = this.powerUps.indexOf(p);
        if (index !== -1) {
            p.dispose(this.scene);
            this.powerUps.splice(index, 1);
        }
    }

    public reset(): void {
        for (const p of this.powerUps) {
            p.dispose(this.scene);
        }
        this.powerUps = [];
        this.timeSinceLastSpawn = 0;
    }

    public dispose(): void {
        this.reset();
    }
}
