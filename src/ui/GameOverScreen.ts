// src/ui/GameOverScreen.ts
import { UI_SELECTORS } from '../utils/constants';
import * as TWEEN from '@tweenjs/tween.js';

export class GameOverScreen {
    private gameOverScreenElement: HTMLElement | null;
    private finalScoreElement: HTMLElement | null;
    private restartButton: HTMLButtonElement | null;
    private homeButton: HTMLButtonElement | null;
    private newHighScoreMessage: HTMLElement | null;
    private onRestartCallback: () => void;
    private onHomeCallback: () => void;
    private displayedFinalScore: { value: number } = { value: 0 };
    private scoreTween: TWEEN.Tween<any> | null = null;
    private currentHighScore: number = 0;

    // Store bound event handlers to properly remove them later
    private handleMouseEnter: () => void;
    private handleMouseLeave: () => void;

    constructor(onRestart: () => void, onHome: () => void) {
        this.gameOverScreenElement = document.querySelector(UI_SELECTORS.GAME_OVER_SCREEN);
        this.finalScoreElement = document.querySelector(UI_SELECTORS.GAME_OVER_FINAL_SCORE_VALUE);
        this.restartButton = document.querySelector(UI_SELECTORS.RESTART_BUTTON) as HTMLButtonElement;
        this.homeButton = document.getElementById('home-button') as HTMLButtonElement;
        this.newHighScoreMessage = document.querySelector(UI_SELECTORS.GAME_OVER_NEW_HIGH_SCORE_MESSAGE);
        this.onRestartCallback = onRestart;
        this.onHomeCallback = onHome;

        // Create bound event handlers
        this.handleMouseEnter = () => this.restartButton?.classList.add('hover');
        this.handleMouseLeave = () => this.restartButton?.classList.remove('hover');

        const storedHighScore = localStorage.getItem('neon_drift_high_score');
        if (storedHighScore) {
            this.currentHighScore = parseInt(storedHighScore, 10);
        }

        if (!this.gameOverScreenElement) {
            console.warn(`GameOverScreen: Game over screen element with selector "${UI_SELECTORS.GAME_OVER_SCREEN}" not found.`);
        }
        if (!this.finalScoreElement) {
            console.warn(`GameOverScreen: Final score element with selector "${UI_SELECTORS.GAME_OVER_FINAL_SCORE_VALUE}" not found.`);
        }
        if (!this.restartButton) {
            console.warn(`GameOverScreen: Restart button element with selector "${UI_SELECTORS.RESTART_BUTTON}" not found.`);
        } else {
            this.restartButton.addEventListener('click', this.onRestartCallback);
            this.restartButton.addEventListener('mouseenter', this.handleMouseEnter);
            this.restartButton.addEventListener('mouseleave', this.handleMouseLeave);
        }

        if (this.homeButton) {
            this.homeButton.addEventListener('click', this.onHomeCallback);
        }

        if (!this.newHighScoreMessage) {
            console.warn(`GameOverScreen: New high score message element with selector "${UI_SELECTORS.GAME_OVER_NEW_HIGH_SCORE_MESSAGE}" not found.`);
        }
        
        this.hide();
    }

    public show(finalScore: number): void {
        if (this.finalScoreElement) {
            let isNewHighScore = false;
            if (finalScore > this.currentHighScore) {
                this.currentHighScore = finalScore;
                localStorage.setItem('neon_drift_high_score', finalScore.toString());
                isNewHighScore = true;
            }

            if (this.scoreTween) {
                this.scoreTween.stop();
            }
            this.displayedFinalScore.value = finalScore;
            if (this.finalScoreElement) {
                this.finalScoreElement.textContent = Math.floor(this.displayedFinalScore.value).toString();
            }
            if (isNewHighScore && this.newHighScoreMessage) {
                this.newHighScoreMessage.classList.remove('hidden');
            }
        }
        if (this.gameOverScreenElement) {
            this.gameOverScreenElement.classList.remove('hidden');
            this.gameOverScreenElement.classList.add('fade-in');
        }
    }

    public hide(): void {
        if (this.gameOverScreenElement) {
            this.gameOverScreenElement.classList.add('hidden');
            this.gameOverScreenElement.classList.remove('fade-in');
        }
        if (this.newHighScoreMessage) {
            this.newHighScoreMessage.classList.add('hidden');
        }
        if (this.scoreTween) { // ADD THIS BLOCK
            this.scoreTween.stop();
            this.scoreTween = null; // Clear the reference
        }
    }

    public dispose(): void {
        if (this.restartButton) {
            this.restartButton.removeEventListener('click', this.onRestartCallback);
            this.restartButton.removeEventListener('mouseenter', this.handleMouseEnter);
            this.restartButton.removeEventListener('mouseleave', this.handleMouseLeave);
        }
        if (this.homeButton) {
            this.homeButton.removeEventListener('click', this.onHomeCallback);
        }
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = '0';
        }
        if (this.newHighScoreMessage) {
            this.newHighScoreMessage.classList.add('hidden');
        }
    }
}
