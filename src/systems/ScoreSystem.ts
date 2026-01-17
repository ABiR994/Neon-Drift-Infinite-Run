// src/systems/ScoreSystem.ts
import { MILESTONE_INTERVAL } from '../utils/constants';

export class ScoreSystem {
    private score: number = 0;
    private distanceTraveled: number = 0;
    private timeSurvived: number = 0;
    private scoreMultiplier: number = 1;
    private onMilestoneReachedCallback?: (milestoneScore: number) => void;
    private onScoreChangedCallback?: (newScore: number) => void; // New: Callback for score changes

    constructor() {
        this.reset();
    }

    public setOnMilestoneReachedCallback(callback: (milestoneScore: number) => void): void {
        this.onMilestoneReachedCallback = callback;
    }

    public setOnScoreChangedCallback(callback: (newScore: number) => void): void {
        this.onScoreChangedCallback = callback;
    }

    public update(deltaTime: number, currentSpeed: number): void {
        const oldScore = this.score; // Store old score before updating

        this.timeSurvived += deltaTime;
        this.distanceTraveled += currentSpeed * deltaTime;
        this.score = Math.max(0, Math.floor((this.distanceTraveled * 0.1) + (this.timeSurvived * 0.5)) * this.scoreMultiplier);
        
        if (this.score !== oldScore && this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.score);
        }

        // Check for milestones
        const currentMilestone = Math.floor(this.score / MILESTONE_INTERVAL);
        const lastMilestone = Math.floor(oldScore / MILESTONE_INTERVAL);

        if (currentMilestone > lastMilestone && currentMilestone > 0) {
            // A new milestone has been reached
            const milestoneScore = currentMilestone * MILESTONE_INTERVAL;
            if (this.onMilestoneReachedCallback) {
                this.onMilestoneReachedCallback(milestoneScore);
            }
        }
    }

    public addPerfectDodgeBonus(bonus: number): void {
        const oldScore = this.score;
        this.score += bonus;
        if (this.onScoreChangedCallback) {
            this.onScoreChangedCallback(this.score);
        }
        // Also check for milestones after a bonus
        const currentMilestone = Math.floor(this.score / MILESTONE_INTERVAL);
        const lastMilestone = Math.floor(oldScore / MILESTONE_INTERVAL);
        if (currentMilestone > lastMilestone && currentMilestone > 0) {
            const milestoneScore = currentMilestone * MILESTONE_INTERVAL;
            if (this.onMilestoneReachedCallback) {
                this.onMilestoneReachedCallback(milestoneScore);
            }
        }
    }

    /**
     * Returns the current score.
     */
    public getScore(): number {
        console.log('ScoreSystem.getScore() returning:', this.score); // DEBUG
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
