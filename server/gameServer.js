import { generateFoodItems } from './models/food.js';
import { createPlayer, updatePlayerPosition, growPlayer } from './models/player.js';
import { GAME_CONFIG } from './utils/config.js';

export function createGameServer(players = {}, foodItems = []) {
  const OVERLAP_THRESHOLD = 0.7; 
  
  const consumingAnimations = [];
  
  return {
    initializeFood(width, height) {
      const newFood = generateFoodItems(GAME_CONFIG.FOOD.INITIAL_COUNT, width, height);
      foodItems.push(...newFood);
    },
    
    spawnFood(count, width, height) {
      const newFood = generateFoodItems(count, width, height);
      foodItems.push(...newFood);
      return newFood.length;
    },
    
    handleConnection(socket) {
      players[socket.id] = createPlayer(socket.id);
    },
    
    handlePlayerMove(socketId, position) {
      if (players[socketId]) {
        updatePlayerPosition(players[socketId], position.x, position.y);
      }
    },
    
    handleDisconnect(socketId) {
      delete players[socketId];
      
      const animationsToRemove = consumingAnimations.filter(anim => anim.playerId === socketId);
      animationsToRemove.forEach(anim => {
        const index = consumingAnimations.findIndex(a => a.foodId === anim.foodId);
        if (index !== -1) {
          consumingAnimations.splice(index, 1);
        }
        
        const food = foodItems.find(f => f.id === anim.foodId);
        if (food) {
          food.isBeingConsumed = false;
          food.consumingPlayerId = null;
        }
      });
    },
    
    detectFoodCollisions(playerId) {
      if (!players[playerId]) return [];
      
      const player = players[playerId];
      
      const availableFoodItems = foodItems.filter(food => !food.isBeingConsumed);
      
      return availableFoodItems.filter(food => {
        const dx = player.x - food.x;
        const dy = player.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let overlapPercentage = 0;
        
        if (distance < player.radius + food.radius) {  
          if (distance <= player.radius - food.radius) {
            overlapPercentage = 1;
          } else {
            const foodArea = Math.PI * food.radius * food.radius;
            const playerRadius = player.radius;
            const foodRadius = food.radius;
            
            const d = distance;
            
            if (d >= playerRadius + foodRadius) {
              overlapPercentage = 0;
            } 
            else if (d <= Math.abs(playerRadius - foodRadius)) {
              overlapPercentage = playerRadius >= foodRadius ? 1 : 0;
            } 
            else {
              const a = (playerRadius * playerRadius - foodRadius * foodRadius + d * d) / (2 * d);
              const h = Math.sqrt(playerRadius * playerRadius - a * a);
              
              const playerSegment = playerRadius * playerRadius * 
                                    Math.acos(a / playerRadius) - 
                                    a * h;
              
              const foodSegment = foodRadius * foodRadius * 
                                 Math.acos((d - a) / foodRadius) - 
                                 (d - a) * h;
              
              const intersectionArea = playerSegment + foodSegment;
              
              overlapPercentage = intersectionArea / foodArea;
            }
          }
        }
        
        return overlapPercentage >= OVERLAP_THRESHOLD;
      });
    },
    
    handleFoodCollision(playerId, food) {
      if (!players[playerId]) return;
      const player = players[playerId];
      
      food.isBeingConsumed = true;
      food.consumingPlayerId = playerId;
      
      const animation = {
        id: Date.now() + Math.random().toString(36).substr(2, 5), 
        foodId: food.id,
        playerId: playerId,
        startTime: Date.now(),
        duration: GAME_CONFIG.ANIMATION.CONSUME_DURATION || 300, 
        startPosition: { x: food.x, y: food.y },
        targetPosition: { x: player.x, y: player.y },
        initialFoodRadius: food.radius,
        initialPlayerRadius: player.radius,
        targetPlayerRadius: player.radius * GAME_CONFIG.PLAYER.GROWTH_FACTOR,
        completed: false
      };
      
      consumingAnimations.push(animation);
    },
    
    updateAnimations() {
      const now = Date.now();
      const completedAnimations = [];
      
      consumingAnimations.forEach(animation => {
        const elapsed = now - animation.startTime;
        const progress = Math.min(1, elapsed / animation.duration);
        
        if (progress < 1) {
          const food = foodItems.find(f => f.id === animation.foodId);
          const player = players[animation.playerId];
          
          if (food && player) {
            food.x = animation.startPosition.x + (player.x - animation.startPosition.x) * progress;
            food.y = animation.startPosition.y + (player.y - animation.startPosition.y) * progress;
            
            food.radius = animation.initialFoodRadius * (1 - progress);
            
            player.radius = animation.initialPlayerRadius + 
                           (animation.targetPlayerRadius - animation.initialPlayerRadius) * progress;
          }
        } else {
          animation.completed = true;
          completedAnimations.push(animation);
          
          const player = players[animation.playerId];
          if (player) {
            player.radius = animation.targetPlayerRadius;
          }
        }
      });
      
      completedAnimations.forEach(animation => {
        const animIndex = consumingAnimations.findIndex(a => a.id === animation.id);
        if (animIndex !== -1) {
          consumingAnimations.splice(animIndex, 1);
        }
        
        const foodIndex = foodItems.findIndex(f => f.id === animation.foodId);
        if (foodIndex !== -1) {
          foodItems.splice(foodIndex, 1);
        }
      });
      
      return {
        players,
        foodItems,
        animations: consumingAnimations
      };
    },
    
    getAnimations() {
      return consumingAnimations;
    }
  };
}