// src/main.ts
import './styles/main.css';
import { SceneManager } from './core/SceneManager';
import { Game } from './core/Game';
import { LeaderboardSystem } from './systems/LeaderboardSystem';

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

    // Leaderboard
    const topScoresList = document.getElementById('top-scores-list');

    const renderLeaderboard = () => {
        if (!topScoresList) return;
        
        const scores = LeaderboardSystem.getLocalScores();
        
        topScoresList.innerHTML = '';
        if (scores.length > 0) {
            scores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.textContent = `#${index + 1} ${entry.name}: ${entry.score}`;
                topScoresList.appendChild(li);
            });
        } else {
            topScoresList.innerHTML = '<li>NO SCORES YET</li>';
        }
    };

    // Initial render
    renderLeaderboard();

    let isGameStarted = false;

    // Handle start screen - wait for any key press
    const handleStartGame = (event: Event) => {
        if (isGameStarted) return;
        
        // Ignore if it's a click on buttons
        if (event.type === 'click' || event.type === 'touchstart') {
            const target = event.target as HTMLElement;
            if (target.closest('button')) return;
        }

        isGameStarted = true;

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
        window.removeEventListener('touchstart', handleStartGame);
    };

    // Add event listeners for starting the game
    window.addEventListener('keydown', handleStartGame);
    window.addEventListener('click', handleStartGame);
    window.addEventListener('touchstart', handleStartGame);

    // Listen for "go home" to re-attach listeners
    window.addEventListener('neon-drift-home', () => {
        isGameStarted = false;
        window.addEventListener('keydown', handleStartGame);
        window.addEventListener('click', handleStartGame);
        window.addEventListener('touchstart', handleStartGame);
    });

    // Render the scene once so the background is visible
    sceneManager.render();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New content available, reload page
                                    console.log('New content detected, reloading...');
                                    window.location.reload();
                                }
                            };
                        }
                    };
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}
