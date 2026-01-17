// src/core/Input.ts

export class Input {
    private static instance: Input;
    private keysPressed: Set<string>;
    private allowedKeys: Set<string>;

    private constructor() {
        this.keysPressed = new Set();
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
    }

    private handleKeyDown(event: KeyboardEvent): void {
        // Only track keys we care about
        if (this.allowedKeys.has(event.code)) {
            this.keysPressed.add(event.code);
            // Prevent default behavior for arrow keys to avoid scrolling the page
            if (event.code.startsWith('Arrow')) {
                event.preventDefault();
            }
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        this.keysPressed.delete(event.code);
    }

    /**
     * Checks if a specific key is currently pressed.
     * @param key The keyboard event code (e.g., 'KeyA', 'ArrowLeft').
     */
    public isKeyPressed(key: string): boolean {
        return this.keysPressed.has(key);
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
        return this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp');
    }

    /**
     * Disposes of event listeners to prevent memory leaks.
     */
    public dispose(): void {
        window.removeEventListener('keydown', (event: KeyboardEvent) => this.handleKeyDown(event));
        window.removeEventListener('keyup', (event: KeyboardEvent) => this.handleKeyUp(event));
        this.keysPressed.clear();
    }
}
