import { GAME_CONFIG } from '../../server/utils/config.js';
import { worldToScreenCoordinates } from './coordinatesConverter.js';

export function drawGame(ctx, player, foodItems, allPlayers, socketId, animations = [], gameMap, mouse, ejectedMasses = []) {
  const canvas = ctx.canvas;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  
  const baseRadius = 30; 
  const maxZoom = 1;  
  const minZoom = 0.22;   
  
  let scale = Math.max(minZoom, maxZoom - (player.radius - baseRadius) / 300);
  
  const cameraX = canvas.width / 2 - player.x * scale;
  const cameraY = canvas.height / 2 - player.y * scale;
  
  ctx.translate(cameraX, cameraY);
  ctx.scale(scale, scale);

  drawMapBorders(ctx, player, gameMap);

  drawGrid(ctx, player, gameMap);

  drawFoodItems(ctx, foodItems);

  if (ejectedMasses && Array.isArray(ejectedMasses) && ejectedMasses.length > 0) {
    ejectedMasses.forEach(mass => {
      if (mass && typeof mass.x === 'number' && typeof mass.y === 'number') {
        ctx.beginPath();
        ctx.arc(mass.x, mass.y, mass.radius, 0, Math.PI * 2);
        ctx.fillStyle = mass.color || '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }
    });
  }
  
  drawConsumingAnimations(ctx, animations, foodItems);
  
  drawMainPlayer(ctx, player);
  
  drawOtherPlayers(ctx, allPlayers, socketId);
  
  ctx.restore();
  
  drawMinimap(ctx, player);

  drawHUD(ctx, player);
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
  
  if (player.cells && player.cells.length > 0) {
    player.cells.forEach(cell => {
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color || '#FF0000'; 
      ctx.fill();
      ctx.closePath();
      
      if (player.avatar && player.avatar !== 'default') {
        const avatarImg = loadAvatar(player.avatar);
        if (avatarImg.complete) {
          drawCircularAvatar(ctx, avatarImg, cell.x, cell.y, cell.radius * 0.8);
        }
      }
    });
    
    if (player.username && player.cells.length > 0) {
      const fontSize = Math.max(12, Math.min(20, player.radius / 3));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFFFFF";
      
      player.cells.forEach(cell => {
        ctx.fillText(player.username, cell.x, cell.y);
      });
    }
  } else {
    const screenPos = worldToScreenCoordinates(player.x, player.y);
    
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color || '#FF0000';
    ctx.fill();
    ctx.closePath();
    
    if (player.avatar && player.avatar !== 'default') {
      const avatarImg = loadAvatar(player.avatar);
      if (avatarImg.complete) {
        drawCircularAvatar(ctx, avatarImg, screenPos.x, screenPos.y, player.radius * 0.8);
      }
    }
    
    drawPlayerName(ctx, player);
  }
}

function drawOtherPlayers(ctx, allPlayers, socketId) {
  Object.keys(allPlayers).forEach(id => {
    if (id !== socketId) {
      const otherPlayer = allPlayers[id];
      
      if (otherPlayer) {
        
        if (otherPlayer.cells && otherPlayer.cells.length > 0) {
          otherPlayer.cells.forEach(cell => {
            ctx.beginPath();
            ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
            ctx.fillStyle = otherPlayer.color || '#0000FF'; 
            ctx.fill();
            ctx.closePath();
            
            if (otherPlayer.avatar && otherPlayer.avatar !== 'default') {
              const avatarImg = loadAvatar(otherPlayer.avatar);
              if (avatarImg.complete) {
                drawCircularAvatar(ctx, avatarImg, cell.x, cell.y, cell.radius * 0.8);
              }
            }
          });
          
          if (otherPlayer.username && otherPlayer.cells.length > 0) {
            const fontSize = Math.max(12, Math.min(20, otherPlayer.radius / 3));
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#FFFFFF";
            
            otherPlayer.cells.forEach(cell => {
              ctx.fillText(otherPlayer.username, cell.x, cell.y);
            });
          }
        } else {
          ctx.beginPath();
          ctx.arc(otherPlayer.x, otherPlayer.y, otherPlayer.radius || 30, 0, Math.PI * 2);
          ctx.fillStyle = otherPlayer.color || '#0000FF';
          ctx.fill();
          ctx.closePath();
          
          if (otherPlayer.avatar && otherPlayer.avatar !== 'default') {
            const avatarImg = loadAvatar(otherPlayer.avatar);
            if (avatarImg.complete) {
              drawCircularAvatar(ctx, avatarImg, otherPlayer.x, otherPlayer.y, (otherPlayer.radius || 30) * 0.8);
            }
          }
          
          drawPlayerName(ctx, otherPlayer);
        }
      }
    }
  });
}

const avatarCache = {};

function loadAvatar(avatarName) {
  if (!avatarCache[avatarName]) {
    const img = new Image();
    if (avatarName === 'cool') {
      img.src = './images/avatars/cool.png'; 
    } else if (avatarName === 'ninja') {
      img.src = './images/avatars/ninja.png';
    } else {
      img.src = '/images/avatars/default.png';
    }
    avatarCache[avatarName] = img;
    
    img.onload = () => {
    };
    
    img.onerror = () => {
      console.error(`Failed to load avatar ${avatarName}`);
    };
  }
  return avatarCache[avatarName];
}

function drawCircularAvatar(ctx, img, x, y, radius) {
  if (!img.complete) return; 
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  
  ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
  
  ctx.restore();
}

function drawPlayerName(ctx, player) {
  if (!player.username) return;
  
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
  const minimapSize = Math.min(200, canvas.width * 0.2);
  const margin = 10;
  const minimapX = canvas.width - minimapSize - margin;
  const minimapY = canvas.height - minimapSize - margin;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
  
  const scaleX = minimapSize / GAME_CONFIG.WIDTH;
  const scaleY = minimapSize / GAME_CONFIG.HEIGHT;  
  
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
  ctx.fillText(`Score: ${player.stats?.score || 0}`, 10, 40);
}

function drawGrid(ctx, player, gameMap) {
  const gridSize = 50;
  if (!player) return;
  
  const startX = Math.floor(0 / gridSize) * gridSize;
  const startY = Math.floor(0 / gridSize) * gridSize;
  const endX = Math.ceil(gameMap.width / gridSize) * gridSize;
  const endY = Math.ceil(gameMap.height / gridSize) * gridSize;
  
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
}

function drawMapBorders(ctx, player, gameMap) {
  if (!player) return;

  ctx.save();
  const gridSize = 50;
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
