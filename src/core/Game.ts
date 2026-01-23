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
import {
    GAME_SPEED_INITIAL,
    GAME_SPEED_MAX,
    GAME_SPEED_INCREMENT_PER_SECOND,
    NEAR_MISS_SHAKE_INTENSITY,
    NEAR_MISS_FLASH_DURATION,
    COLLISION_SHAKE_INTENSITY,
    COLLISION_FLASH_DURATION,
    COLLISION_FREEZE_DURATION,
    COLLISION_PARTICLE_COUNT
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

    private lastFrameTime: DOMHighResTimeStamp = 0;
    private animationFrameId: number | null = null;
    private currentSpeed: number = GAME_SPEED_INITIAL;
    private gameState: GameState = 'playing';

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

        // Get UI elements for visual effects
        this.uiContainer = document.getElementById('ui-container');
        this.speedLinesElement = document.getElementById('speed-lines');

        this.collisionSystem = new CollisionSystem(
            this.car,
            this.obstacleSpawner.getObstacles(),
            this.endGame.bind(this),
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

        this.road.reset();
        this.car.reset();
        this.obstacleSpawner.reset();
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
        this.currentSpeed = Math.min(
            GAME_SPEED_MAX,
            this.currentSpeed + GAME_SPEED_INCREMENT_PER_SECOND * deltaTime
        );

        if (this.input.isMoveLeftJustPressed()) {
            this.car.moveLeft();
        } else if (this.input.isMoveRightJustPressed()) {
            this.car.moveRight();
        }

        this.car.update(deltaTime, currentTime / 1000, this.currentSpeed, this.particleSystem);
        this.road.update(deltaTime, this.currentSpeed, currentTime / 1000);
        this.obstacleSpawner.update(deltaTime, this.currentSpeed, currentTime);
        this.collisionSystem.setObstacles(this.obstacleSpawner.getObstacles());
        this.collisionSystem.update();
        this.scoreSystem.update(deltaTime, this.currentSpeed);

        this.sceneManager.updateEnvironment(this.currentSpeed, currentTime / 1000, deltaTime);

        this.hud.updateScore(this.scoreSystem.getScore());
        this.hud.update(this.currentSpeed);

        // Update speed lines visibility based on speed
        this.updateSpeedLines();

        this.floatingTextManager.update(currentTime);
        this.particleSystem.update(deltaTime);

        this.input.clearJustPressedKeys();
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
