// src/main.ts
import './styles/main.css';
import { SceneManager } from './core/SceneManager';
import { Game } from './core/Game';

// Get the game container element
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const startHighScore = document.getElementById('start-high-score');
const hudElement = document.getElementById('hud');

if (!gameContainer) {
    console.error('Game container not found. Make sure an element with id "game-container" exists in index.html');
} else {
    // Initialize SceneManager (scene renders in background during start screen)
    const sceneManager = new SceneManager('game-container');
    
    // Initialize the Game (but don't start it yet)
    const game = new Game(sceneManager);

    // Display high score on start screen
    const storedHighScore = localStorage.getItem('neon_drift_high_score');
    if (startHighScore && storedHighScore && parseInt(storedHighScore, 10) > 0) {
        startHighScore.textContent = `BEST: ${storedHighScore}`;
    }

    // Display Top 5 Runs
    const topScoresList = document.getElementById('top-scores-list');
    const storedScores = JSON.parse(localStorage.getItem('neon_drift_top_scores') || '[]');
    if (topScoresList && storedScores.length > 0) {
        storedScores.forEach((score: number, index: number) => {
            const li = document.createElement('li');
            li.textContent = `#${index + 1}: ${score}`;
            topScoresList.appendChild(li);
        });
    }

    // Handle start screen - wait for any key press
    const handleStartGame = (event: Event) => {
        // Ignore if it's a click on buttons
        if (event.type === 'click' || event.type === 'touchstart') {
            const target = event.target as HTMLElement;
            if (target.closest('button')) return;
        }

        // Hide start screen and show HUD
        if (startScreen) {
            startScreen.classList.add('hidden');
        }
        if (hudElement) {
            hudElement.classList.remove('hidden');
        }

        // Initialize and start the Game
        game.init();
        game.start();

        // Remove start listeners
        window.removeEventListener('keydown', handleStartGame);
        window.removeEventListener('click', handleStartGame);
    };

    // Add event listeners for starting the game
    window.addEventListener('keydown', handleStartGame);
    window.addEventListener('click', handleStartGame);
    window.addEventListener('touchstart', handleStartGame);

    // Render the scene once so the background is visible
    sceneManager.render();
}
