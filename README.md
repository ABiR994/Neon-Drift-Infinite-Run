# Neon Drift - Infinite Run

A fast-paced, visually immersive infinite runner game built with **Three.js** and **TypeScript**, set in a neon-drenched cyberpunk cityscape. Designed to deliver thrilling gameplay, responsive controls, and cinematic visual feedback—all running smoothly in your browser.

[![Live Demo](https://img.shields.io/badge/Play_Game-GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://abir994.github.io/Neon-Drift-Infinite-Run/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat&logo=three-dot-js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## Overview

**Neon Drift - Infinite Run** is an endless 3D runner where players dodge obstacles on a procedurally generated highway while racing through a glowing cyberpunk metropolis. Built with performance and player experience in mind, the game combines smooth lane-shifting mechanics, escalating speed, and rich visual storytelling to create a compelling, replayable challenge.

Every element—from camera motion to neon glows—is tuned to amplify the sensation of speed and urgency, making each run feel intense and rewarding.

---

## Core Features

- **Dynamic Lane Shifting**: Instantly switch between three lanes using intuitive keyboard controls.
- **Procedural World Generation**: Endless road segments and obstacle patterns ensure no two runs are alike.
- **Responsive Input System**: Tight, lag-free controls for precise maneuvering at high speeds.
- **Advanced Cyberpunk Visuals**:
  - Bloom post-processing for neon glow effects
  - Animated starfield background with colorful particles
  - CRT scanline overlay for retro aesthetic
  - Speed-reactive camera tilt, FOV, and shake
  - Radial speed lines at high velocity
  - Animated atmospheric fog that thickens with speed
- **Real-Time Scoring**: Track your progress with a dynamic HUD that updates instantly.
- **Robust Game States**: Seamless transitions between start screen, gameplay, game over, and restart.
- **Enhanced Feedback System**:
  - Near-miss: UI shake effect + micro camera shake
  - Collision: freeze-frame, bright flash, strong shake, and clear "GAME OVER" state
- **High Score Tracking**: Personal bests are saved locally and celebrated with visual flair.
- **Object Pooling**: Optimized obstacle spawning reduces garbage collection for smooth performance.

---

## How to Play

### Controls
- **Left Arrow** or **A**: Move car to the left lane
- **Right Arrow** or **D**: Move car to the right lane
- **R**: Restart after game over
- **Space** or **Enter**: Start game from title screen

### Objective
Survive as long as possible by dodging obstacles. The game speeds up over time—stay sharp, stay focused, and chase your highest score!

---

## Visual & Gameplay Enhancements

### Visual Polish
- **Bloom Post-Processing**: UnrealBloomPass creates authentic neon glow on all emissive materials
- **Starfield Background**: 500 colorful particles create depth and atmosphere
- **CRT Scanlines**: Subtle horizontal lines add retro cyberpunk authenticity
- **Speed Lines**: Radial overlay intensifies at high speeds
- **Emissive Materials**: All key elements glow with pulsing neon hues synchronized to game speed
- **Atmospheric Depth**: Layered fog enhances immersion and spatial awareness

### Vehicle Design
- **Futuristic Sports Car**: Low-profile chassis with sleek, beveled body panels
- **Spinning Wheels**: 4 detailed wheels with chrome rims and rubber tires that rotate based on speed
- **Neon Accents**: Cyan body with purple fenders and glowing trim strips
- **Carbon Fiber Details**: Spoiler, side skirts, front splitter, and rear diffuser
- **Working Lights**: Bright headlights with spotlights, pink tail lights, and dual exhaust glow
- **Underglow**: Cyan neon light underneath the car

### Obstacle Design
- **Energy Barriers**: Futuristic hazards with hexagonal pillars and glowing energy cores
- **Warning Lights**: Yellow corner lights and danger stripes for visibility
- **Pulsing Effects**: All emissive parts pulse faster as speed increases
- **Color Contrast**: Hot magenta/orange obstacles stand out against cyan car

### Game Feel
- **Tactile Car Physics**: Smooth lateral movement with tilt and suspension bounce
- **Event Clarity**: Every interaction is communicated through layered visual cues
- **Start Screen**: Stylized title screen with controls and "Press to Start" prompt
- **Performance Focus**: Object pooling and optimized rendering ensure stable 60 FPS

### UI/UX Design
- **Dynamic HUD**: Score and speed indicators animate in response to gameplay intensity
- **UI Shake**: Screen shakes on near-misses for tactile feedback
- **Polished Game Over Screen**:
  - Smooth fade-in transition
  - Clear display of final score and high score status
  - Visual highlight for "NEW HIGH SCORE!"
  - Intuitive restart flow with hover/click feedback

---

## Technologies Used

| Layer               | Technology        |
|---------------------|-------------------|
| 3D Rendering        | Three.js          |
| Post-Processing     | Three.js EffectComposer + UnrealBloomPass |
| Animation           | TWEEN.js          |
| Language            | TypeScript        |
| Build Tool          | Vite              |
| Styling             | CSS               |
| Persistence         | localStorage (for high scores) |

---

## Project Structure

```
src/
├── core/
│   ├── Game.ts           # Main game loop and state management
│   └── SceneManager.ts   # Three.js scene, camera, lighting, post-processing
├── entities/
│   ├── Car.ts            # Player vehicle with wheels and animations
│   ├── Obstacle.ts       # Energy barrier obstacles
│   └── Road.ts           # Procedural road generation
├── systems/
│   ├── CollisionSystem.ts    # Collision detection
│   ├── InputManager.ts       # Keyboard input handling
│   ├── ObstaclePool.ts       # Object pooling for obstacles
│   ├── ObstacleSpawner.ts    # Obstacle spawn logic
│   └── ScoreSystem.ts        # Scoring and high score tracking
├── ui/
│   ├── GameOverScreen.ts # Game over UI
│   └── HUD.ts            # In-game score/speed display
├── utils/
│   ├── constants.ts      # Game configuration values
│   └── helpers.ts        # Utility functions
├── styles/
│   └── main.css          # UI styles, scanlines, speed lines
└── main.ts               # Entry point with start screen logic
```

---

## Setup and Installation

### Prerequisites
- Node.js (LTS version recommended)
- npm or Yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ABiR994/Neon-Drift-Infinite-Run.git
   cd Neon-Drift-Infinite-Run
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server
```bash
npm run dev
```
Launches the development server at `http://localhost:5173/Neon-Drift-Infinite-Run/`. Features hot-reloading for immediate feedback during development.

### Building for Production
```bash
npm run build
```
Compiles the application into optimized static assets in the `dist/` directory, ready for deployment.

---

## Performance Optimizations

- **Object Pooling**: Obstacles are reused instead of created/destroyed to reduce GC pressure
- **Static Vector3 Allocations**: Camera look-at target uses static vector to avoid per-frame allocations
- **Efficient Collider Updates**: Manual bounding box calculation for Group meshes
- **Shared Utility Functions**: Lane position and speed normalization helpers reduce code duplication

---

## Developed By

- [ABiR994](https://github.com/ABiR994) with OpenCode
