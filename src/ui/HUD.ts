// src/ui/HUD.ts
import { UI_SELECTORS, HUD_MAX_BLUR, HUD_MAX_MOTION_OFFSET } from '../utils/constants';
import { getNormalizedSpeed } from '../utils/helpers';
import * as TWEEN from '@tweenjs/tween.js';

export class HUD {
    private hudElement: HTMLElement | null;
    private scoreElement: HTMLElement | null;
    private speedElement: HTMLElement | null;
    private displayedSpeed: { value: number } = { value: 0 };
    private speedTween: TWEEN.Tween<typeof this.displayedSpeed> | null = null;

    constructor() {
        this.hudElement = document.querySelector('#hud');
        this.scoreElement = document.querySelector(UI_SELECTORS.HUD_SCORE_VALUE);
        this.speedElement = document.querySelector(UI_SELECTORS.HUD_SPEED_VALUE);

        if (!this.hudElement) {
            console.warn(`HUD: Main HUD element with selector "#hud" not found.`);
        }
        if (!this.scoreElement) {
            console.warn(`HUD: Score element with selector "${UI_SELECTORS.HUD_SCORE_VALUE}" not found.`);
        }
        if (!this.speedElement) {
            console.warn(`HUD: Speed element with selector "${UI_SELECTORS.HUD_SPEED_VALUE}" not found.`);
        }
        
        this.reset();
    }

    public updateScore(score: number): void {
        // Direct update for score, no tweening
        if (this.scoreElement) {
            this.scoreElement.textContent = Math.floor(score).toString();
        }
    }

    public update(speed: number): void {
        // Animate speed value
        if (this.speedElement) {
            if (this.speedTween) {
                this.speedTween.stop();
            }
            this.speedTween = new TWEEN.Tween(this.displayedSpeed)
                .to({ value: speed }, 200) // Animate over 200ms
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    if (this.speedElement) {
                        this.speedElement.textContent = Math.floor(this.displayedSpeed.value).toString();
                    }
                })
                .start();
        }

        // Apply HUD motion and blur based on speed
        if (this.hudElement) {
            const t = getNormalizedSpeed(speed);

            // Subtle motion (e.g., slight vertical shift)
            const motionOffset = t * HUD_MAX_MOTION_OFFSET;
            this.hudElement.style.transform = `translateY(${motionOffset}px)`;

            // Blur effect
            const blurAmount = t * HUD_MAX_BLUR;
            this.hudElement.style.filter = `blur(${blurAmount}px)`;

            // Subtle glow (adjust box-shadow, already has one)
            const glowIntensity = 1 + t * 0.5; // Increase glow intensity slightly with speed
            this.hudElement.style.boxShadow = `0 0 ${15 * glowIntensity}px #00ffff`;
        }
    }

    public reset(): void {
        if (this.speedTween) {
            this.speedTween.stop();
        }
        // Directly reset score display
        if (this.scoreElement) {
            this.scoreElement.textContent = '0';
        }
        this.displayedSpeed.value = 0;
        if (this.speedElement) {
            this.speedElement.textContent = '0';
        }
        if (this.hudElement) {
            this.hudElement.style.transform = 'translateY(0px)';
            this.hudElement.style.filter = 'blur(0px)';
            this.hudElement.style.boxShadow = '0 0 15px #00ffff'; // Reset to initial glow
        }
    }

    public dispose(): void {
        if (this.speedTween) {
            this.speedTween.stop();
        }
        // No event listeners to remove from HUD elements directly, as they are queried but not attached.
    }
}
