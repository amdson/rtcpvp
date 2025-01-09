import {Vector2, Box2} from "threejs-math"

const B1_speed = 12;
const B2_speed = 1.5; 


function evil_AI(gamestate) {
    let player = gamestate.player_state[0]; //AI is always P2
    let ai_state = gamestate.player_state[1]; 

    let d = player.pos.clone().sub(ai_state.pos); 
    let v = player.vel.clone(); 
    let s = B1_speed; 
    let fd = 3; 
    let [a_coef, b_coef, c_coef] = [(v.dot(v) - s*s), 2*v.dot(d)+2*fd*s*s, d.dot(d)-fd*fd*s*s];

    let t1 = (-b_coef - Math.sqrt(b_coef*b_coef - 4*a_coef*c_coef) ) / (2*a_coef);
    let t2 = (-b_coef + Math.sqrt(b_coef*b_coef - 4*a_coef*c_coef) ) / (2*a_coef);
    let t = 0; 
    if(t1 > 0 && t2 > 0) {
        t = Math.min(t1, t2); 
    } else if(t1 > 0) {
        t = t1; 
    } else if(t2 > 0) {
        t = t2; 
    }
    if(Math.random() > 0.3) {
        t = Math.random()*t; 
    }

    let target_point = player.pos.clone().addScaledVector(player.vel, t); 
    let mouse_inp = [target_point.x, target_point.y]; 
    let ai_input = build_player_inp(); 
    ai_input.mouse_inp = mouse_inp; 
    ai_input.mouse_left = true; 

    let p = ai_state.pos; 
    let center_del = p.clone().sub(new Vector2(250, 250)); 
    let dodge_vec = center_del.clone().normalize().multiplyScalar(-0.2); 
    dodge_vec.multiplyScalar(1+2*(center_del.length() > 200)); 
    dodge_vec.add(ai_state.vel.clone().normalize().multiplyScalar(0.5)); 

    dodge_vec.add(d.clone().normalize().multiplyScalar(0.5));

    for (let i = 0; i < gamestate.bullet_state.length; i++) {
        let bullet = gamestate.bullet_state[i]; 
        let b = bullet.pos; 
        let v = bullet.vel; 
        let v_vel = bullet.vel.length(); 
        let vnorm = v.clone().normalize(); 
        let del = p.clone().sub(b); 
        let tang = del.clone().sub(vnorm.clone().multiplyScalar(del.dot(vnorm))); 
        let scaling = 5*(tang.length() < 25)*(del.length() < 300)*(vnorm.dot(d) < 0); 
        dodge_vec.addScaledVector(tang.normalize(), scaling); 
    }
    dodge_vec.normalize(); 
    // console.log(dodge_vec); 
    ai_input.dir_inp = [dodge_vec.x, dodge_vec.y]; 
    return ai_input; 
}

function update(game_state, input_state) {
    let next_game_state = {player_state: [], bullet_state: [], frame: game_state.frame+1};
    let players = game_state.player_state; 
    for (var i = 0; i < players.length; i+=1) {
        var player = build_player(players[i]); //Duplicate player
        let player_input = input_state[i]; 
        let dir_inp = new Vector2(player_input.dir_inp[0], player_input.dir_inp[1]); 
        dir_inp.normalize(); 

        if(player_input.mouse_right && player.dash_cooldown <= 0) {
            player.vel.addScaledVector(dir_inp, 2e1);
            player.dash_cooldown = 30; 
            player.dash_time = 9; 
        }
        
        if(player.dash_time <= 0) {
            player.vel.clampLength(0, 9); 
        }

        player.vel.addScaledVector(dir_inp, 1.5e0); 
        player.vel.addScaledVector(player.vel, -0.2); 

        player.pos.add(player.vel); 

        player.pos.clampScalar(0, 490); 

        player.bullet_cooldown -= 1; 
        player.dash_cooldown -= 1; 
        player.dash_time -= 1; 
        
        let mouse_inp = new Vector2(player_input.mouse_inp[0], player_input.mouse_inp[1]); 
        if(player_input.mouse_left && player.bullet_cooldown <= 0) {
            let bullet_dir = mouse_inp.clone().sub(player.pos);
            bullet_dir.normalize();
            if(player_input.space) {
                next_game_state.bullet_state.push({pos: player.pos.clone().addScaledVector(bullet_dir, 30), 
                                                    vel: bullet_dir.clone().multiplyScalar(B2_speed), lifetime: 500,
                                                    size: 15}); 
                player.bullet_cooldown = 20; 
            } else {
                next_game_state.bullet_state.push({pos: player.pos.clone().addScaledVector(bullet_dir, 30), 
                                                    vel: bullet_dir.clone().multiplyScalar(B1_speed), lifetime: 200,
                                                    size: 5}); 
                player.bullet_cooldown = 10; 
            }
        }

        let player_box = new Box2(player.pos, player.pos.clone().addScalar(10)); 
        for (var j = 0; j < game_state.bullet_state.length; j+=1) { 
            let bullet = game_state.bullet_state[j]; 
            let bullet_box = new Box2(bullet.pos, bullet.pos.clone().addScalar(bullet.size)); 
            if(player_box.intersectsBox(bullet_box)) {
                player.health -= 10; 
                bullet.lifetime = 0; 
            }
        }
        next_game_state.player_state.push(player);
    }

    for (var i = 0; i < game_state.bullet_state.length; i+=1) {
        let bullet = game_state.bullet_state[i]; 
        let pos = bullet.pos.clone().add(bullet.vel); 
        let lifetime = bullet.lifetime - 1; 
        if ( lifetime > 0) {
            next_game_state.bullet_state.push({pos: pos, vel: bullet.vel.clone(), size: bullet.size, lifetime: lifetime}); 
        }
    }
    return next_game_state; 
}

function build_player_inp(x_dir=0, y_dir=0, mouse_x=0, mouse_y=0, mouse_left=false, mouse_right=false, space=false) {
    let dir_inp = [x_dir, y_dir]; 
    let mouse_inp = [mouse_x, mouse_y]; 
    return {dir_inp: dir_inp, mouse_inp: mouse_inp, mouse_left: mouse_left, mouse_right: mouse_right, space: space}; 
}

function build_player(player=false) {
    if(player) {
        return {pos: player.pos.clone(), vel: player.vel.clone(), health: player.health, 
            bullet_cooldown: player.bullet_cooldown, dash_cooldown: player.dash_cooldown, dash_time: player.dash_time}; 
    }
    return {pos: new Vector2(0, 0), vel: new Vector2(0, 0), health: 100, bullet_cooldown: 0, dash_cooldown: 0, dash_time: 0}; 
}

function array_equal(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

function input_equal(i1, i2) {
    return (array_equal(i1.dir_inp, i2.dir_inp) && 
            (i1.mouse_left == i2.mouse_left) && 
            (i1.mouse_right == i2.mouse_right) &&
            (array_equal(i1.mouse_inp, i2.mouse_inp) || (!(i1.mouse_left || i1.mouse_right))));
}

export {build_player, build_player_inp, evil_AI, update, array_equal, input_equal};