export {
    CameraControl,
}

import * as debug from "../system/debug.js";
import * as graphics from "../system/graphics.js";
import * as steering from "../system/steering.js";
import { EntityView, PIXELS_PER_TILES_SIDE, square_half_unit_vector } from "./entity-view.js";

window.camera_tracking = {
    max_acceleration: 10000.0,
    max_speed: 2000.0,
    slow_radius: 600,
    target_radius: 8,
    focus_radius: 400,
};

class CameraControl {

    constructor(){
        this.camera_kinematics = new steering.Kinematics();
        this.steering_system = new steering.SteeringSystem(this.camera_kinematics);
    }

    // Moves the center to a specific position.
    focus_on(grid_position, target_radius = window.camera_tracking.focus_radius){
        debug.assertion(()=>Number.isInteger(grid_position.x) && Number.isInteger(grid_position.y));
        this.stop();

        const gfx_position = graphics.from_grid_to_graphic_position(grid_position, PIXELS_PER_TILES_SIDE)
            .translate(square_half_unit_vector); // center in the square

            let resolver;
        const promise = new Promise((r)=>{ resolver = r });

        const arrive = new steering.Arrive({
            target: { position: gfx_position },
            max_acceleration: window.camera_tracking.max_acceleration,
            max_speed: window.camera_tracking.max_speed,
            slow_radius: window.camera_tracking.slow_radius,
            target_radius: target_radius,
            on_arrived: ()=>{
                this.camera_kinematics.velocity.to_zero();
                graphics.camera.center_position = gfx_position;
                resolver();
            },
        });
        this.steering_system.add(arrive);

        return promise;
    }

    track(entity_view){
        debug.assertion(()=>entity_view instanceof EntityView);

        // If we are already tracking entities, we just need to change the entity being tracked.
        if(this.tracking_steer){
            if(this.tracking_steer.target !== entity_view){
                this.tracking_steer.target = entity_view;
            }
            return;
        }

        this.stop();
        this.tracking_steer = new steering.Arrive({
            target: entity_view,
            max_acceleration: window.camera_tracking.max_acceleration,
            max_speed: window.camera_tracking.max_speed,
            slow_radius: window.camera_tracking.slow_radius,
            target_radius: window.camera_tracking.target_radius,
            never_done: true,
        });

        this.steering_system.add(this.tracking_steer);
    }

    stop(){
        this.camera_kinematics.velocity.to_zero();
        this.steering_system.clear();
        delete this.tracking_steer;
    }

    update(delta_time){

        this.camera_kinematics.position = graphics.camera.center_position;
        this.steering_system.update(delta_time, this.camera_kinematics);
        graphics.camera.center_position = this.camera_kinematics.position;
    }


};
