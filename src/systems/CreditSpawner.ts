// src/systems/CreditSpawner.ts
import * as THREE from 'three';
import { Credit } from '../entities/Credit';
import {
    ROAD_LENGTH,
    LANE_COUNT,
    CAR_INITIAL_Z,
    CREDIT_SPAWN_CHANCE,
    CREDIT_SPAWN_INTERVAL
} from '../utils/constants';
import { getRandomInt } from '../utils/helpers';

export class CreditSpawner {
    private credits: Credit[] = [];
    private scene: THREE.Scene;
    private timeSinceLastSpawn: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public update(deltaTime: number, gameSpeed: number, time: number): void {
        this.timeSinceLastSpawn += deltaTime;

        if (this.timeSinceLastSpawn >= CREDIT_SPAWN_INTERVAL) {
            this.timeSinceLastSpawn = 0;
            if (Math.random() < CREDIT_SPAWN_CHANCE) {
                this.spawnCredit();
            }
        }

        for (let i = this.credits.length - 1; i >= 0; i--) {
            const credit = this.credits[i];
            credit.update(deltaTime, gameSpeed, time);
            if (credit.isOutOfView()) {
                credit.dispose(this.scene);
                this.credits.splice(i, 1);
            }
        }
    }

    private spawnCredit(): void {
        const lane = getRandomInt(0, LANE_COUNT - 1);
        const spawnZ = CAR_INITIAL_Z - ROAD_LENGTH;
        
        const credit = new Credit(this.scene, lane, spawnZ);
        this.credits.push(credit);
    }

    public getCredits(): Credit[] {
        return this.credits;
    }

    public removeCredit(credit: Credit): void {
        const index = this.credits.indexOf(credit);
        if (index !== -1) {
            credit.dispose(this.scene);
            this.credits.splice(index, 1);
        }
    }

    public reset(): void {
        for (const credit of this.credits) {
            credit.dispose(this.scene);
        }
        this.credits = [];
        this.timeSinceLastSpawn = 0;
    }

    public dispose(): void {
        this.reset();
    }
}
