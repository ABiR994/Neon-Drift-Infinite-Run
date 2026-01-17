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
export const ROAD_COLOR = 0x1A1F2E; // Asphalt Dark Gray
export const ROAD_LINE_COLOR = 0x2EF2FF; // Neon Cyan

// Fog constants (animated)
export const FOG_NEAR = ROAD_LENGTH * 0.4; // Fog start distance (Still useful for camera setup, even if not directly for FogExp2)
export const FOG_FAR = ROAD_LENGTH * 0.9; // Fog end distance (Still useful for camera setup)
export const FOG_COLOR = 0x0B1020; // Deep Midnight Blue
export const FOG_DENSITY_INITIAL = 0.01; // Initial fog density for animated fog (FogExp2)
export const FOG_DENSITY_MAX_SPEED_MULTIPLIER = 2.0; // How much fog density increases at max speed

// Car constants
export const CAR_WIDTH = 1.8; // Slightly wider
export const CAR_HEIGHT = 1;
export const CAR_DEPTH = 3.5; // Slightly longer
export const CAR_INITIAL_Z = ROAD_LENGTH / 2 - 10; // Position of the car along the Z axis
export const CAR_MOVE_SPEED = 20; // How fast the car moves between lanes
export const CAR_COLOR = 0xD946EF; // Electric Magenta
export const CAR_ACCENT_COLOR = 0x2EF2FF; // Neon Cyan
export const CAR_EMISSIVE_INTENSITY_MIN = 1.0; // Increased
export const CAR_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER = 2.5; // Increased

// Car animation constants
export const CAR_MAX_TILT_ANGLE = Math.PI / 16; // Max angle for car tilt left/right (in radians)
export const CAR_TILT_SPEED = 8; // How fast the car tilts (interpolation factor)
export const CAR_BOUNCE_AMPLITUDE = 0.05; // Amplitude of the car's vertical bounce
export const CAR_BOUNCE_FREQUENCY = 10; // Frequency of the car's vertical bounce
export const CAR_VIBRATION_INTENSITY = 0.0; // Removed shakiness
export const CAR_VIBRATION_SPEED_THRESHOLD = 70; // Speed at which car vibration begins
export const CAR_VIBRATION_FREQUENCY = 30; // How fast the car vibrates

// Car effects constants
export const CAR_UNDERGLOW_COLOR = 0x2EF2FF; // Neon Cyan
export const CAR_UNDERGLOW_INTENSITY = 3.0; // Increased
export const CAR_TRAIL_COLOR = 0xD946EF; // Electric Magenta
export const CAR_TRAIL_LENGTH = 5;
export const CAR_TRAIL_WIDTH = 0.2;

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

// Camera shake constants (Removed shakiness)
export const CAMERA_SHAKE_MAX_INTENSITY = 0.0; // Max camera shake displacement (set to 0 to disable speed-based shake)
export const CAMERA_SHAKE_SPEED_THRESHOLD = 50; // Speed at which camera shake begins
export const CAMERA_SHAKE_FREQUENCY = 20; // How fast the camera shakes

// Obstacle constants
export const OBSTACLE_WIDTH = LANE_WIDTH * 0.8;
export const OBSTACLE_HEIGHT = 2;
export const OBSTACLE_DEPTH = 2;
export const OBSTACLE_COLOR = 0xD946EF; // Electric Magenta
export const OBSTACLE_SPAWN_INTERVAL_INITIAL = 2; // Seconds between obstacle spawns
export const OBSTACLE_SPAWN_INTERVAL_MIN = 0.5; // Minimum spawn interval
export const OBSTACLE_SPAWN_INTERVAL_DECREASE_RATE = 0.05; // How much spawn interval decreases per difficulty increase

// Obstacle variety types
export const OBSTACLE_TYPE_BARRIER = 'barrier';
export const OBSTACLE_TYPE_ENERGY_WALL = 'energy_wall';
export const OBSTACLE_TYPE_HOLO_BLOCK = 'holo_block';

// Obstacle emissive and pulsation constants
export const OBSTACLE_EMISSIVE_INTENSITY_MIN = 1.2; // Increased for prominence
export const OBSTACLE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER = 3.0; // Increased for dynamism
export const OBSTACLE_PULSE_SPEED = 6; // How fast the emissive intensity pulses for obstacles
export const OBSTACLE_PULSE_AMPLITUDE = 0.3; // Amplitude of the pulsation for obstacles
export const OBSTACLE_HOVER_AMPLITUDE = 0.1; // Amplitude of obstacle hover motion
export const OBSTACLE_HOVER_FREQUENCY = 5; // Frequency of obstacle hover motion
export const OBSTACLE_ROTATION_SPEED = 0.5; // Speed of obstacle rotation (radians per second)
export const OBSTACLE_APPROACH_GLOW_DISTANCE = 30; // Distance at which obstacle glow intensifies
export const OBSTACLE_SPAWN_FLASH_INTENSITY = 3.0; // Flash intensity on spawn
export const OBSTACLE_SPAWN_FLASH_DURATION = 0.5; // Flash duration on spawn

// Obstacle patterns
export const OBSTACLE_PATTERN_CHANCE_DOUBLE = 0.3; // 30% chance for a double obstacle pattern

// Road emissive and pulsation constants
export const ROAD_LINE_EMISSIVE_INTENSITY_MIN = 1.0; // Increased
export const ROAD_LINE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER = 2.5; // Increased
export const ROAD_EDGE_EMISSIVE_INTENSITY_MIN = 1.5; // Increased
export const ROAD_EDGE_EMISSIVE_INTENSITY_MAX_SPEED_MULTIPLIER = 3.0; // Increased
export const ROAD_SEGMENT_EMISSIVE_INTENSITY = 0.1; // Subtle glow for road segments
export const ROAD_PULSE_SPEED = 5; // How fast the emissive intensity pulses
export const ROAD_PULSE_AMPLITUDE = 0.1; // Amplitude of the pulsation

// Lighting constants
export const AMBIENT_LIGHT_COLOR = 0x7C7CFF; // Soft Violet (low intensity, cool color)
export const DIRECTIONAL_LIGHT_COLOR = 0xE6EDF3; // Soft White (main light, casts shadows)
export const DIRECTIONAL_LIGHT_INTENSITY = 0.8;
export const RIM_LIGHT_COLOR = 0x2EF2FF; // Neon Cyan (for rim/accent lighting)
export const RIM_LIGHT_INTENSITY = 2.5; // Increased intensity for visibility


// NEW: Sky colors for gradient skybox or background
export const SKY_COLOR_TOP = 0x7C7CFF;    // Soft Violet
export const SKY_COLOR_BOTTOM = 0x0B1020; // Deep Midnight Blue

// NEW: Road Surface Pattern constants
export const ROAD_PATTERN_COLOR = 0x2EF2FF; // Neon Cyan
export const ROAD_PATTERN_EMISSIVE_INTENSITY = 0.5;
export const ROAD_PATTERN_SCROLL_SPEED_MULTIPLIER = 0.1; // How fast patterns scroll relative to road

// NEW: Ambient Particle constants
export const AMBIENT_PARTICLE_COUNT = 200;
export const AMBIENT_PARTICLE_COLOR = 0x2EF2FF; // Neon Cyan
export const AMBIENT_PARTICLE_SIZE = 0.1;
export const AMBIENT_PARTICLE_SPEED_MULTIPLIER = 0.05; // Relative to game speed

// NEW: Star field constants
export const STAR_COUNT = 5000; // More stars for richer sky
export const STAR_COLOR = 0xE6EDF3; // Soft White
export const STAR_SIZE = 0.08; // Slightly larger
export const STAR_SPEED_MULTIPLIER = 0.005; // Very slow scroll relative to game speed

// NEW: Roadside Building constants
export const BUILDING_COLOR = 0x7C7CFF; // Soft Violet (primary body)
export const BUILDING_EMISSIVE_COLOR = 0x2EF2FF; // Neon Cyan (accents/windows)
export const BUILDING_EMISSIVE_INTENSITY = 2.0; // Increased
export const BUILDING_PARALLAX_FACTOR = 0.8; // How much slower buildings scroll than road
export const BUILDING_SPAWN_INTERVAL = 4; // More dense
export const BUILDING_HEIGHT_MIN = 15; // Increased
export const BUILDING_HEIGHT_MAX = 60; // Increased
export const BUILDING_WIDTH_MIN = 8; // Increased
export const BUILDING_WIDTH_MAX = 20; // Increased
export const BUILDING_DEPTH_MIN = 5;
export const BUILDING_DEPTH_MAX = 10;

// NEW: Roadside Tree constants (Cyber Trees)
export const TREE_TRUNK_COLOR = 0x2A2F3F; // Dark material, as per palette rules
export const TREE_EMISSIVE_COLOR = 0x2EF2FF; // Neon Cyan (for emissive veins/accents)
export const TREE_EMISSIVE_INTENSITY = 2.5; // Increased
export const TREE_PARALLAX_FACTOR = 0.9; // How much slower trees scroll than road
export const TREE_SPAWN_INTERVAL = 2; // More dense
export const TREE_HEIGHT_MIN = 10; // Increased
export const TREE_HEIGHT_MAX = 30; // Increased
export const TREE_BASE_SIZE_MIN = 2;
export const TREE_BASE_SIZE_MAX = 5;

// UI elements (CSS selectors)
export const UI_SELECTORS = {
    HUD_SCORE_VALUE: '#score-value',
    GAME_OVER_SCREEN: '#game-over-screen',
    GAME_OVER_FINAL_SCORE_VALUE: '#final-score-value',
    RESTART_BUTTON: '#restart-button',
    HUD_SPEED_VALUE: '#speed-value',
    GAME_OVER_NEW_HIGH_SCORE_MESSAGE: '#new-high-score-message', // New: Selector for new high score message
};

// UI animation constants
export const HUD_MAX_BLUR = 5; // Max blur in pixels at max speed
export const HUD_MAX_MOTION_OFFSET = 10; // Max Y-offset for HUD motion at max speed
export const HUD_MOTION_SMOOTHING = 0.1; // Smoothing factor for HUD motion

// Score feedback constants
export const MILESTONE_INTERVAL = 1000; // How often (in points) a milestone occurs
export const FLOATING_TEXT_COLOR = 0xFFB703; // Warm Amber
export const FLOATING_TEXT_SIZE = 0.5; // Size of the floating text
export const FLOATING_TEXT_RISE_SPEED = 2; // How fast the text floats upwards
export const FLOATING_TEXT_FADE_DURATION = 1.5; // How long the text stays visible before fading out
