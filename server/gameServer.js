import { generateFoodItems } from './models/food.js';
import GameMap from './GameMap.js';
import { GAME_CONFIG } from './utils/config.js';
import Player from './Player.js';

export function createGameServer(players = {}, foodItems = [], gameMap) {
  const OVERLAP_THRESHOLD = 0.7; 
  
  const consumingAnimations = [];
  
  return {
    initializeFood(width, height) {
      const newFood = generateFoodItems(GAME_CONFIG.FOOD.INITIAL_COUNT, width, height);
      foodItems.push(...newFood);
    },

    initalizeGameMap(width, height) {
      gameMap = new GameMap(width, height);
    },
    
    spawnFood(count, width, height) {
      const newFood = generateFoodItems(count, width, height);
      foodItems.push(...newFood);
      return newFood.length;
    },
    
    handleConnection(socket) {
      players[socket.id] = new Player(socket.id, 0, 0, GAME_CONFIG.PLAYER.INITIAL_RADIUS, 'red', 5);
    },
    
    handlePlayerMove(socketId, position) {
      const player = players[socketId];

      if (player) {
        player.moveTowards(position.x, position.y);

        // Vérifier les collisions avec les bords de la carte
        if (player.x - player.radius < 0) player.x = player.radius;
        if (player.x + player.radius >= gameMap.width) player.x = gameMap.width - player.radius;
        if (player.y - player.radius < 0) player.y = player.radius;
        if (player.y + player.radius > gameMap.height) player.y = gameMap.height - player.radius;
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

    detectPlayerCollisions(playerId) {
      if (!players[playerId]) return [];
      
      const player = players[playerId];
      
      return Object.values(players).filter(p => p.id !== playerId).filter(p => {
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < player.radius + p.radius;
      });
    },

    handlePlayerCollision(playerId, otherPlayer) {
      if (!players[playerId] || !players[otherPlayer.id]) return;
      
      const player = players[playerId];
      const other = players[otherPlayer.id];
    
      const dx = player.x - other.x;
      const dy = player.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const playerIsLarger = player.radius / other.radius >= 1.3;
      const otherIsLarger = other.radius / player.radius >= 1.3;
      
      if (!playerIsLarger && !otherIsLarger) {
        return { player, other, action: 'pass' };
      }
      
      let overlapPercentage = 0;
      let smallerPlayer, largerPlayer;
      
      if (playerIsLarger) {
        largerPlayer = player;
        smallerPlayer = other;
      } else {
        largerPlayer = other;
        smallerPlayer = player;
      }
      
      const smallerArea = Math.PI * smallerPlayer.radius * smallerPlayer.radius;
      
      if (distance < largerPlayer.radius + smallerPlayer.radius) {
        if (distance <= largerPlayer.radius - smallerPlayer.radius) {
          overlapPercentage = 1;
        } else {
          const d = distance;
          const r = largerPlayer.radius;
          const s = smallerPlayer.radius;
          
          if (d >= r + s) {
            overlapPercentage = 0;
          } 
          else if (d <= Math.abs(r - s)) {
            overlapPercentage = r >= s ? 1 : 0;
          } 
          else {
            const a = (r * r - s * s + d * d) / (2 * d);
            const h = Math.sqrt(r * r - a * a);
            
            const largerSegment = r * r * Math.acos(a / r) - a * h;
            const smallerSegment = s * s * Math.acos((d - a) / s) - (d - a) * h;
            
            const intersectionArea = largerSegment + smallerSegment;
            overlapPercentage = intersectionArea / smallerArea;
          }
        }
      }
      
      const PLAYER_OVERLAP_THRESHOLD = 0.65;
      
      if (playerIsLarger && overlapPercentage >= PLAYER_OVERLAP_THRESHOLD) {
        const playerArea = Math.PI * player.radius * player.radius;
        const otherArea = Math.PI * other.radius * other.radius;
        const newRadius = Math.sqrt((playerArea + otherArea) / Math.PI);
        
        player.radius = newRadius;
        
        const animation = {
          id: Date.now() + Math.random().toString(36).substr(2, 5),
          playerId: player.id,
          eatenPlayerId: other.id,
          startTime: Date.now(),
          duration: GAME_CONFIG.ANIMATION.CONSUME_DURATION || 300,
          startPosition: { x: other.x, y: other.y },
          targetPosition: { x: player.x, y: player.y },
          initialEatenRadius: other.radius,
          completed: false
        };
        
        consumingAnimations.push(animation);
        delete players[other.id];
        
        return { predator: player, prey: other, action: 'consume' };
      }
      else if (otherIsLarger && overlapPercentage >= PLAYER_OVERLAP_THRESHOLD) {
        const playerArea = Math.PI * player.radius * player.radius;
        const otherArea = Math.PI * other.radius * other.radius;
        const newRadius = Math.sqrt((playerArea + otherArea) / Math.PI);
        
        other.radius = newRadius;
        
        const animation = {
          id: Date.now() + Math.random().toString(36).substr(2, 5),
          playerId: other.id,
          eatenPlayerId: player.id,
          startTime: Date.now(),
          duration: GAME_CONFIG.ANIMATION.CONSUME_DURATION || 300,
          startPosition: { x: player.x, y: player.y },
          targetPosition: { x: other.x, y: other.y },
          initialEatenRadius: player.radius,
          completed: false
        };
        
        consumingAnimations.push(animation);
        delete players[player.id];
        
        return { predator: other, prey: player, action: 'consume' };
      }
      else {
        return { player, other, action: 'pass' };
      }
    },
    
    updateAnimations() {
      const now = Date.now();
      const completedAnimations = [];
      
      consumingAnimations.forEach(animation => {
        const elapsed = now - animation.startTime;
        const progress = Math.min(1, elapsed / animation.duration);
        
        if (animation.eatenPlayerId) {
          const predator = players[animation.playerId];
          
          if (predator) {
            if (progress < 1) {

            } else {
              animation.completed = true;
              completedAnimations.push(animation);
            }
          } else {
            animation.completed = true;
            completedAnimations.push(animation);
          }
          return;
        }
    
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
          if (player && animation.foodId) {  
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