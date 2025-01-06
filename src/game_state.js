import {Vector2, Box2} from "threejs-math"

function update(game_state, input_state) {
    let next_game_state = {player_state: [], bullet_state: [], frame: game_state.frame+1};
    let players = game_state.player_state; 
    for (var i = 0; i < players.length; i+=1) {
        var player = build_player(players[i]); //Duplicate player
        let player_input = input_state.player_input[i]; 
        let dir_inp = new Vector2(player_input.dir_inp[0], player_input.dir_inp[1]); 
        dir_inp.normalize()
        player.vel.addScaledVector(dir_inp, 5e-1); 
        player.vel.clampLength(0, 9); 
        player.vel.addScaledVector(player.vel, -0.1); 
        player.pos.add(player.vel); 
        player.bullet_cooldown -= 1; 
        
        let mouse_inp = new Vector2(player_input.mouse_inp[0], player_input.mouse_inp[1]); 
        if(player_input.mouse_left && player.bullet_cooldown <= 0) {
            let bullet_dir = mouse_inp.clone().sub(player.pos);
            bullet_dir.normalize();
            bullet_dir.multiplyScalar(3.0); 
            next_game_state.bullet_state.push({pos: player.pos.clone().add(bullet_dir), vel: bullet_dir, lifetime: 200}); 
            player.bullet_cooldown = 30; 
        }
        next_game_state.player_state.push(player);
    }

    for (var i = 0; i < game_state.bullet_state.length; i+=1) {
        let bullet = game_state.bullet_state[i]; 
        let pos = bullet.pos.clone().add(bullet.vel); 
        let lifetime = bullet.lifetime - 1; 
        if ( lifetime > 0) {
            next_game_state.bullet_state.push({pos: pos, vel: bullet.vel.clone(), lifetime: lifetime}); 
        }
    }
    return next_game_state; 
}

function build_player_inp(x_dir=0, y_dir=0, mouse_x=0, mouse_y=0, mouse_left=false, mouse_right=false) {
    let dir_inp = [x_dir, y_dir]; 
    let mouse_inp = [mouse_x, mouse_y]; 
    return {dir_inp: dir_inp, mouse_inp: mouse_inp, mouse_left: mouse_left, mouse_right: mouse_right}; 
}

function build_player(player=false) {
    if(player) {
        return {pos: player.pos.clone(), vel: player.vel.clone(), 
            bullet_cooldown: player.bullet_cooldown, dash_cooldown: player.dash_cooldown}; 
    }
    return {pos: new Vector2(0, 0), vel: new Vector2(0, 0), bullet_cooldown: 0, dash_cooldown: 0}; 
}

export {build_player, build_player_inp, update};