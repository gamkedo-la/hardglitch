// Provides tooling for steering behaviors.

export {
    Kinematics,
    SteeringSystem,
    Seek,
    Arrive,
}

import * as debug from "./debug.js";
import {Vector2} from "./spatial.js";
import { is_number } from "./utility.js";

class Kinematics { // TODO: implies a ECS system?

    position = new Vector2();
    velocity = new Vector2();
    acceleration = new Vector2();

    // TODO: add orientation/torque/rotation
}


class Steering {

    // Returns a 2d vector used as translation
    linear_steer = new Vector2();
    angular_steer = 0;
    done= false; // Set to true when we need to stop doing this steernig.

    update(physic_props){
        debug.assertion(()=>physic_props instanceof Kinematics);
        throw "Steering update not implemented.";
    }
};

class SteeringSystem {
    steerings = [];
    max_speed = 0;

    constructor(physical_entity_props){
        debug.assertion(()=>physical_entity_props instanceof Kinematics);
        this.entity_props = physical_entity_props;
    }

    add(steering){
        debug.assertion(()=>steering instanceof Steering);
        this.steerings.push(steering);
    }

    clear(){
        this.steerings = [];
    }

    update(delta_time){
        const delta_time_secs = delta_time * 0.001;

        this.steerings= this.steerings.filter(steering=>!steering.done);

        const current_velocity = this.entity_props.velocity.multiply(delta_time_secs);
        this.entity_props.position = this.entity_props.position.translate(current_velocity);

        const linear_steer = this.steerings.reduce((linear_steer, steering)=>{
                steering.linear_steer.to_zero();
                steering.update(this.entity_props);
                return linear_steer.translate(steering.linear_steer);
            }, new Vector2())
            .multiply(delta_time_secs);

        this.entity_props.velocity = this.entity_props.velocity.translate(linear_steer);
        if(this.max_speed){
            this.entity_props.velocity.clamp(0, this.max_speed);
        }
    }
}

class Seek extends Steering {

    constructor(desc){
        debug.assertion(()=>desc instanceof Object);
        debug.assertion(()=>desc.target instanceof Object);
        debug.assertion(()=>(desc.target.position) instanceof Vector2);
        debug.assertion(()=>desc.max_acceleration === undefined || is_number(desc.max_acceleration));
        super();
        this.target = desc.target;
        this.max_acceleration = desc.max_acceleration !== undefined ? desc.max_acceleration : 0; // no max by default

    }

    update(physic_props){
        debug.assertion(()=>physic_props instanceof Kinematics);
        this.linear_steer = this.target.position.substract(physic_props.position);
        if(this.max_acceleration > 0){
            this.linear_steer.clamp(0, this.max_acceleration);
        }
    }
}

class Arrive extends Steering {
    constructor(desc){
        debug.assertion(()=>desc instanceof Object);
        debug.assertion(()=>desc.target instanceof Object);
        debug.assertion(()=>(desc.target.position) instanceof Vector2);
        debug.assertion(()=>desc.max_acceleration === undefined || is_number(desc.max_acceleration));
        debug.assertion(()=>desc.max_speed === undefined || is_number(desc.max_speed));
        debug.assertion(()=>desc.target_radius === undefined || is_number(desc.target_radius));
        debug.assertion(()=>desc.slow_radius === undefined || is_number(desc.slow_radius));
        debug.assertion(()=>desc.time_to_target === undefined || is_number(desc.time_to_target));
        debug.assertion(()=>desc.on_arrived === undefined || desc.on_arrived instanceof Function);
        debug.assertion(()=>desc.never_done === undefined || typeof desc.never_done === "boolean");
        super();
        this.target = desc.target;
        this.max_acceleration = desc.max_acceleration !== undefined ? desc.max_acceleration : 0; // no max by default
        this.max_speed = desc.max_speed !== undefined ? desc.max_speed : 10000; // no max by default
        this.target_radius = desc.target_radius !== undefined ? desc.target_radius : 20;
        this.slow_radius = desc.slow_radius !== undefined ? desc.slow_radius : 100;
        this.time_to_target = desc.time_to_target !== undefined ? desc.time_to_target : 0.1;
        this.on_arrived = desc.on_arrived;
        this.never_done = desc.never_done;
    }

    update(physic_props){
        debug.assertion(()=>physic_props instanceof Kinematics);
        const direction = this.target.position.substract(physic_props.position);
        let distance = direction.length;

        if(distance < this.target_radius){
            if(this.never_done){
                distance = 0;
            } else {
                this.done = true;
                if(this.on_arrived){
                    this.on_arrived();
                    delete this.on_arrived;
                }
                return;
            }
        }



        let target_speed = this.max_speed;
        if(distance < this.slow_radius){
            target_speed = this.max_speed * distance / this.slow_radius;
        }

        const target_velocity = direction.normalize().multiply(target_speed);
        this.linear_steer = target_velocity.substract(physic_props.velocity).divide(this.time_to_target);

        if(this.max_acceleration > 0){
            this.linear_steer.clamp(0, this.max_acceleration);
        }
    }
}

