import { GAME_CONFIG } from '../utils/config.js';

export function createPlayer(id, x = 0, y = 0) {
  return {
    id,
    x,
    y,
    radius: GAME_CONFIG.PLAYER.INITIAL_RADIUS,
    color: getRandomPlayerColor()
  };
}

function getRandomPlayerColor() {
  const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
                 '#536DFE', '#448AFF', '#40C4FF', '#18FFFF'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function updatePlayerPosition(player, x, y) {
  if (player) {
    player.x = x;
    player.y = y;
  }
}

export function growPlayer(player, growthFactor) {
  if (player) {
    player.radius *= growthFactor;
  }
}