// src/ui/HUD.ts
import { UI_SELECTORS, GAME_SPEED_INITIAL, GAME_SPEED_MAX,     HUD_MAX_BLUR, HUD_MAX_MOTION_OFFSET /*, HUD_MOTION_SMOOTHING*/ } from '../utils/constants';
import * as TWEEN from '@tweenjs/tween.js';

export class HUD {
    private hudElement: HTMLElement | null;
    private scoreElement: HTMLElement | null;
    private speedElement: HTMLElement | null;
    private displayedSpeed: { value: number } = { value: 0 };
    private speedTween: TWEEN.Tween<typeof this.displayedSpeed> | null = null;
    private displayedScore: { value: number } = { value: 0 }; // For animated score
    private scoreTween: TWEEN.Tween<typeof this.displayedScore> | null = null; // Tween for score animation

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

    public updateScore(newScore: number): void {
        // Animate score value
        if (this.scoreElement) {
            if (this.scoreTween) {
                this.scoreTween.stop();
            }
            this.scoreTween = new TWEEN.Tween(this.displayedScore)
                .to({ value: newScore }, 500) // Animate over 500ms
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    if (this.scoreElement) {
                        this.scoreElement.textContent = Math.floor(this.displayedScore.value).toString();
                    }
                })
                .start();
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
            const normalizedSpeed = (speed - GAME_SPEED_INITIAL) / (GAME_SPEED_MAX - GAME_SPEED_INITIAL);
            const t = Math.max(0, Math.min(1, normalizedSpeed)); // Clamp between 0 and 1

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
        if (this.scoreTween) { // Stop score tween on reset
            this.scoreTween.stop();
        }
        // Directly reset score display
        this.displayedScore.value = 0; // Reset internal animated score value
        if (this.scoreElement) {
            this.scoreElement.textContent = '0';
            console.log('HUD.reset() - scoreElement.textContent set to:', this.scoreElement.textContent); // DEBUG
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
        if (this.scoreTween) { // Stop score tween on dispose
            this.scoreTween.stop();
        }
        // No event listeners to remove from HUD elements directly, as they are queried but not attached.
    }
}
