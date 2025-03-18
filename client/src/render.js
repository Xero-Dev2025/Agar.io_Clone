export function drawGame(ctx, player, foodItems, allPlayers, socketId, animations = []) {
  const canvas = ctx.canvas;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  drawFoodItems(ctx, foodItems);
  
  drawConsumingAnimations(ctx, animations, foodItems);
  
  drawMainPlayer(ctx, player);
  
  drawOtherPlayers(ctx, allPlayers, socketId);
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