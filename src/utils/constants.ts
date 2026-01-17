// src/utils/constants.ts

// Game balancing constants
export const GAME_SPEED_INITIAL = 15; // Initial road scrolling speed
export const GAME_SPEED_MAX = 100; // Maximum road scrolling speed
export const GAME_SPEED_INCREMENT_PER_SECOND = 0.5; // How much speed increases per second
export const LANE_COUNT = 3; // Number of lanes on the road

// Road constants
export const ROAD_WIDTH = 20; // Total width of the drivable road area
export const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT; // Width of each lane
export const ROAD_LENGTH = 200; // How far the road extends into the scene (for rendering)
export const ROAD_SEGMENT_LENGTH = 10; // Length of each road segment for seamless scrolling
export const ROAD_COLOR = 0x1a1a1a; // Dark road color
export const ROAD_LINE_COLOR = 0x00ffff; // Neon cyan for lane lines and edges
export const FOG_NEAR = ROAD_LENGTH * 0.4; // Fog start distance
export const FOG_FAR = ROAD_LENGTH * 0.9; // Fog end distance
export const FOG_COLOR = 0x0a0a1a; // Fog color matching background

// Car constants
export const CAR_WIDTH = 1.5;
export const CAR_HEIGHT = 1;
export const CAR_DEPTH = 3;
export const CAR_INITIAL_Z = ROAD_LENGTH / 2 - 10; // Position of the car along the Z axis
export const CAR_MOVE_SPEED = 20; // How fast the car moves between lanes
export const CAR_COLOR = 0xff00ff; // Neon magenta for the car

// Camera constants
export const CAMERA_FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = ROAD_LENGTH + 50;
export const CAMERA_INITIAL_POS_Y = 10; // Camera height
export const CAMERA_INITIAL_POS_Z = CAR_INITIAL_Z + 15; // Camera distance behind the car
export const CAMERA_LOOK_AT_Y = CAR_HEIGHT / 2; // Where the camera looks on the Y axis

// Obstacle constants
export const OBSTACLE_WIDTH = LANE_WIDTH * 0.8;
export const OBSTACLE_HEIGHT = 2;
export const OBSTACLE_DEPTH = 2;
export const OBSTACLE_COLOR = 0xff0000; // Neon red for obstacles
export const OBSTACLE_SPAWN_INTERVAL_INITIAL = 2; // Seconds between obstacle spawns
export const OBSTACLE_SPAWN_INTERVAL_MIN = 0.5; // Minimum spawn interval
export const OBSTACLE_SPAWN_INTERVAL_DECREASE_RATE = 0.05; // How much spawn interval decreases per difficulty increase

// Lighting constants
export const AMBIENT_LIGHT_COLOR = 0x444444;
export const DIRECTIONAL_LIGHT_COLOR = 0xffffff;
export const DIRECTIONAL_LIGHT_INTENSITY = 0.8;

// UI elements (CSS selectors)
export const UI_SELECTORS = {
    HUD_SCORE_VALUE: '#score-value',
    GAME_OVER_SCREEN: '#game-over-screen',
    GAME_OVER_FINAL_SCORE_VALUE: '#final-score-value',
    RESTART_BUTTON: '#restart-button',
};
