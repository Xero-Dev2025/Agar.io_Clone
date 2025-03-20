import { GAME_CONFIG } from '../../server/utils/config.js';

export function drawGame(ctx, player, foodItems, allPlayers, socketId, animations = []) {
  const canvas = ctx.canvas;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Sauvegarde l'état du contexte
  ctx.save();
  
  // Calcul du facteur de zoom en fonction du rayon du joueur
  const baseRadius = 30; // Rayon initial du joueur
  const maxZoom = 1;   // Zoom maximum (pas de recul)
  const minZoom = 0.22;   // Zoom minimum (recul maximum)
  
  // Plus le joueur est gros, plus la caméra recule (zoom diminue)
  let scale = Math.max(minZoom, maxZoom - (player.radius - baseRadius) / 300);
  
  // Calcul du offset pour centrer le joueur avec prise en compte du zoom
  const cameraX = canvas.width / 2 - player.x * scale;
  const cameraY = canvas.height / 2 - player.y * scale;
  
  // Application de la translation et du zoom pour tout ce qui sera dessiné
  ctx.translate(cameraX, cameraY);
  ctx.scale(scale, scale);
  
  drawFoodItems(ctx, foodItems);
  
  drawConsumingAnimations(ctx, animations, foodItems);
  
  drawMainPlayer(ctx, player);
  
  drawOtherPlayers(ctx, allPlayers, socketId);
  
  // Restauration de l'état du contexte
  ctx.restore();
  
  // Dessiner la minimap
  drawMinimap(ctx, player);
}

function drawFoodItems(ctx, foodItems) {
  if (foodItems.length > 0) {
    foodItems.forEach((food, index) => {
      if (food && typeof food.x === 'number' && typeof food.y === 'number' && !food.isBeingConsumed) {
        try {
          ctx.beginPath();
          ctx.arc(food.x, food.y, food.radius || 10, 0, Math.PI * 2);
          ctx.fillStyle = food.color || '#8BC34A';
          ctx.fill();
          ctx.closePath();
        } catch (e) {
          console.error(`Erreur lors du dessin de la boule ${index}:`, e, food);
        }
      }
    });
  }
}

function drawMainPlayer(ctx, player) {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();
}

function drawOtherPlayers(ctx, allPlayers, socketId) {
  Object.keys(allPlayers).forEach(id => {
    if (id !== socketId) {
      const otherPlayer = allPlayers[id];
      if (otherPlayer) {
        ctx.beginPath();
        ctx.arc(otherPlayer.x, otherPlayer.y, otherPlayer.radius || 30, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
      }
    }
  });
}

function drawConsumingAnimations(ctx, animations, foodItems) {
  if (!animations || !Array.isArray(animations)) return;
  
  animations.forEach(animation => {
    const food = foodItems.find(f => f.id === animation.foodId);
    if (food) {
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.radius || 10, 0, Math.PI * 2);
      ctx.fillStyle = food.color || '#8BC34A';
      ctx.fill();
      ctx.closePath();
      
      ctx.beginPath();
      ctx.arc(food.x, food.y, (food.radius || 10) * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
      ctx.closePath();
    }
  });
}

function drawMinimap(ctx, player) {
  const canvas = ctx.canvas;
  const minimapSize = Math.min(200, canvas.width * 0.2); // Taille minimap
  const margin = 10;
  const minimapX = canvas.width - minimapSize - margin;
  const minimapY = canvas.height - minimapSize - margin;
  
  // Fond minimap
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
  
  // Bordure minimap
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
  
  // Mettre à l'échelle la taille du monde pour la minimap
  const scaleX = minimapSize / GAME_CONFIG.WIDTH;
  const scaleY = minimapSize / GAME_CONFIG.HEIGHT;  
  
  // Dessiner joueur local
  ctx.fillStyle = player.color;
  const playerSize = Math.max(4, player.radius * scaleX * 0.2);
  ctx.fillRect(
    minimapX + player.x * scaleX - playerSize/2,
    minimapY + player.y * scaleY - playerSize/2,
    playerSize,
    playerSize
  );
}