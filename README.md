# Neon Drift - Infinite Run

A fast-paced, visually engaging infinite runner game built with Three.js and TypeScript, set in a cyberpunk-inspired environment. This project focuses on enhancing visual quality, game feel, and player feedback through a series of technical and design improvements.

## 🚀 Overview
**Neon Drift - Infinite Run** provides a thrilling endless runner experience. Players navigate a procedurally generated road, dodging obstacles and mastering lane changes to achieve the highest score. The game leverages Three.js for its 3D environment and TypeScript for robust code structure, with recent updates concentrating on refined visual effects, responsive controls, and clear gameplay feedback.

## ✨ Core Features
-   **Dynamic Lane Shifting:** Players control precise movements between three distinct lanes to avoid obstacles.
-   **Procedural Environment Generation:** Features an endlessly changing road and obstacle layouts, ensuring replayability.
-   **Responsive Input System:** Utilizes simple keyboard controls for fluid and immediate car maneuvers.
-   **Advanced Neon Cyberpunk Aesthetics:** Immersive visuals are achieved with dynamic lighting, emissive materials on road elements and obstacles, subtle animated fog, and speed-responsive camera effects.
-   **Integrated Scoring System:** Tracks player performance with real-time updates and clear milestone indicators.
-   **Robust Game State Management:** Manages transitions between active gameplay, game over states, and restarts efficiently, supported by polished UI elements.
-   **Enhanced Gameplay Feedback:** Implements distinct visual and haptic feedback for near-misses and collisions, including camera shakes, screen flashes, and brief freeze-frames.

## 🕹️ How to Play

### Controls
-   **Left Arrow** or **A**: Moves the car to the left lane.
-   **Right Arrow** or **D**: Moves the car to the right lane.
-   **R**: Restarts the game after a Game Over.

### Objective
Navigate the neon-drenched cityscape, avoiding all obstacles to maximize survival time and score. Game speed progressively increases, demanding continuous player adaptation and quick reflexes.

## 🌟 Visual & Gameplay Enhancements
This project emphasizes a polished and engaging player experience through specific visual and game-feel improvements.

### Visual Enhancements
-   **Dynamic Lighting & Atmosphere:** Features animated fog with density increasing based on game speed, improved depth perception via atmospheric effects, and dynamic camera adjustments (tilt and FOV) to enhance speed perception.
-   **Emissive Neon Elements:** Road edges, lane markers, and obstacles incorporate emissive materials with subtle, speed-synchronized pulsing glows, contributing to the cyberpunk theme.
-   **Motion & Speed Cues:** Includes gentle camera shake at high speeds and visual effects like scrolling light streaks to intensify the sensation of rapid movement.

### Game Feel & Feedback
-   **Tactile Movement:** Car maneuvers are enhanced with smooth tilt during lane changes and subtle bounce/suspension effects, providing more responsive tactile feedback.
-   **Critical Event Indicators:** Near-miss events trigger small camera shakes and light flashes. Collisions are marked by freeze-frames, screen flashes, and pronounced camera shakes for immediate player awareness.
-   **Scoring Visibility:** Milestones are accompanied by floating score text, providing immediate visual confirmation of player achievements.

### UI & UX Improvements
-   **Dynamic HUD:** The Head-Up Display elements exhibit subtle motion dynamically linked to game speed, enhancing immersion.
-   **Refined Game Over Screen:** Features a smooth fade-in transition, clear display of the final score, and a distinct "New High Score" highlight. The restart mechanism includes intuitive button feedback.

## 🛠️ Technologies Under the Hood
-   **Three.js**: Utilized for rendering the 3D game environment, including roads, car models, and obstacles, with a focus on optimized visual effects.
-   **TypeScript**: Employed for developing a robust, maintainable, and type-safe codebase.
-   **Vite**: Integrated for a streamlined development workflow and efficient production builds.
-   **HTML/CSS**: Provides the structural foundation for the web application and styles for all user interface components.
-   **OpenCode**: Utilized as an AI assistant for initial project generation and iterative enhancements.

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

## 🎮 Try It Live

Play **Neon Drift – Infinite Run** right in your browser:

👉 [**Launch Game**](https://abir994.github.io/Neon-Drift-Infinite-Run/)

---
## 🧑‍💻 Developed By

- [ABiR994](https://github.com/ABiR994) with OpenCode
