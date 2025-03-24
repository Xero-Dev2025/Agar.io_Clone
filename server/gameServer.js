import { GAME_CONFIG } from './utils/config.js';
import GameMap from './GameMap.js';
import FoodService from './services/foodService.js';
import PlayerService from './services/playerService.js';
import AnimationService from './services/animationService.js';
import CollisionService from './services/collisionsService.js';
import BotService from './services/botService.js';

export function createGameServer(players = {}, foodItems = [], gameMap) {
  const animationService = new AnimationService();
  const foodService = new FoodService(GAME_CONFIG);
  const playerService = new PlayerService(GAME_CONFIG);
  const collisionService = new CollisionService(GAME_CONFIG, animationService);
  const botService = new BotService(GAME_CONFIG, playerService);

  const consumingAnimations = [];
  const ejectedMasses = [];
  
  return {
    initializeFood(width, height) {
      foodService.initializeFood(foodItems, width, height);
    },

    initalizeGameMap(width, height) {
      gameMap = new GameMap(width, height);
    },
    
    spawnFood(count, width, height) {
      return foodService.spawnFood(foodItems, count, width, height);
    },
    
    handleConnection(socket) {
      playerService.handleConnection(players, socket, gameMap);
    },
    
    handlePlayerMove(socketId, position) {
      playerService.handlePlayerMove(players, socketId, position, gameMap);
    },
    
    handlePlayerSplit(socketId) {
      return playerService.handlePlayerSplit(players, socketId);
    },
    
    handleDisconnect(socketId) {
      playerService.handleDisconnect(players, socketId);
      
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
      return collisionService.detectFoodCollisions(players, playerId, foodItems);
    },
    
    handleFoodCollision(playerId, food) {
      collisionService.handleFoodCollision(players, playerId, food, consumingAnimations);
    },
    
    detectPlayerCollisions(playerId) {
      return collisionService.detectPlayerCollisions(players, playerId);
    },
    
    handlePlayerCollision(playerId, otherPlayer) {
      const result = collisionService.handlePlayerCollision(players, playerId, otherPlayer, consumingAnimations);
      if (result && players[otherPlayer]?.isBot && !players[otherPlayer]) {
        setTimeout(() => this.respawnBot(), 5000);
      }
    
      return result;
    },
    
    updateAnimations() {
      return animationService.updateAnimations(consumingAnimations, players, foodItems);
    },
    
    getAnimations() {
      return consumingAnimations;
    },
    
    updateAllPlayerStats() {
      playerService.updateAllPlayerStats(players);
    },
    initializeBots(count = 5) {
      return botService.initializeBots(players, foodItems, gameMap, count);
    },
    
    updateBots() {
      botService.updateBots(players, foodItems, gameMap);
    },
    
    respawnBot() {
      botService.respawnBot(players, gameMap);
    },
    getBotIds() {
      return botService.botIds;
    },
  
    updateSpecificBots(botIds) {
      botService.updateSpecificBots(botIds, players, foodItems, gameMap);
      
      botIds.forEach(botId => {
        if (players[botId]) {
          const collidedFood = collisionService.detectFoodCollisions(players, botId, foodItems);
          if (collidedFood.length > 0) {
            collidedFood.forEach(food => {
              collisionService.handleFoodCollision(players, botId, food, consumingAnimations);
            });
          }
          
          const collidingPlayers = collisionService.detectPlayerCollisions(players, botId);
          if (collidingPlayers.length > 0) {
            collidingPlayers.forEach(otherPlayer => {
              const result = collisionService.handlePlayerCollision(players, botId, otherPlayer.id, consumingAnimations);
              
              if (result && !players[botId]) {
                setTimeout(() => this.respawnBot(), 5000);
              }
            });
          }
          
          const collidedMasses = this.detectEjectedMassCollisions(botId);
          if (collidedMasses.length > 0) {
            collidedMasses.forEach(mass => {
              this.handleEjectedMassCollision(botId, mass.id);
            });
          }
        }
      });
    },

    handlePlayerEjectMass(socketId) {
      return playerService.handlePlayerEjectMass(players, socketId, ejectedMasses);
    },

    updateEjectedMasses() {
      const now = Date.now();
      
      for (let i = ejectedMasses.length - 1; i >= 0; i--) {
        const mass = ejectedMasses[i];
        
        mass.velocityX *= GAME_CONFIG.EJECT_MASS.FRICTION || 0.975;
        mass.velocityY *= GAME_CONFIG.EJECT_MASS.FRICTION || 0.975;
        
        mass.x += mass.velocityX;
        mass.y += mass.velocityY;
        
        if (mass.x - mass.radius < 0) {
          mass.x = mass.radius;
          mass.velocityX *= -0.5;
        }
        if (mass.x + mass.radius > gameMap.width) {
          mass.x = gameMap.width - mass.radius;
          mass.velocityX *= -0.5;
        }
        if (mass.y - mass.radius < 0) {
          mass.y = mass.radius;
          mass.velocityY *= -0.5;
        }
        if (mass.y + mass.radius > gameMap.height) {
          mass.y = gameMap.height - mass.radius;
          mass.velocityY *= -0.5;
        }
        
        if (now - mass.createdAt > 30000) {
          ejectedMasses.splice(i, 1);
        }
      }
    },

    detectEjectedMassCollisions(playerId) {
      if (!players[playerId]) return [];
      
      const player = players[playerId];
      const collided = [];
      
      for (let i = ejectedMasses.length - 1; i >= 0; i--) {
        const mass = ejectedMasses[i];
        
        if (mass.playerId === playerId) {
          const now = Date.now();
          const massAge = now - (mass.createdAt || 0);
          
          if (massAge < 3000) {
            continue;
          }
        }
        
        for (let j = 0; j < player.cells.length; j++) {
          const cell = player.cells[j];
          
          if (cell.radius < mass.radius) continue;
          
          const dx = cell.x - mass.x;
          const dy = cell.y - mass.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < cell.radius) {
            collided.push(mass);
            break;
          }
        }
      }
      
      return collided;
    },

    handleEjectedMassCollision(playerId, massId) {
      if (!players[playerId]) return false;
      
      const massIndex = ejectedMasses.findIndex(m => m.id === massId);
      if (massIndex === -1) return false;
      
      const mass = ejectedMasses[massIndex];
      const player = players[playerId];
      
      let collidingCell = null;
      for (const cell of player.cells) {
        const dx = cell.x - mass.x;
        const dy = cell.y - mass.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < cell.radius) {
          collidingCell = cell;
          break;
        }
      }
      
      if (collidingCell) {
        const MASS_VALUE_REDUCTION = 0.85;
        
        const massArea = mass.originalArea 
            ? mass.originalArea * MASS_VALUE_REDUCTION 
            : Math.PI * mass.radius * mass.radius * MASS_VALUE_REDUCTION;
            
        const cellArea = Math.PI * collidingCell.radius * collidingCell.radius;
        const newArea = cellArea + massArea;
        
        collidingCell.radius = Math.sqrt(newArea / Math.PI);
        
        ejectedMasses.splice(massIndex, 1);
        
        player.updateMainRadius();
        player.updateScore();
        
        return true;
      }
      
      return false;
    },

    getEjectedMasses() {
      return ejectedMasses;
    },
  };
}