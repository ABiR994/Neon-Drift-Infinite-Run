<div align="center">

# 🏁 Neon Drift - Infinite Run

**A fast-paced, visually immersive infinite runner game built with Three.js and TypeScript,  
set in a neon-drenched cyberpunk cityscape.**

Designed to deliver thrilling gameplay, responsive controls, and cinematic visual feedback—all running smoothly in your browser or as a mobile app.

<br>

[![Live Demo](https://img.shields.io/badge/Play_Game-GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://abir994.github.io/Neon-Drift-Infinite-Run/)

[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three-dot-js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

<br>

---

## 🌆 Overview

**Neon Drift - Infinite Run** is an endless 3D runner where players dodge obstacles on a procedurally generated highway while racing through a glowing cyberpunk metropolis. Now featuring a full progression system, power-ups, and a persistent economy, it's more than just a runner—it's a high-speed cyberpunk adventure.

---

## ⚡ Key Features

### 🛠️ Progression & Economy
- **Garage System**: Spend collected **Neon Credits** on permanent car upgrades (Power-up Duration, Cooling Speed, Magnet Range).
- **Custom Skins**: Unlock unique vehicle styles like **INFERNO**, **VENOM**, and **VOID** based on credits and high-score milestones.
- **Persistent Data**: Your credits, upgrades, and high scores are saved locally using `localStorage`.

### 🎮 Advanced Gameplay
- **Power-Up System**: Shield, Speed Boost (Invincibility), X2 Multiplier, and Magnet collectibles.
- **Manual Boost & Heat**: Hold `W` or `Up Arrow` for a manual speed burst, but manage your **Heat Meter** to avoid overheating!
- **Hunter Boss**: Survive the high-stakes encounter with the pursuit vehicle that targets you with lasers every 10,000 points.
- **Procedural Obstacles**: Traditional barriers plus aggressive **Enemy Cars** that change lanes to block your path.

### 🎨 Visual & Sensory "Juice"
- **Dynamic Themes**: The environment shifts through Cyan, Magenta, Gold, and Emerald color palettes every 2,000 points.
- **Cinematic Camera**: Features dynamic zoom, banking tilts, and subtle shake for an intense sensation of speed.
- **Particle Systems**: High-performance neon exhaust and collision sparks.
- **Slow-Mo Feedback**: Brief time-dilation on "Near Misses" to emphasize close calls.

---

## 📱 Mobile & PWA Support
- **Fully Installable**: As a **Progressive Web App (PWA)**, you can install Neon Drift directly to your mobile home screen.
- **Optimized Controls**: Intuitive **Swipe to Switch** and **Tap/Hold to Boost** controls designed for one-handed mobile play.
- **Responsive View**: Automatically adjusts Field of View (FOV) and UI layout for both portrait and landscape modes.

---

## 🕹 How to Play

<div align="center">

| Device | Action | Control |
|:---:|:-------|:-------|
| 💻 **PC** | Move Left/Right | `←` / `A` or `→` / `D` |
| 💻 **PC** | Manual Boost | `W` or `↑` (Hold) |
| 📱 **Mobile** | Move Left/Right | Swipe Left / Right |
| 📱 **Mobile** | Manual Boost | Tap & Hold Screen |

</div>

---

## 🛠 Technologies Used

<div align="center">

| Layer | Technology |
|:------|:-----------|
| **3D Rendering** | Three.js |
| **Post-Processing** | EffectComposer + UnrealBloomPass |
| **Animation** | TWEEN.js |
| **Language** | TypeScript |
| **Build Tool** | Vite |
| **Persistence** | `localStorage` |
| **PWA** | Service Workers + Web Manifest |

</div>

---

## 📂 Project Structure

```
src/
│
├── core/
│   ├── Game.ts              # Main game logic and state management
│   ├── Input.ts             # Unified Keyboard/Touch input handling
│   └── SceneManager.ts      # Three.js scene setup, lighting, and camera effects
│
├── entities/
│   ├── Car.ts               # Player vehicle with skins and physics
│   ├── Credit.ts            # Collectible currency entity
│   ├── EnemyCar.ts          # AI-controlled moving obstacles
│   ├── HunterBoss.ts        # Mid-run boss encounter mechanics
│   ├── Obstacle.ts          # Static energy barrier obstacles
│   ├── PowerUp.ts           # Collectible gameplay items
│   └── Road.ts              # Procedural road segment generation
│
├── systems/
│   ├── CollisionSystem.ts   # AABB collision and near-miss detection
│   ├── CreditSpawner.ts     # Currency generation logic
│   ├── EnvironmentSystem.ts # Procedural buildings, billboards, and drones
│   ├── LeaderboardSystem.ts # Local high-score management
│   ├── ObstaclePool.ts      # Object pooling for performance optimization
│   ├── ObstacleSpawner.ts   # Strategic obstacle placement logic
│   ├── PowerUpSpawner.ts    # Item generation and lifecycle management
│   └── ScoreSystem.ts       # Distance-based scoring and multipliers
│
├── ui/
│   ├── FloatingText.ts      # Individual floating text elements
│   ├── FloatingTextManager.ts # Feedback text system (e.g., "+10", "BOOST")
│   ├── GameOverScreen.ts    # Scoring summary and navigation
│   ├── Garage.ts            # Upgrade and skin customization shop
│   └── HUD.ts               # Dynamic in-game dashboard
│
├── utils/
│   ├── constants.ts         # Global game configuration and balance
│   └── helpers.ts           # Math and layout utility functions
│
└── main.ts                  # Entry point and PWA service worker registration
```

---

## ▶️ Setup and Installation

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

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

---

## 🚀 Performance Optimizations
- **Object Pooling**: Reuses mesh objects for obstacles and credits to prevent GC lag.
- **Array Reuse**: Minimized memory allocations in the main update loop.
- **Optimized HUD**: Uses `translate3d` and smart dirty-checking to prevent DOM thrashing.
- **Responsive FOV**: Dynamic math-based camera adjustment for all aspect ratios.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

## 👤 Developed By
**[ABiR994](https://github.com/ABiR994)** with OpenCode

</div>
