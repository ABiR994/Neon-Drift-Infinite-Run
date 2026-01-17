// src/ui/HUD.ts
import { UI_SELECTORS } from '../utils/constants';
import * as TWEEN from '@tweenjs/tween.js'; // Import TWEEN.js

export class HUD {
    private scoreElement: HTMLElement | null;
    private displayedScore: { value: number } = { value: 0 }; // Property to animate for count-up effect
    private scoreTween: TWEEN.Tween<typeof this.displayedScore> | null = null; // Store the tween instance

    constructor() {
        this.scoreElement = document.querySelector(UI_SELECTORS.HUD_SCORE_VALUE);
        if (!this.scoreElement) {
            console.warn(`HUD: Score element with selector "${UI_SELECTORS.HUD_SCORE_VALUE}" not found.`);
        }
        this.reset(); // Initialize score to 0 on creation
    }

    /**
     * Updates the displayed score on the HUD.
     * @param score The current score to display.
     */
    public updateScore(score: number): void {
        if (this.scoreElement) {
            // Stop any ongoing tween to prevent conflicts
            if (this.scoreTween) {
                this.scoreTween.stop();
            }

            // Create a new tween to animate the displayed score
            this.scoreTween = new TWEEN.Tween(this.displayedScore)
                .to({ value: score }, 500) // Animate over 500ms
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    if (this.scoreElement) {
                        this.scoreElement.textContent = Math.floor(this.displayedScore.value).toString();
                    }
                })
                .start();
        }
    }

    /**
     * Resets the HUD to its initial state, typically setting score to 0.
     * This also ensures the HUD is visible if it were hidden by a game over screen.
     */
    public reset(): void {
        if (this.scoreTween) {
            this.scoreTween.stop(); // Stop any ongoing score animation
        }
        this.displayedScore.value = 0; // Reset internal animated value
        this.updateScore(0); // Update the display to 0
        // Ensure HUD is visible, though its visibility is primarily managed by the Game class or main.ts
    }

    /**
     * Disposes of any resources held by the HUD.
     * For now, no specific DOM element removal is needed as the HUD element persists,
     * but resetting its state is good practice.
     */
    public dispose(): void {
        this.reset();
    }
}
