///////////////////////////////
// This file contains only variables (or getter/setter) that
// represent the general options of the game.
// They should be designed so that changing them will change the game
// immediately live while playing.

export const fov_view_styles = {
    WHITE_SQUARE: 0,
    EYE : 1,
    EYE_ON_SQUARE : 2,
    EYE_SPRITE: 3,
};

export const save_names = {
    game_mode: 'hardglitch.game_mode',
    world_exit_save: 'hardglitch.world_exit_save',
    highest_level_reached_idx: 'hardglitch.highest_level_reached_idx',
    character_first_entering_highest_level: 'hardglitch.character_first_entering_highest_level',
};

export const game_modes = {
    glitch: "glitch",
    crash: "crash",
};

export const levels_count = 5;

export const config = {

    enable_particles: true,
    enable_stats_bar_value_always_visible: true,
    enable_turn_message: true,
    enable_turn_sound: true,
    enable_timeline: true,
    enable_infobox: true,
    enable_ground_descriptions: false,
    fov_view_style: fov_view_styles.EYE_SPRITE,
    enable_view_healthbars: false,
    force_view_healthbars: false,
    enable_infobox_pointer: true,
    enable_new_turn_wait: true,
    enable_decrypt_by_move: true,
    enable_take_by_move: true,

    enable_item_slot_help: false,

    enable_keyboard_input_when_mouse_over_ui: true,

    enable_screen_fades: true,
    enable_timeline_movement: true,
};

window.game_config = config;

