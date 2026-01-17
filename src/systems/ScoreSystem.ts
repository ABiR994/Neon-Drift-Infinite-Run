// src/systems/ScoreSystem.ts
// Removed GAME_SPEED_INITIAL import as gameSpeed property is removed
// import { GAME_SPEED_INITIAL } from '../utils/constants';

export class ScoreSystem {
    private score: number = 0;
    private distanceTraveled: number = 0;
    private timeSurvived: number = 0;
    // private gameSpeed: number = GAME_SPEED_INITIAL; // Removed as its value was never read
    private scoreMultiplier: number = 1; // Future expansion for power-ups etc.

    constructor() {
        this.reset();
    }

    /**
     * Updates the score, distance traveled, and time survived.
     * @param deltaTime The time elapsed since the last frame.
     * @param currentSpeed The current game speed, which affects distance calculation.
     */
    public update(deltaTime: number, currentSpeed: number): void {
        this.timeSurvived += deltaTime;
        // this.gameSpeed = currentSpeed; // Removed
        this.distanceTraveled += currentSpeed * deltaTime; // Distance is proportional to speed and time

        // Score increases based on a combination of time survived and distance.
        // A simple formula: score = (time_survived * X) + (distance_traveled * Y)
        // Adjust multipliers X and Y for desired score progression.
        // For now, let's keep it simple: mainly distance driven, with a time bonus.
        this.score = Math.floor((this.distanceTraveled * 0.1) + (this.timeSurvived * 0.5)) * this.scoreMultiplier;
    }

    /**
     * Returns the current score.
     */
    public getScore(): number {
        return this.score;
    }

    /**
     * Resets the score system to its initial state.
     */
    public reset(): void {
        this.score = 0;
        this.distanceTraveled = 0;
        this.timeSurvived = 0;
        this.scoreMultiplier = 1;
        // Game speed will be set by the Game class when it initializes/resets.
    }

    /**
     * Disposes of any resources held by the score system.
     * For this system, there are no special resources to dispose.
     */
    public dispose(): void {
        // No resources to dispose
    }
}
