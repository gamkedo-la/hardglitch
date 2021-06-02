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
    enable_infobox_pointer: false,
    enable_new_turn_wait: false,

    enable_item_slot_help: false,
};

window.game_config = config;

