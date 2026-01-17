// src/ui/HUD.ts
import { UI_SELECTORS } from '../utils/constants';

export class HUD {
    private scoreElement: HTMLElement | null;

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
            this.scoreElement.textContent = Math.floor(score).toString();
        }
    }

    /**
     * Resets the HUD to its initial state, typically setting score to 0.
     * This also ensures the HUD is visible if it were hidden by a game over screen.
     */
    public reset(): void {
        this.updateScore(0);
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
