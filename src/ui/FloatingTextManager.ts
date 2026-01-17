// src/ui/FloatingTextManager.ts
import { FloatingText } from './FloatingText';
import * as TWEEN from '@tweenjs/tween.js';

export class FloatingTextManager {
    private activeTexts: FloatingText[] = [];

    constructor() {
    }

    /**
     * Spawns a new floating text element at the specified screen coordinates.
     * @param text The text content to display.
     * @param x The X-coordinate (in pixels) for the text's initial position.
     * @param y The Y-coordinate (in pixels) for the text's initial position.
     */
    public spawnText(text: string, x: number, y: number): void {
        const floatingText = new FloatingText(text, x, y);
        this.activeTexts.push(floatingText);
        floatingText.animate().then(() => {
            // Remove text from activeTexts array once its animation is complete and it's disposed
            this.activeTexts = this.activeTexts.filter(t => t !== floatingText);
        });
    }

    /**
     * Updates all active floating texts. Primarily for TWEEN.js animation updates.
     * @param time The total elapsed time, typically from requestAnimationFrame.
     */
    public update(time: DOMHighResTimeStamp): void {
        TWEEN.update(time);
    }

    /**
     * Disposes of all active floating texts and clears the manager.
     */
    public dispose(): void {
        this.activeTexts.forEach(text => text.dispose());
        this.activeTexts = [];
    }
}
