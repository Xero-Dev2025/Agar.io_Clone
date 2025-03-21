import { GAME_CONFIG } from '../../server/utils/config.js';
import { worldToScreenCoordinates } from './coordinatesConverter.js';

export function drawGame(ctx, player, foodItems, allPlayers, socketId, animations = [], gameMap, mouse) {
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

  drawMapBorders(ctx, player, gameMap);

  drawGrid(ctx, player, gameMap);

  drawFoodItems(ctx, foodItems);
  
  drawConsumingAnimations(ctx, animations, foodItems);
  
  drawMainPlayer(ctx, player);
  
  drawOtherPlayers(ctx, allPlayers, socketId);
  
  // Restauration de l'état du contexte
  ctx.restore();
  
  // Dessiner la minimap
  drawMinimap(ctx, player);

  drawHUD(ctx, player);

  //drawMouseTracker(ctx, player, mouse);
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

function drawMainPlayer(ctx, player, mouse) {
  const screenPos = worldToScreenCoordinates(player.x, player.y);

  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();
  
  // Dessiner le nom du joueur
  drawPlayerName(ctx, player);
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
        
        // Dessiner le nom du joueur
        drawPlayerName(ctx, otherPlayer);
      }
    }
  });
}

/**
 * Dessine le nom d'un joueur sur son avatar
 * @param {CanvasRenderingContext2D} ctx - Le contexte 2D du canvas
 * @param {Object} player - Le joueur à dessiner
 */
function drawPlayerName(ctx, player) {
  if (!player.username) return;
  
  // Calculer la taille de police adaptée au rayon (min 12px, max 20px)
  const fontSize = Math.max(12, Math.min(20, player.radius / 3));

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  
  ctx.fillText(player.username, player.x, player.y);
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

function drawHUD(ctx, player) {
  if (!player) return;
  
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Position: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, 20);
  ctx.fillText(`Taille: ${Math.round(player.size)}`, 10, 40);
}

// Dessiner la grille de fond
function drawGrid(ctx, player, gameMap) {
  const gridSize = 50;
  if (!player) return;
  
  // Calculer les coordonnées de début et fin de la grille
  const startX = Math.floor(0 / gridSize) * gridSize;
  const startY = Math.floor(0 / gridSize) * gridSize;
  const endX = Math.ceil(gameMap.width / gridSize) * gridSize;
  const endY = Math.ceil(gameMap.height / gridSize) * gridSize;
  
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  
  // Dessiner les lignes verticales
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  
  // Dessiner les lignes horizontales
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
}

// Dessiner les limites de la map
function drawMapBorders(ctx, player, gameMap) {
  if (!player) return;

  ctx.save();
  const gridSize = 50; // Utiliser la même taille que la grille
  const startX = Math.floor(0 / gridSize) * gridSize;
  const startY = Math.floor(0 / gridSize) * gridSize;

  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 5;
  ctx.strokeRect(startX, startY, gameMap.width, gameMap.height);
  ctx.restore();
}

function drawMouseTracker(ctx, player, mouse){
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
}
