# 🌌 Neon Drift – Infinite Run

A fast-paced, visually immersive infinite runner game built with **Three.js** and **TypeScript**, set in a neon-drenched cyberpunk cityscape. Designed to deliver thrilling gameplay, responsive controls, and cinematic visual feedback—all running smoothly in your browser.

[![Live Demo](https://img.shields.io/badge/Play_Game-GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://abir994.github.io/Neon-Drift-Infinite-Run/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat&logo=three-dot-js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 🚀 Overview

**Neon Drift – Infinite Run** is an endless 3D runner where players dodge obstacles on a procedurally generated highway while racing through a glowing cyberpunk metropolis. Built with performance and player experience in mind, the game combines smooth lane-shifting mechanics, escalating speed, and rich visual storytelling to create a compelling, replayable challenge.

Every element—from camera motion to neon glows—is tuned to amplify the sensation of speed and urgency, making each run feel intense and rewarding.

---

## ✨ Core Features

- **🛣️ Dynamic Lane Shifting**: Instantly switch between three lanes using intuitive keyboard controls.
- **🌀 Procedural World Generation**: Endless road segments and obstacle patterns ensure no two runs are alike.
- **🎮 Responsive Input System**: Tight, lag-free controls for precise maneuvering at high speeds.
- **💡 Advanced Cyberpunk Visuals**:  
  - Emissive neon road edges and obstacles  
  - Speed-reactive camera tilt, FOV, and shake  
  - Animated atmospheric fog that thickens as speed increases
- **📊 Real-Time Scoring**: Track your progress with a dynamic HUD that updates instantly.
- **🔄 Robust Game States**: Seamless transitions between gameplay, game over, and restart.
- **💥 Enhanced Feedback System**:  
  - Near-miss: subtle screen flash + micro camera shake  
  - Collision: freeze-frame, bright flash, strong shake, and clear “GAME OVER” state
- **🏆 High Score Tracking**: Personal bests are saved locally and celebrated with visual flair.

---

## 🕹️ How to Play

### Controls
- **← Left Arrow** or **A**: Move car to the left lane  
- **→ Right Arrow** or **D**: Move car to the right lane  
- **R**: Restart after game over

### Objective
Survive as long as possible by dodging obstacles. The game speeds up over time—stay sharp, stay focused, and chase your highest score!

---

## 🌟 Visual & Gameplay Enhancements

### 🎨 Visual Polish
- **Emissive Materials**: All key elements (road markings, barriers, pylons) glow with pulsing neon hues synchronized to game speed.
- **Atmospheric Depth**: Layered fog and depth-of-field effects enhance immersion and spatial awareness.
- **Motion Cues**: Scrolling light streaks, parallax backgrounds, and dynamic camera behavior sell the illusion of extreme velocity.

### 🧠 Game Feel
- **Tactile Car Physics**: Smooth lateral movement with slight tilt and suspension bounce during lane changes.
- **Event Clarity**: Every interaction—near miss, collision, milestone—is communicated through layered audiovisual cues.
- **Performance Focus**: Optimized rendering and object pooling ensure stable 60 FPS even on mid-tier devices.

### 🖥️ UI/UX Design
- **Dynamic HUD**: Score and speed indicators subtly animate in response to gameplay intensity.
- **Polished Game Over Screen**:  
  - Smooth fade-in transition  
  - Clear display of final score and high score status  
  - Visual highlight for “NEW HIGH SCORE!”  
  - Intuitive restart flow with hover/click feedback

---

## 🛠️ Technologies Used

| Layer               | Technology        |
|---------------------|-------------------|
| 3D Rendering        | Three.js          |
| Language            | TypeScript        |
| Build Tool          | Vite              |
| Styling             | CSS (minimal)     |
| Persistence         | `localStorage` (for high scores) |
| Development Aid     | OpenCode (AI-assisted ideation & iteration) |

---

## ⚙️ Setup and Installation

To set up and run this project locally, follow these instructions.

### Prerequisites
-   Node.js (LTS version recommended)
-   npm or Yarn

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/neon-drift-infinite-run.git
    cd neon-drift-infinite-run
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server
```bash
npm run dev
# or
yarn dev
```
Launches the development server, typically accessible at `http://localhost:5173/`. Features hot-reloading for immediate feedback during development.

### Building for Production
```bash
npm run build
# or
yarn build
```
Compiles the application into optimized static assets located in the `dist/` directory, ready for deployment.

---

## 🧑‍💻 Developed By

- [ABiR994](https://github.com/ABiR994) with OpenCode

---
