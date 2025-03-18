import { GAME_CONFIG } from '../../server/utils/config.js';

export function createPlayer(canvasWidth, canvasHeight) {
  return {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    radius: GAME_CONFIG.PLAYER.INITIAL_RADIUS,
    color: 'red',
    speed: GAME_CONFIG.PLAYER.SPEED
  };
}

export function updatePlayerPosition(player, mouse) {
  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > player.speed) {
    player.x += (dx / distance) * player.speed;
    player.y += (dy / distance) * player.speed;
  } else {
    player.x = mouse.x;
    player.y = mouse.y;
  }
}