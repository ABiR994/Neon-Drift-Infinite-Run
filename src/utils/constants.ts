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

// Fog constants (animated)
export const FOG_NEAR = ROAD_LENGTH * 0.4; // Fog start distance (Still useful for camera setup, even if not directly for FogExp2)
export const FOG_FAR = ROAD_LENGTH * 0.9; // Fog end distance (Still useful for camera setup)
export const FOG_COLOR = 0x0a0a1a; // Fog color matching background
export const FOG_DENSITY_INITIAL = 0.01; // Initial fog density for animated fog (FogExp2)
export const FOG_DENSITY_MAX_SPEED_MULTIPLIER = 2.0; // How much fog density increases at max speed

// Car constants
export const CAR_WIDTH = 1.5;
export const CAR_HEIGHT = 1;
export const CAR_DEPTH = 3;
export const CAR_INITIAL_Z = ROAD_LENGTH / 2 - 10; // Position of the car along the Z axis
export const CAR_MOVE_SPEED = 20; // How fast the car moves between lanes
export const CAR_COLOR = 0xff00ff; // Neon magenta for the car

// Car animation constants
export const CAR_MAX_TILT_ANGLE = Math.PI / 16; // Max angle for car tilt left/right (in radians)
export const CAR_TILT_SPEED = 8; // How fast the car tilts (interpolation factor)
export const CAR_BOUNCE_AMPLITUDE = 0.05; // Amplitude of the car's vertical bounce
export const CAR_BOUNCE_FREQUENCY = 10; // Frequency of the car's vertical bounce

// Collision feedback constants
export const NEAR_MISS_DISTANCE = 3; // Distance at which a near miss is detected
export const NEAR_MISS_SHAKE_INTENSITY = 0.05; // Intensity of camera shake for near misses
export const NEAR_MISS_FLASH_DURATION = 0.1; // Duration of light flash for near misses (seconds)
export const COLLISION_FREEZE_DURATION = 0.15; // Duration of freeze frame on collision (seconds)
export const COLLISION_SHAKE_INTENSITY = 0.3; // Intensity of camera shake on collision
export const COLLISION_FLASH_DURATION = 0.2; // Duration of screen flash on collision (seconds)


// Camera constants
export const CAMERA_FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = ROAD_LENGTH + 50;
export const CAMERA_INITIAL_POS_Y = 10; // Camera height
export const CAMERA_INITIAL_POS_Z = CAR_INITIAL_Z + 15; // Camera distance behind the car
export const CAMERA_LOOK_AT_Y = CAR_HEIGHT / 2; // Where the camera looks on the Y axis
export const CAMERA_MAX_FOV_SPEED_MULTIPLIER = 1.2; // Max FOV is CAMERA_FOV * this multiplier
export const CAMERA_TILT_MAX_ANGLE = 0.05; // Max forward tilt in radians
export const CAMERA_TILT_SPEED_MULTIPLIER = 0.005; // How much tilt increases with speed

// Camera shake constants
export const CAMERA_SHAKE_MAX_INTENSITY = 0.1; // Max camera shake displacement
export const CAMERA_SHAKE_SPEED_THRESHOLD = 50; // Speed at which camera shake begins
export const CAMERA_SHAKE_FREQUENCY = 20; // How fast the camera shakes

// Obstacle constants
export const OBSTACLE_WIDTH = LANE_WIDTH * 0.8;
export const OBSTACLE_HEIGHT = 2;
export const OBSTACLE_DEPTH = 2;
export const OBSTACLE_COLOR = 0xff0000; // Neon red for obstacles
export const OBSTACLE_SPAWN_INTERVAL_INITIAL = 2; // Seconds between obstacle spawns
export const OBSTACLE_SPAWN_INTERVAL_MIN = 0.5; // Minimum spawn interval
export const OBSTACLE_SPAWN_INTERVAL_DECREASE_RATE = 0.05; // How much spawn interval decreases per difficulty increase

// Obstacle emissive and pulsation constants
export const OBSTACLE_EMISSIVE_INTENSITY_MIN = 0.5;
export const OBSTACLE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER = 1.5; // Max intensity at max speed
export const OBSTACLE_PULSE_SPEED = 6; // How fast the emissive intensity pulses for obstacles
export const OBSTACLE_PULSE_AMPLITUDE = 0.2; // Amplitude of the pulsation for obstacles

// Obstacle patterns
export const OBSTACLE_PATTERN_CHANCE_DOUBLE = 0.3; // 30% chance for a double obstacle pattern

// Road emissive and pulsation constants
export const ROAD_LINE_EMISSIVE_INTENSITY_MIN = 0.5;
export const ROAD_LINE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER = 1.5; // Max intensity at max speed
export const ROAD_EDGE_EMISSIVE_INTENSITY_MIN = 0.8;
export const ROAD_EDGE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER = 1.8; // Max intensity at max speed
export const ROAD_SEGMENT_EMISSIVE_INTENSITY = 0.05; // Subtle glow for road segments
export const ROAD_PULSE_SPEED = 5; // How fast the emissive intensity pulses
export const ROAD_PULSE_AMPLITUDE = 0.1; // Amplitude of the pulsation

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
    HUD_SPEED_VALUE: '#speed-value',
    GAME_OVER_NEW_HIGH_SCORE_MESSAGE: '#new-high-score-message', // New: Selector for new high score message
};

// Power-up constants
export const POWERUP_SPAWN_CHANCE = 0.2; // 20% chance to spawn a power-up instead of nothing when checking
export const POWERUP_SPAWN_INTERVAL = 5; // Check for spawn every 5 seconds
export const POWERUP_DURATION_BOOST = 3;
export const POWERUP_DURATION_MULTIPLIER = 10;
export const POWERUP_DURATION_MAGNET = 8;
export const POWERUP_BOOST_SPEED_MULT = 1.5;

// Heat system constants
export const HEAT_INCREASE_RATE = 40; // Percent per second when boosting
export const HEAT_DECREASE_RATE = 20; // Percent per second when not boosting
export const HEAT_OVERHEAT_COOLDOWN = 3; // Seconds to cool down after overheating
export const MANUAL_BOOST_SPEED_MULT = 1.3;

// Economy constants
export const CREDIT_SPAWN_CHANCE = 0.4;
export const CREDIT_SPAWN_INTERVAL = 1.5;
export const CREDIT_VALUE = 10;

// Theme types
export interface Theme {
    fogColor: number;
    roadLineColor: number;
    ambientColor: number;
    carEmissiveColor: number;
}

export const THEMES: Theme[] = [
    { fogColor: 0x0a0a1a, roadLineColor: 0x00ffff, ambientColor: 0x444444, carEmissiveColor: 0x00ffff }, // Cyan Night
    { fogColor: 0x1a0a1a, roadLineColor: 0xff00ff, ambientColor: 0x442244, carEmissiveColor: 0xff00ff }, // Magenta Dusk
    { fogColor: 0x1a150a, roadLineColor: 0xffaa00, ambientColor: 0x443322, carEmissiveColor: 0xffaa00 }, // Golden Sunset
    { fogColor: 0x0a1a0a, roadLineColor: 0x00ff88, ambientColor: 0x224433, carEmissiveColor: 0x00ff88 }, // Emerald Matrix
];

export const THEME_MILESTONE = 2000; // Change theme every 2000 points

// Upgrade constants
export interface UpgradeLevel {
    cost: number;
    value: number;
}

export const UPGRADES = {
    DURATION: [
        { cost: 0, value: 1.0 },
        { cost: 500, value: 1.2 },
        { cost: 1200, value: 1.5 },
        { cost: 2500, value: 2.0 },
    ],
    COOLING: [
        { cost: 0, value: 1.0 },
        { cost: 400, value: 1.25 },
        { cost: 1000, value: 1.6 },
        { cost: 2000, value: 2.2 },
    ],
    MAGNET_STRENGTH: [
        { cost: 0, value: 1.0 },
        { cost: 600, value: 1.3 },
        { cost: 1500, value: 1.8 },
        { cost: 3000, value: 2.5 },
    ]
};

// UI animation constants
export const HUD_MAX_BLUR = 5; // Max blur in pixels at max speed
export const HUD_MAX_MOTION_OFFSET = 10; // Max Y-offset for HUD motion at max speed
export const HUD_MOTION_SMOOTHING = 0.1; // Smoothing factor for HUD motion

// Score feedback constants
export const MILESTONE_INTERVAL = 1000; // How often (in points) a milestone occurs
export const FLOATING_TEXT_COLOR = 0x00ff00; // Green for floating text
export const FLOATING_TEXT_SIZE = 0.5; // Size of the floating text
export const FLOATING_TEXT_RISE_SPEED = 2; // How fast the text floats upwards
export const FLOATING_TEXT_FADE_DURATION = 1.5; // How long the text stays visible before fading out
