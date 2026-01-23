// src/core/Input.ts

export class Input {
    private static instance: Input;
    private keysPressed: Set<string>;
    private keysJustPressed: Set<string>; // New set to track keys pressed once per frame
    private allowedKeys: Set<string>;
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private swipeThreshold: number = 30;
    private isBoostingOnTouch: boolean = false;
    private hasSwipedThisTouch: boolean = false;

    private constructor() {
        this.keysPressed = new Set();
        this.keysJustPressed = new Set(); // Initialize new set
        this.allowedKeys = new Set(['KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight', 'KeyW', 'ArrowUp']);
        this.setupEventListeners();
    }

    // Ensures only one instance of Input exists (Singleton pattern)
    public static getInstance(): Input {
        if (!Input.instance) {
            Input.instance = new Input();
        }
        return Input.instance;
    }

    private setupEventListeners(): void {
        // Using arrow functions or binding `this` to ensure correct context
        window.addEventListener('keydown', (event: KeyboardEvent) => this.handleKeyDown(event));
        window.addEventListener('keyup', (event: KeyboardEvent) => this.handleKeyUp(event));

        // Touch events
        window.addEventListener('touchstart', (e: TouchEvent) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isBoostingOnTouch = true; // One finger press to accelerate
            this.hasSwipedThisTouch = false;
        }, { passive: false });

        window.addEventListener('touchend', (e: TouchEvent) => {
            if (e.touches.length === 0) {
                this.isBoostingOnTouch = false;
            }
            this.hasSwipedThisTouch = false;
        }, { passive: false });

        window.addEventListener('touchmove', (e: TouchEvent) => {
            if (this.hasSwipedThisTouch) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            const diffX = currentX - this.touchStartX;
            const diffY = currentY - this.touchStartY;

            if (Math.abs(diffX) > this.swipeThreshold || Math.abs(diffY) > this.swipeThreshold) {
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    // Horizontal swipe
                    if (diffX > 0) {
                        this.keysJustPressed.add('ArrowRight');
                    } else {
                        this.keysJustPressed.add('ArrowLeft');
                    }
                    this.hasSwipedThisTouch = true;
                } else {
                    // Vertical swipe - maybe for boost?
                    if (diffY < 0) { // Swipe up
                        // We'll handle vertical swipe logic if needed, but for now let's just mark it
                        this.hasSwipedThisTouch = true;
                    }
                }
            }

            // Prevent scrolling
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
    }

    private handleKeyDown(event: KeyboardEvent): void {
        // Only track keys we care about
        if (this.allowedKeys.has(event.code)) {
            // If the key is not already pressed, mark it as "just pressed"
            if (!this.keysPressed.has(event.code)) {
                this.keysJustPressed.add(event.code);
            }
            this.keysPressed.add(event.code);
            // Prevent default behavior for arrow keys to avoid scrolling the page
            if (event.code.startsWith('Arrow')) {
                event.preventDefault();
            }
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        this.keysPressed.delete(event.code);
        // If a key is released, it can no longer be "just pressed"
        this.keysJustPressed.delete(event.code);
    }

    /**
     * Checks if a specific key is currently pressed.
     * @param key The keyboard event code (e.g., 'KeyA', 'ArrowLeft').
     */
    public isKeyPressed(key: string): boolean {
        return this.keysPressed.has(key);
    }

    /**
     * Checks if a specific key was pressed down in the current frame.
     * This will only return true once per key press.
     * @param key The keyboard event code (e.g., 'KeyA', 'ArrowLeft').
     */
    public isKeyJustPressed(key: string): boolean {
        return this.keysJustPressed.has(key);
    }

    /**
     * Checks if either 'A' or 'ArrowLeft' was just pressed for moving left.
     */
    public isMoveLeftJustPressed(): boolean {
        return this.isKeyJustPressed('KeyA') || this.isKeyJustPressed('ArrowLeft');
    }

    /**
     * Checks if either 'D' or 'ArrowRight' was just pressed for moving right.
     */
    public isMoveRightJustPressed(): boolean {
        return this.isKeyJustPressed('KeyD') || this.isKeyJustPressed('ArrowRight');
    }

    /**
     * Checks if either 'A' or 'ArrowLeft' is pressed for moving left.
     */
    public isMovingLeft(): boolean {
        return this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft');
    }

    /**
     * Checks if either 'D' or 'ArrowRight' is pressed for moving right.
     */
    public isMovingRight(): boolean {
        return this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight');
    }

    /**
     * Checks if either 'W' or 'ArrowUp' is pressed for a slight boost.
     */
    public isBoosting(): boolean {
        return this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp') || this.isBoostingOnTouch;
    }

    /**
     * Clears the set of keys that were just pressed.
     * This should be called once per frame by the game loop.
     */
    public clearJustPressedKeys(): void {
        this.keysJustPressed.clear();
    }

    /**
     * Disposes of event listeners to prevent memory leaks.
     */
    public dispose(): void {
        window.removeEventListener('keydown', (event: KeyboardEvent) => this.handleKeyDown(event));
        window.removeEventListener('keyup', (event: KeyboardEvent) => this.handleKeyUp(event));
        this.keysPressed.clear();
        this.keysJustPressed.clear();
    }
}
