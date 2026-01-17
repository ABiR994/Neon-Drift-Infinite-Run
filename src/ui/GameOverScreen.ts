// src/ui/GameOverScreen.ts
import { UI_SELECTORS } from '../utils/constants';

export class GameOverScreen {
    private gameOverScreenElement: HTMLElement | null;
    private finalScoreElement: HTMLElement | null;
    private restartButton: HTMLButtonElement | null;
    private onRestartCallback: () => void;

    constructor(onRestart: () => void) {
        this.gameOverScreenElement = document.querySelector(UI_SELECTORS.GAME_OVER_SCREEN);
        this.finalScoreElement = document.querySelector(UI_SELECTORS.GAME_OVER_FINAL_SCORE_VALUE);
        this.restartButton = document.querySelector(UI_SELECTORS.RESTART_BUTTON) as HTMLButtonElement; // Cast to HTMLButtonElement
        this.onRestartCallback = onRestart;

        if (!this.gameOverScreenElement) {
            console.warn(`GameOverScreen: Game over screen element with selector "${UI_SELECTORS.GAME_OVER_SCREEN}" not found.`);
        }
        if (!this.finalScoreElement) {
            console.warn(`GameOverScreen: Final score element with selector "${UI_SELECTORS.GAME_OVER_FINAL_SCORE_VALUE}" not found.`);
        }
        if (!this.restartButton) {
            console.warn(`GameOverScreen: Restart button element with selector "${UI_SELECTORS.RESTART_BUTTON}" not found.`);
        } else {
            // Attach event listener for the restart button
            this.restartButton.addEventListener('click', this.onRestartCallback);
        }

        this.hide(); // Ensure the screen is hidden initially
    }

    /**
     * Displays the game over screen with the given final score.
     * @param finalScore The score to display on the game over screen.
     */
    public show(finalScore: number): void {
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = Math.floor(finalScore).toString();
        }
        if (this.gameOverScreenElement) {
            this.gameOverScreenElement.classList.remove('hidden');
        }
    }

    /**
     * Hides the game over screen.
     */
    public hide(): void {
        if (this.gameOverScreenElement) {
            this.gameOverScreenElement.classList.add('hidden');
        }
    }

    /**
     * Disposes of event listeners to prevent memory leaks, especially for the restart button.
     */
    public dispose(): void {
        if (this.restartButton) {
            // Remove the event listener when disposing to prevent memory leaks
            this.restartButton.removeEventListener('click', this.onRestartCallback);
        }
        this.hide(); // Ensure it's hidden on dispose/cleanup
    }
}
