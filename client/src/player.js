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
  // Calculer le vecteur de direction depuis le centre du canvas
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  // Calculer la direction en fonction de la position de la souris par rapport au centre
  const dx = mouse.x - centerX;
  const dy = mouse.y - centerY;
  
  // Vecteur de direction
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 0) {
    const directionX = dx / distance;
    const directionY = dy / distance;
    
    // Appliquer le mouvement en fonction de la direction et de la vitesse
    player.x += directionX * player.speed;
    player.y += directionY * player.speed;
  }
}