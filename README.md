<div align="center">

# 🏁 Neon Drift - Infinite Run

**A fast-paced, visually immersive infinite runner game built with Three.js and TypeScript,  
set in a neon-drenched cyberpunk cityscape.**

Designed to deliver thrilling gameplay, responsive controls, and cinematic visual feedback—all running smoothly in your browser.

<br>

[![Live Demo](https://img.shields.io/badge/Play_Game-GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://abir994.github.io/Neon-Drift-Infinite-Run/)

[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three-dot-js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

<br>

---

<br>

## 🌆 Overview

**Neon Drift - Infinite Run** is an endless 3D runner where players dodge obstacles on a procedurally generated highway while racing through a glowing cyberpunk metropolis. Built with performance and player experience in mind, the game combines smooth lane-shifting mechanics, escalating speed, and rich visual storytelling to create a compelling, replayable challenge.

Every element—from camera motion to neon glows—is tuned to amplify the sensation of speed and urgency, making each run feel intense, fluid, and deeply satisfying.

<br>

---

<br>

## ⚡ Core Features

<table>
<tr>
<td width="50%" valign="top">

### 🎮 Gameplay

- **Dynamic Lane Shifting**  
  Instantly switch between three lanes using intuitive keyboard controls

- **Procedural World Generation**  
  Endless road segments and obstacle patterns ensure no two runs are alike

- **Responsive Input System**  
  Tight, lag-free controls for precise maneuvering at high speeds

- **Real-Time Scoring**  
  Track your progress with a dynamic HUD that updates instantly

- **High Score Tracking**  
  Personal bests saved locally and celebrated with visual flair

- **Robust Game States**  
  Seamless transitions between start screen, gameplay, game over, and restart

</td>
<td width="50%" valign="top">

### 🎨 Visual & Sensory Design

- **Bloom Post-Processing**  
  UnrealBloomPass creates authentic neon glow on all emissive materials

- **Starfield Background**  
  500 colorful particles create depth and atmosphere

- **CRT Scanline Overlay**  
  Subtle horizontal lines add retro cyberpunk authenticity

- **Speed Lines**  
  Radial overlay intensifies as velocity increases

- **Atmospheric Fog**  
  Layered, speed-reactive fog enhances immersion and spatial awareness

- **Emissive Materials**  
  All key elements pulse with synchronized neon hues

</td>
</tr>
</table>

<br>

### 💥 Feedback & Polish

| Feature | Description |
|:--------|:------------|
| **Near-Miss Effects** | UI shake + micro camera shake for tension |
| **Collision Impact** | Freeze-frame, bright flash, strong shake, and clear "GAME OVER" state |
| **Object Pooling** | Optimized obstacle spawning reduces garbage collection for smooth 60 FPS |
| **Tactile Car Physics** | Smooth lateral movement with tilt, suspension bounce, and speed-reactive FOV |

<br>

---

<br>

## 🕹 How to Play

<div align="center">

| Key | Action |
|:---:|:-------|
| `←` / `A` | Move car left |
| `→` / `D` | Move car right |
| `Space` / `Enter` | Start game (from title) |
| `R` | Restart after game over |

</div>

<br>

> **Objective:** Survive as long as possible by dodging obstacles. The game speeds up over time—stay sharp, stay focused, and chase your highest score!

<br>

---

<br>

## 🖥️ Visual & Gameplay Enhancements

<table>
<tr>
<td width="33%" valign="top">

### 🚗 Vehicle Design

- **Futuristic Sports Car**  
  Low-profile chassis with sleek, beveled panels

- **Spinning Wheels**  
  4 detailed wheels with chrome rims and rubber tires

- **Neon Accents**  
  Cyan body with purple fenders and glowing trim strips

- **Carbon Fiber Details**  
  Spoiler, side skirts, front splitter, rear diffuser

- **Working Lights**  
  Bright headlights, pink tail lights, dual exhaust glow, and underglow

</td>
<td width="33%" valign="top">

### 🚧 Obstacle Design

- **Energy Barriers**  
  Hexagonal pillars with glowing cores

- **Warning Lights**  
  Yellow corner beacons and danger stripes

- **Pulsing Effects**  
  Emissive parts accelerate their pulse with speed

- **High Contrast**  
  Hot magenta/orange obstacles pop against cyan car

</td>
<td width="33%" valign="top">

### 🎯 UI/UX Design

- **Dynamic HUD**  
  Score and speed animate with gameplay intensity

- **Polished Game Over Screen**
  - Smooth fade-in transition
  - Final score + high score status
  - "NEW HIGH SCORE!" highlight
  - Intuitive restart with hover/click feedback

</td>
</tr>
</table>

<br>

---

<br>

## 🛠 Technologies Used

<div align="center">

| Layer | Technology |
|:------|:-----------|
| **3D Rendering** | Three.js |
| **Post-Processing** | EffectComposer + UnrealBloomPass |
| **Animation** | TWEEN.js |
| **Language** | TypeScript |
| **Build Tool** | Vite |
| **Styling** | CSS (with scanlines & overlays) |
| **Persistence** | `localStorage` (high scores) |

</div>

<br>

---

<br>

## 📂 Project Structure

```
src/
│
├── core/
│   ├── Game.ts              # Main game loop and state management
│   └── SceneManager.ts      # Three.js scene, camera, lighting, post-processing
│
├── entities/
│   ├── Car.ts               # Player vehicle with wheels and animations
│   ├── Obstacle.ts          # Energy barrier obstacles
│   └── Road.ts              # Procedural road generation
│
├── systems/
│   ├── CollisionSystem.ts   # Collision detection
│   ├── InputManager.ts      # Keyboard input handling
│   ├── ObstaclePool.ts      # Object pooling for obstacles
│   ├── ObstacleSpawner.ts   # Obstacle spawn logic
│   └── ScoreSystem.ts       # Scoring and high score tracking
│
├── ui/
│   ├── GameOverScreen.ts    # Game over UI
│   └── HUD.ts               # In-game score/speed display
│
├── utils/
│   ├── constants.ts         # Game configuration values
│   └── helpers.ts           # Utility functions
│
├── styles/
│   └── main.css             # UI styles, scanlines, speed lines
│
└── main.ts                  # Entry point with start screen logic
```

<br>

---

<br>

## ▶️ Setup and Installation

### Prerequisites

- Node.js (LTS version recommended)
- npm or Yarn

<br>

### Installation

**1. Clone the repository:**

```bash
git clone https://github.com/ABiR994/Neon-Drift-Infinite-Run.git
cd Neon-Drift-Infinite-Run
```

**2. Install dependencies:**

```bash
npm install
```

<br>

### Running the Development Server

```bash
npm run dev
```

Launches the development server at `http://localhost:5173/Neon-Drift-Infinite-Run/`.  
Features hot-reloading for immediate feedback during development.

<br>

### Building for Production

```bash
npm run build
```

Compiles the application into optimized static assets in the `dist/` directory, ready for deployment.

<br>

---

<br>

## 🚀 Performance Optimizations

| Optimization | Description |
|:-------------|:------------|
| **Object Pooling** | Obstacles are reused instead of created/destroyed to reduce GC pressure |
| **Static Vector3 Allocations** | Camera look-at target uses static vector to avoid per-frame allocations |
| **Efficient Collider Updates** | Manual bounding box calculation for Group meshes |
| **Shared Utility Functions** | Lane position and speed normalization helpers reduce code duplication |

<br>

---

<br>

<div align="center">

## 👤 Developed By

**[ABiR994](https://github.com/ABiR994)** with OpenCode

<br>

---

<br>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

</div>
