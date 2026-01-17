// src/core/Game.ts
import { SceneManager } from './SceneManager';
import { Input } from './Input';
import { Road } from '../entities/Road';
import { Car } from '../entities/Car';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { HUD } from '../ui/HUD';
import { GameOverScreen } from '../ui/GameOverScreen';
import {
    GAME_SPEED_INITIAL,
    GAME_SPEED_MAX,
    GAME_SPEED_INCREMENT_PER_SECOND,
    NEAR_MISS_SHAKE_INTENSITY, // New
    NEAR_MISS_FLASH_DURATION, // New
    COLLISION_SHAKE_INTENSITY, // New
    COLLISION_FLASH_DURATION, // New
    COLLISION_FREEZE_DURATION // New
} from '../utils/constants';

// Define possible game states for clarity and control flow
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

    private lastFrameTime: DOMHighResTimeStamp = 0; // Timestamp of the last animation frame
    private animationFrameId: number | null = null; // ID to cancel the animation frame
    private currentSpeed: number = GAME_SPEED_INITIAL; // Current game speed
    private gameState: GameState = 'playing'; // Initial game state

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        this.input = Input.getInstance(); // Singleton instance for input handling
        this.road = new Road(this.sceneManager.getScene());
        this.car = new Car(this.sceneManager.getScene());
        this.obstacleSpawner = new ObstacleSpawner(this.sceneManager.getScene());
        this.scoreSystem = new ScoreSystem();
        this.hud = new HUD();
        this.gameOverScreen = new GameOverScreen(this.restartGame.bind(this)); // Pass restart callback

        // Initialize collision system with car, obstacles from spawner, and a callback for collision
        this.collisionSystem = new CollisionSystem(
            this.car,
            this.obstacleSpawner.getObstacles(),
            this.endGame.bind(this),
            this.handleNearMiss.bind(this) // New: Pass a callback for near misses
        );

        this.init(); // Initialize game components to their starting state
    }

    /**
     * Initializes or resets the game state and all its components to their starting conditions.
     * This method is crucial for clean game restarts without reloading the page.
     */
    public init(): void {
        this.gameState = 'playing'; // Set game state to playing
        this.currentSpeed = GAME_SPEED_INITIAL; // Reset speed
        this.lastFrameTime = performance.now(); // Reset frame time for delta calculation

        // Reset all individual game components
        this.road.reset(); // This is the method we need to add to Road.ts
        this.car.reset();
        this.obstacleSpawner.reset();
        this.scoreSystem.reset();
        this.hud.reset();
        this.gameOverScreen.hide(); // Ensure game over screen is hidden

        // Update the collision system with the (now empty) list of obstacles
        this.collisionSystem.setObstacles(this.obstacleSpawner.getObstacles());
    }

    /**
     * Starts the main game loop by requesting the first animation frame.
     * If a loop is already running, it cancels it first to prevent duplicates.
     */
    public start(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * The core animation loop. This function is called repeatedly by the browser.
     * It calculates deltaTime, updates game logic if playing, and then renders the scene.
     * @param currentTime The DOMHighResTimeStamp provided by `requestAnimationFrame`.
     */
    private animate(currentTime: DOMHighResTimeStamp): void {
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert milliseconds to seconds
        this.lastFrameTime = currentTime;

        if (this.gameState === 'playing') {
            this.update(deltaTime, currentTime);
        }

        this.render(); // Always render, even if paused, to display static scene or UI

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Updates all game logic and state based on the elapsed time.
     * @param deltaTime The time elapsed since the last frame in seconds.
     * @param currentTime The total elapsed time, for pulsation and shake effects.
     */
    private update(deltaTime: number, currentTime: DOMHighResTimeStamp): void {
        // Gradually increase game speed over time, capped at MAX_SPEED
        this.currentSpeed = Math.min(
            GAME_SPEED_MAX,
            this.currentSpeed + GAME_SPEED_INCREMENT_PER_SECOND * deltaTime
        );

        // Handle car movement input (only registers once per key press)
        if (this.input.isMoveLeftJustPressed()) {
            this.car.moveLeft();
        } else if (this.input.isMoveRightJustPressed()) {
            this.car.moveRight();
        }
        // Optional boost not implemented yet as per spec: "W / Arrow Up (optional) → Slight forward boost"

        // Update all game components
        this.car.update(deltaTime, currentTime / 1000); // Pass current time for car animations
        this.road.update(deltaTime, this.currentSpeed, currentTime / 1000); // Pass current time in seconds for pulsation
        this.obstacleSpawner.update(deltaTime, this.currentSpeed, currentTime); // Pass current time for obstacle visuals
        // Ensure the collision system always checks against the most current list of obstacles
        this.collisionSystem.setObstacles(this.obstacleSpawner.getObstacles());
        this.collisionSystem.update(); // Perform collision checks
        this.scoreSystem.update(deltaTime, this.currentSpeed);

        // Update scene environment based on speed and time
        this.sceneManager.updateEnvironment(this.currentSpeed, currentTime / 1000, deltaTime);

        // Update the HUD display
        this.hud.updateScore(this.scoreSystem.getScore());

        // Clear "just pressed" keys for the next frame
        this.input.clearJustPressedKeys();
    }

    /**
     * Renders the current state of the 3D scene using the SceneManager.
     */
    private render(): void {
        this.sceneManager.render();
    }

    /**
     * Transitions the game to the 'gameOver' state.
     * Stops the animation loop and displays the game over screen with the final score.
     */
    private endGame(): void {
        this.gameState = 'gameOver';

        // Trigger collision feedback
        this.sceneManager.triggerDramaticShake(COLLISION_SHAKE_INTENSITY);
        this.sceneManager.triggerCollisionFlash(COLLISION_FLASH_DURATION);

        // Implement freeze-frame effect
        setTimeout(() => {
            if (this.animationFrameId !== null) {
                cancelAnimationFrame(this.animationFrameId); // Stop the animation loop
                this.animationFrameId = null;
            }
            this.gameOverScreen.show(this.scoreSystem.getScore()); // Display final score
        }, COLLISION_FREEZE_DURATION * 1000); // Convert seconds to milliseconds
    }

    /**
     * Restarts the game. This is typically called when the player clicks the restart button.
     */
    private restartGame(): void {
        this.init(); // Reset all game components
        this.start(); // Start a new game loop
    }

    public getCurrentSpeed(): number {
        return this.currentSpeed;
    }

    private handleNearMiss(): void {
        // Trigger small camera shake and light flash
        this.sceneManager.triggerSmallShake(NEAR_MISS_SHAKE_INTENSITY);
        this.sceneManager.triggerLightFlash(NEAR_MISS_FLASH_DURATION);
    }

    /**
     * Disposes of all game components and their associated resources to prevent memory leaks.
     * This is called when the game instance is no longer needed (e.g., before a full page reload, though not used here).
     */
    public dispose(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Dispose individual components
        this.input.dispose();
        this.road.dispose();
        this.car.dispose(this.sceneManager.getScene()); // Car needs the scene to remove its mesh
        this.obstacleSpawner.dispose();
        this.collisionSystem.dispose();
        this.scoreSystem.dispose();
        this.hud.dispose();
        this.gameOverScreen.dispose();
        this.sceneManager.dispose(); // SceneManager disposes its renderer and event listeners
    }
}