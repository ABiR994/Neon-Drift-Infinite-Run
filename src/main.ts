// src/main.ts
import './styles/main.css';
import { SceneManager } from './core/SceneManager';
import { Game } from './core/Game';

// Get the game container element
const gameContainer = document.getElementById('game-container');
if (!gameContainer) {
    console.error('Game container not found. Make sure an element with id "game-container" exists in index.html');
} else {
    // Initialize SceneManager
    const sceneManager = new SceneManager('game-container');

    // Initialize and start the Game
    const game = new Game(sceneManager);
    game.init(); // Initialize all game components
    game.start(); // Start the game loop
}
