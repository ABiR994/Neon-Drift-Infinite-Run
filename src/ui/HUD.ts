// src/ui/HUD.ts
import { UI_SELECTORS, HUD_MAX_MOTION_OFFSET } from '../utils/constants';
import { getNormalizedSpeed } from '../utils/helpers';
import * as TWEEN from '@tweenjs/tween.js';

export class HUD {
    private hudElement: HTMLElement | null;
    private scoreElement: HTMLElement | null;
    private speedElement: HTMLElement | null;
    private creditsElement: HTMLElement | null;
    private statusContainer: HTMLElement | null;
    private heatBar: HTMLElement | null;
    private displayedSpeed: { value: number } = { value: 0 };
    private speedTween: TWEEN.Tween<typeof this.displayedSpeed> | null = null;

    private lastStatus: string = '';

    constructor() {
        this.hudElement = document.querySelector('#hud');
        this.scoreElement = document.querySelector(UI_SELECTORS.HUD_SCORE_VALUE);
        this.speedElement = document.querySelector(UI_SELECTORS.HUD_SPEED_VALUE);
        this.creditsElement = document.querySelector('#credits-value');
        this.statusContainer = document.querySelector('#status-container');
        this.heatBar = document.querySelector('#heat-bar');

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

    public updateCredits(credits: number): void {
        if (this.creditsElement) {
            this.creditsElement.textContent = Math.floor(credits).toString();
        }
    }

    public updateStatus(status: { shield: boolean, boost: boolean, multiplier: boolean, magnet: boolean }): void {
        const statusKey = JSON.stringify(status);
        if (statusKey === this.lastStatus) return;
        this.lastStatus = statusKey;

        if (!this.statusContainer) return;

        // Clear and rebuild status icons only when state changes
        this.statusContainer.innerHTML = '';
        
        if (status.shield) this.addStatusIcon('shield');
        if (status.boost) this.addStatusIcon('boost');
        if (status.multiplier) this.addStatusIcon('multiplier');
        if (status.magnet) this.addStatusIcon('magnet');
    }

    public updateHeat(heatPercent: number, overheated: boolean): void {
        if (this.heatBar) {
            this.heatBar.style.width = `${heatPercent}%`;
            if (overheated) {
                this.heatBar.classList.add('overheated');
                this.hudElement?.classList.add('hud-shake');
            } else {
                this.heatBar.classList.remove('overheated');
                this.hudElement?.classList.remove('hud-shake');
            }
        }
    }

    private addStatusIcon(type: string): void {
        if (!this.statusContainer) return;
        const icon = document.createElement('div');
        icon.className = `status-icon ${type} new`;
        this.statusContainer.appendChild(icon);
        
        // Remove 'new' class after animation
        setTimeout(() => icon.classList.remove('new'), 500);
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

        // Apply HUD motion based on speed
        if (this.hudElement) {
            const t = getNormalizedSpeed(speed);

            // Subtle motion (e.g., slight vertical shift)
            const motionOffset = t * HUD_MAX_MOTION_OFFSET;
            this.hudElement.style.transform = `translateY(${motionOffset}px)`;

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
