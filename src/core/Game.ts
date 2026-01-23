// src/core/Game.ts
import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { Input } from './Input';
import { Road } from '../entities/Road';
import { Car } from '../entities/Car';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { HUD } from '../ui/HUD';
import { GameOverScreen } from '../ui/GameOverScreen';
import { FloatingTextManager } from '../ui/FloatingTextManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { PowerUpSpawner } from '../systems/PowerUpSpawner';
import {
    GAME_SPEED_INITIAL,
    GAME_SPEED_MAX,
    GAME_SPEED_INCREMENT_PER_SECOND,
    NEAR_MISS_SHAKE_INTENSITY,
    NEAR_MISS_FLASH_DURATION,
    COLLISION_SHAKE_INTENSITY,
    COLLISION_FLASH_DURATION,
    COLLISION_FREEZE_DURATION,
    COLLISION_PARTICLE_COUNT,
    POWERUP_DURATION_BOOST,
    POWERUP_DURATION_MULTIPLIER,
    POWERUP_DURATION_MAGNET,
    POWERUP_BOOST_SPEED_MULT,
    HEAT_INCREASE_RATE,
    HEAT_DECREASE_RATE,
    HEAT_OVERHEAT_COOLDOWN,
    MANUAL_BOOST_SPEED_MULT
} from '../utils/constants';
import { getNormalizedSpeed } from '../utils/helpers';

import * as TWEEN from '@tweenjs/tween.js';

type GameState = 'playing' | 'gameOver' | 'paused';

export class Game {
    private sceneManager: SceneManager;
    private input: Input;
    private road: Road;
    private car: Car;
    private obstacleSpawner: ObstacleSpawner;
    private collisionSystem: CollisionSystem;
    private scoreSystem: ScoreSystem;
    private hud: HUD;
    private gameOverScreen: GameOverScreen;
    private floatingTextManager: FloatingTextManager;
    private particleSystem: ParticleSystem;
    private powerUpSpawner: PowerUpSpawner;

    private lastFrameTime: DOMHighResTimeStamp = 0;
    private animationFrameId: number | null = null;
    private currentSpeed: number = GAME_SPEED_INITIAL;
    private gameState: GameState = 'playing';

    // Power-up state
    private isShieldActive: boolean = false;
    private boostTimer: number = 0;
    private multiplierTimer: number = 0;
    private magnetTimer: number = 0;

    // Heat state
    private heat: number = 0; // 0 to 100
    private isOverheated: boolean = false;
    private overheatCooldownTimer: number = 0;

    // UI elements for visual effects
    private uiContainer: HTMLElement | null = null;
    private speedLinesElement: HTMLElement | null = null;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        this.input = Input.getInstance();
        this.road = new Road(this.sceneManager.getScene());
        this.car = new Car(this.sceneManager.getScene());
        this.obstacleSpawner = new ObstacleSpawner(this.sceneManager.getScene());
        this.scoreSystem = new ScoreSystem();
        this.hud = new HUD();
        this.gameOverScreen = new GameOverScreen(this.restartGame.bind(this));
        this.floatingTextManager = new FloatingTextManager();
        this.particleSystem = new ParticleSystem(this.sceneManager.getScene());
        this.powerUpSpawner = new PowerUpSpawner(this.sceneManager.getScene());

        // Get UI elements for visual effects
        this.uiContainer = document.getElementById('ui-container');
        this.speedLinesElement = document.getElementById('speed-lines');

        this.collisionSystem = new CollisionSystem(
            this.car,
            this.obstacleSpawner.getObstacles(),
            this.handleCollision.bind(this),
            this.handleNearMiss.bind(this)
        );

        this.scoreSystem.setOnMilestoneReachedCallback(this.handleMilestoneReached.bind(this));

        // Don't call init() here - wait for start screen interaction
        // this.init() will be called from main.ts when the player starts
    }

    public init(): void {
        this.gameState = 'playing';
        this.currentSpeed = GAME_SPEED_INITIAL;
        this.lastFrameTime = performance.now();

        this.isShieldActive = false;
        this.boostTimer = 0;
        this.multiplierTimer = 0;
        this.magnetTimer = 0;

        this.heat = 0;
        this.isOverheated = false;
        this.overheatCooldownTimer = 0;

        this.road.reset();
        this.car.reset();
        this.obstacleSpawner.reset();
        this.powerUpSpawner.reset();
        this.scoreSystem.reset();
        this.hud.reset();
        this.hud.updateScore(this.scoreSystem.getScore());
        this.gameOverScreen.hide();

        this.collisionSystem.setObstacles(this.obstacleSpawner.getObstacles());
    }

    public start(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    private animate(currentTime: DOMHighResTimeStamp): void {
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        TWEEN.update(currentTime); // Call TWEEN.update here, always

        if (this.gameState === 'playing') {
            this.update(deltaTime, currentTime);
        }

        // Render the scene even if game is over, so UI can animate
        this.render(); 

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    private update(deltaTime: number, currentTime: DOMHighResTimeStamp): void {
        // Update timers
        if (this.boostTimer > 0) this.boostTimer -= deltaTime;
        if (this.multiplierTimer > 0) this.multiplierTimer -= deltaTime;
        if (this.magnetTimer > 0) this.magnetTimer -= deltaTime;

        // Manual Boost & Heat logic
        const isAttemptingBoost = this.input.isBoosting() && !this.isOverheated;
        
        if (isAttemptingBoost) {
            this.heat = Math.min(100, this.heat + HEAT_INCREASE_RATE * deltaTime);
            if (this.heat >= 100) {
                this.isOverheated = true;
                this.overheatCooldownTimer = HEAT_OVERHEAT_COOLDOWN;
            }
        } else {
            if (this.isOverheated) {
                this.overheatCooldownTimer -= deltaTime;
                if (this.overheatCooldownTimer <= 0) {
                    this.isOverheated = false;
                }
            }
            this.heat = Math.max(0, this.heat - HEAT_DECREASE_RATE * deltaTime);
        }

        const boostPowerUpActive = this.boostTimer > 0;
        const speedMultiplier = (boostPowerUpActive ? POWERUP_BOOST_SPEED_MULT : (isAttemptingBoost ? MANUAL_BOOST_SPEED_MULT : 1));
        
        this.currentSpeed = Math.min(
            GAME_SPEED_MAX,
            this.currentSpeed + GAME_SPEED_INCREMENT_PER_SECOND * deltaTime
        );

        const actualSpeed = this.currentSpeed * speedMultiplier;

        if (this.input.isMoveLeftJustPressed()) {
            this.car.moveLeft();
        } else if (this.input.isMoveRightJustPressed()) {
            this.car.moveRight();
        }

        this.car.update(deltaTime, currentTime / 1000, actualSpeed, this.particleSystem);
        this.car.setShieldVisible(this.isShieldActive);
        
        this.road.update(deltaTime, actualSpeed, currentTime / 1000);
        this.obstacleSpawner.update(deltaTime, actualSpeed, currentTime);
        this.powerUpSpawner.update(deltaTime, actualSpeed, currentTime / 1000);
        
        this.collisionSystem.setObstacles(this.obstacleSpawner.getObstacles());
        this.checkPowerUpCollisions();
        
        // Invincible during Boost Power-up ONLY (Manual boost doesn't grant invincibility)
        if (!boostPowerUpActive) {
            this.collisionSystem.update();
        }
        
        const scoreMultiplier = this.multiplierTimer > 0 ? 2 : 1;
        this.scoreSystem.update(deltaTime, actualSpeed * scoreMultiplier);

        this.sceneManager.updateEnvironment(actualSpeed, currentTime / 1000, deltaTime);

        this.hud.updateScore(this.scoreSystem.getScore());
        this.hud.updateStatus({
            shield: this.isShieldActive,
            boost: boostPowerUpActive,
            multiplier: this.multiplierTimer > 0,
            magnet: this.magnetTimer > 0
        });
        this.hud.updateHeat(this.heat, this.isOverheated);
        this.hud.update(actualSpeed);

        // Update speed lines visibility based on speed
        this.updateSpeedLines();

        this.floatingTextManager.update(currentTime);
        this.particleSystem.update(deltaTime);

        this.input.clearJustPressedKeys();
    }

    private checkPowerUpCollisions(): void {
        const powerUps = this.powerUpSpawner.getPowerUps();
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const p = powerUps[i];
            
            // Magnet effect: pull power-ups toward car
            if (this.magnetTimer > 0) {
                const distZ = p.mesh.position.z - this.car.mesh.position.z;
                if (distZ < 20 && distZ > 0) {
                    const dir = this.car.mesh.position.clone().sub(p.mesh.position).normalize();
                    p.mesh.position.add(dir.multiplyScalar(20 * (1 / 60))); // Basic pull
                }
            }

            if (this.car.collider.intersectsBox(p.collider)) {
                this.handlePowerUpCollection(p);
                this.powerUpSpawner.removePowerUp(p);
            }
        }
    }

    private handlePowerUpCollection(p: any): void {
        const text = p.type;
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        this.floatingTextManager.spawnText(text, x, y);

        switch (p.type) {
            case 'SHIELD':
                this.isShieldActive = true;
                break;
            case 'BOOST':
                this.boostTimer = POWERUP_DURATION_BOOST;
                this.sceneManager.triggerLightFlash(0.5);
                break;
            case 'MULTIPLIER':
                this.multiplierTimer = POWERUP_DURATION_MULTIPLIER;
                break;
            case 'MAGNET':
                this.magnetTimer = POWERUP_DURATION_MAGNET;
                break;
        }
    }

    /**
     * Updates the speed lines overlay visibility based on current speed.
     */
    private updateSpeedLines(): void {
        if (this.speedLinesElement) {
            const t = getNormalizedSpeed(this.currentSpeed);
            if (t > 0.5) {
                this.speedLinesElement.classList.add('active');
                this.speedLinesElement.style.opacity = String((t - 0.5) * 2);
            } else {
                this.speedLinesElement.classList.remove('active');
            }
        }
    }

    private handleCollision(obstacle: any): void {
        if (this.isShieldActive) {
            this.isShieldActive = false;
            this.car.setShieldVisible(false);
            this.sceneManager.triggerSmallShake(0.1);
            this.floatingTextManager.spawnText("SHIELD BROKEN", window.innerWidth / 2, window.innerHeight / 2);
            
            // Push obstacle away or destroy it?
            // For now, let's just make the car invincible for a tiny bit to pass through
            this.boostTimer = 0.5; 
            return;
        }
        this.endGame();
    }

    private render(): void {
        this.sceneManager.render();
    }

    private endGame(): void {
        this.gameState = 'gameOver';
        const finalGameScore = this.scoreSystem.getScore(); // Capture score immediately

        this.sceneManager.triggerDramaticShake(COLLISION_SHAKE_INTENSITY);
        this.sceneManager.triggerCollisionFlash(COLLISION_FLASH_DURATION);
        this.sceneManager.triggerGlitch(COLLISION_FREEZE_DURATION * 2);

        // Spawn collision particles
        const carPos = this.car.mesh.position.clone();
        for (let i = 0; i < COLLISION_PARTICLE_COUNT; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
            );
            const color = new THREE.Color(0xff0044); // Reddish-pink for collision
            if (Math.random() > 0.5) color.setHex(0xffaa00); // Orange sparks
            
            this.particleSystem.spawn(carPos, velocity, color, 1.5, 0.8);
        }

        setTimeout(() => {
            if (this.animationFrameId !== null) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.gameOverScreen.show(finalGameScore); // Pass captured score
        }, COLLISION_FREEZE_DURATION * 1000);
    }

    private restartGame(): void {
        this.init();
        this.start();
    }

    public getCurrentSpeed(): number {
        return this.currentSpeed;
    }

    private handleNearMiss(): void {
        this.sceneManager.triggerSmallShake(NEAR_MISS_SHAKE_INTENSITY);
        this.sceneManager.triggerLightFlash(NEAR_MISS_FLASH_DURATION);
        
        // Trigger UI shake effect
        if (this.uiContainer) {
            this.uiContainer.classList.add('shake');
            setTimeout(() => {
                this.uiContainer?.classList.remove('shake');
            }, 300);
        }
    }

    private handleMilestoneReached(milestoneScore: number): void {
        const text = `+${milestoneScore}!`;
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        this.floatingTextManager.spawnText(text, x, y);
    }

    public dispose(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.input.dispose();
        this.road.dispose();
        this.car.dispose(this.sceneManager.getScene());
        this.obstacleSpawner.dispose();
        this.collisionSystem.dispose();
        this.scoreSystem.dispose();
        this.hud.dispose();
        this.gameOverScreen.dispose();
        this.floatingTextManager.dispose();
        this.particleSystem.dispose(this.sceneManager.getScene());
        this.sceneManager.dispose();
    }
}
