// src/ui/FloatingText.ts
import * as TWEEN from '@tweenjs/tween.js';
import {
    FLOATING_TEXT_COLOR,
    FLOATING_TEXT_SIZE,
    FLOATING_TEXT_RISE_SPEED,
    FLOATING_TEXT_FADE_DURATION
} from '../utils/constants';

export class FloatingText {
    private element: HTMLDivElement;
    private animationTween: TWEEN.Tween<any> | null = null; // Store the tween instance

    constructor(text: string, x: number, y: number) {
        this.element = document.createElement('div');
        this.element.textContent = text;
        this.element.style.position = 'absolute';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.fontSize = `${FLOATING_TEXT_SIZE * 100}px`; // Scale font size
        this.element.style.color = `#${FLOATING_TEXT_COLOR.toString(16).padStart(6, '0')}`; // Convert hex to string
        this.element.style.pointerEvents = 'none'; // Prevent interaction
        this.element.style.opacity = '1';
        this.element.style.textShadow = `0 0 5px #${FLOATING_TEXT_COLOR.toString(16).padStart(6, '0')}`;
        this.element.style.zIndex = '1000'; // Ensure it's on top

        document.body.appendChild(this.element);
    }

    public animate(): Promise<void> {
        return new Promise((resolve) => {
            const startY = parseFloat(this.element.style.top || '0');
            const endY = startY - FLOATING_TEXT_RISE_SPEED * 50; // Move up significantly

            this.animationTween = new TWEEN.Tween({ y: startY, opacity: 1 })
                .to({ y: endY, opacity: 0 }, FLOATING_TEXT_FADE_DURATION * 1000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate((obj) => {
                    this.element.style.top = `${obj.y}px`;
                    this.element.style.opacity = `${obj.opacity}`;
                })
                .onComplete(() => {
                    this.dispose();
                    resolve();
                })
                .start();
        });
    }

    public dispose(): void {
        if (this.animationTween) {
            this.animationTween.stop();
        }
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
