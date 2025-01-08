import {Vector2, Box2} from "threejs-math"

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
                
                next_game_state.bullet_state.push({pos: player.pos.clone().addScaledVector(bullet_dir, 20), 
                                                    vel: bullet_dir.clone().multiplyScalar(1.2), lifetime: 500,
                                                    size: 15}); 
                player.bullet_cooldown = 20; 
            } else {
                bullet_dir.multiplyScalar(12.0); 
                next_game_state.bullet_state.push({pos: player.pos.clone().addScaledVector(bullet_dir, 3), 
                                                    vel: bullet_dir, lifetime: 200,
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

export {build_player, build_player_inp, update, array_equal, input_equal};