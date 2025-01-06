import {Vector2, Box2} from "threejs-math"
import {build_player, build_player_inp, update} from "./game_state.js"


// Input handling ////////////////////////////////////////////////////////////////////////////////////
var y_dir = 0; 
var x_dir = 0; 
var key_dict = {}; 

document.addEventListener("keydown", handledown);
document.addEventListener("keyup", handleup)

function handledown(e) {
    if(e.code == "ArrowDown" || e.code == "KeyS") {
        y_dir = 1;
    } else if(e.code == "ArrowUp" || e.code == "KeyW") {
        y_dir = -1;
    } else if(e.code == "ArrowLeft" || e.code == "KeyA") {
        x_dir = -1;
    } else if (e.code == "ArrowRight" || e.code == "KeyD") {
        x_dir = 1; 
    } else {
        key_dict[e.code] = true; 
    }
}
function handleup(e) {
    if(e.code == "ArrowDown" || e.code == "KeyS") {
        y_dir -= 1;
    } else if(e.code == "ArrowUp" || e.code == "KeyW") {
        y_dir += 1;
    } else if(e.code == "ArrowLeft" || e.code == "KeyA") {
        x_dir += 1;
    } else if (e.code == "ArrowRight" || e.code == "KeyD") {
        x_dir -= 1; 
    } else {
        key_dict[e.code] = false; 
    }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const rect = canvas.getBoundingClientRect();

var mouse_x = 0; var mouse_y = 0; 
var mouse_left = false; var mouse_right = false; 

canvas.addEventListener('mousemove', (event) => {
  mouse_x = event.clientX - rect.left;
  mouse_y = event.clientY - rect.top;
});
  
// Function to update the mouse state
function updateMouseState(event) {
    mouse_left = (event.buttons & 1) === 1; // Left button
    mouse_right = (event.buttons & 2) === 2; // Right button
}

// Event listeners for mouse events
document.addEventListener("mousedown", updateMouseState);
document.addEventListener("mouseup", updateMouseState);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function render(game_state) {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, 1000, 1000);
    let players = game_state.player_state; 
    for (var i = 0; i < players.length; i+=1) {
        var player = players[i];
        var x = player.pos.x; var y = player.pos.y; 
        ctx.fillStyle = "blue";
        ctx.fillRect(x, y, 10, 10);
    }

    for (var i = 0; i < game_state.bullet_state.length; i+=1) {
        let bullet = game_state.bullet_state[i]; 
        let x = bullet.pos.x; var y = bullet.pos.y; 
        ctx.fillStyle = "red";
        ctx.fillRect(x, y, 5, 5);
    }
}

function build_input(player_ind) {
    let input_state = {player_input: []}; 
    input_state.player_input[player_ind] = build_player_inp(x_dir, y_dir, mouse_x, mouse_y, mouse_left, mouse_right); 
    input_state.player_input[(player_ind+1)%2] = build_player_inp(); 
    return input_state; 
}

let player_ind = 0; 

const timestep = 1.0 / 60.0 * 1000;

let previous_time = 0.0;
let delta = 0.0;

let p1 = build_player();
let p2 = build_player(); 
let game_state = {frame: 0, player_state: [p1, p2], bullet_state: []}; 

let buffer_start = 0; 
let buffer_len = 60; 

let game_state_buffer = []; 
for (var i = 0; i < buffer_len; i+=1) {
    game_state_buffer[i] = game_state; 
}

let input_buffer = []; 
let input_frame_delay = 5; 
let curr_inp = build_input(player_ind); 
for (var i = 0; i < buffer_len; i+=1) {
    input_buffer[i] = curr_inp; 
}

const loop = time => {
  // Compute the delta-time against the previous time
  const dt = time - previous_time;

  // Accumulate delta time
  delta = delta + dt;

  // Update the previous time
  previous_time = time;

  // Update your game
  while (delta > timestep) {
    let curr_inp = build_input(player_ind); 
    input_buffer[(buffer_start + buffer_len - 1) % buffer_len] = curr_inp; //Overwrite buffer w/ next input
    let input_state = input_buffer[(buffer_start + buffer_len - input_frame_delay) % buffer_len]; 
    game_state_buffer[(buffer_start + buffer_len - 1) % buffer_len] = curr_inp; 

    game_state = update(game_state, input_state);
    delta = delta - timestep;
    buffer_start = (buffer_start + 1) % buffer_len; 
  }

  if(key_dict['KeyJ']) {
    console.log(game_state); 
  }

  // Render your game
  render(game_state);

  // Repeat
  window.requestAnimationFrame(loop);
};

// Launch
window.requestAnimationFrame(time => {
  previous_time = time;

  window.requestAnimationFrame(loop);
});