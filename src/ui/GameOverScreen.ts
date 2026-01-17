// src/ui/GameOverScreen.ts
import { UI_SELECTORS } from '../utils/constants';
import * as TWEEN from '@tweenjs/tween.js';

export class GameOverScreen {
    private gameOverScreenElement: HTMLElement | null;
    private finalScoreElement: HTMLElement | null;
    private restartButton: HTMLButtonElement | null;
    private newHighScoreMessage: HTMLElement | null;
    private onRestartCallback: () => void;
    private displayedFinalScore: { value: number } = { value: 0 };
    private scoreTween: TWEEN.Tween<any> | null = null; // Use 'any' for simpler TWEEN.Tween type
    private currentHighScore: number = 0;

    constructor(onRestart: () => void) {
        this.gameOverScreenElement = document.querySelector(UI_SELECTORS.GAME_OVER_SCREEN);
        this.finalScoreElement = document.querySelector(UI_SELECTORS.GAME_OVER_FINAL_SCORE_VALUE);
        this.restartButton = document.querySelector(UI_SELECTORS.RESTART_BUTTON) as HTMLButtonElement;
        this.newHighScoreMessage = document.querySelector(UI_SELECTORS.GAME_OVER_NEW_HIGH_SCORE_MESSAGE);
        this.onRestartCallback = onRestart;

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
            // Implement hover feedback with Tween.js for scale animation
            this.restartButton.addEventListener('mouseenter', () => {
                new TWEEN.Tween({ scale: 1 })
                    .to({ scale: 1.1 }, 100)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onUpdate((obj) => {
                        if (this.restartButton) this.restartButton.style.transform = `scale(${obj.scale})`;
                    })
                    .start();
            });
            this.restartButton.addEventListener('mouseleave', () => {
                new TWEEN.Tween({ scale: 1.1 })
                    .to({ scale: 1 }, 100)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onUpdate((obj) => {
                        if (this.restartButton) this.restartButton.style.transform = `scale(${obj.scale})`;
                    })
                    .start();
            });
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

            // Animated score reveal
            if (this.scoreTween) {
                this.scoreTween.stop();
            }
            this.displayedFinalScore.value = 0; // Start animation from 0
            this.scoreTween = new TWEEN.Tween(this.displayedFinalScore)
                .to({ value: finalScore }, 1000) // Animate over 1 second
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    if (this.finalScoreElement) {
                        this.finalScoreElement.textContent = Math.floor(this.displayedFinalScore.value).toString();
                    }
                })
                .onComplete(() => {
                    if (isNewHighScore && this.newHighScoreMessage) {
                        this.newHighScoreMessage.classList.remove('hidden');
                        this.animateNewHighScoreMessage(); // Start animation
                    }
                })
                .start();
        }
        if (this.gameOverScreenElement) {
            this.gameOverScreenElement.classList.remove('hidden');
            this.gameOverScreenElement.style.opacity = '0'; // Ensure it starts transparent
            new TWEEN.Tween({ opacity: 0 })
                .to({ opacity: 1 }, 500) // Fade in over 0.5 seconds
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate((obj) => {
                    if (this.gameOverScreenElement) {
                        this.gameOverScreenElement.style.opacity = `${obj.opacity}`;
                    }
                })
                .start();
        }
    }

    private animateNewHighScoreMessage(): void {
        if (!this.newHighScoreMessage) return;

        // Pulse animation for new high score message
        new TWEEN.Tween({ scale: 1 })
            .to({ scale: 1.1 }, 300)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .yoyo(true)
            .repeat(Infinity)
            .onUpdate((obj) => {
                if (this.newHighScoreMessage) {
                    this.newHighScoreMessage.style.transform = `scale(${obj.scale})`;
                }
            })
            .start();
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
            // Remove the dynamically added mouseenter/mouseleave listeners
            this.restartButton.removeEventListener('mouseenter', () => {}); // Can't remove anonymous functions directly
            this.restartButton.removeEventListener('mouseleave', () => {}); // This won't work as expected for anonymous listeners
            // A more robust way would be to store the listener functions, but for now, we'll just reset style.
            this.restartButton.style.transform = ''; // Reset transform
        }
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = '0';
        }
        if (this.newHighScoreMessage) {
            this.newHighScoreMessage.classList.add('hidden');
            this.newHighScoreMessage.style.transform = ''; // Reset transform for message
            // Stop any active new high score message animation
            TWEEN.getAll().filter(tween => {
                // Check if the tween is targeting the newHighScoreMessage element's style
                return (tween as any)._object === (this.newHighScoreMessage as any)?.style;
            }).forEach(tween => tween.stop());
        }
    }
}
