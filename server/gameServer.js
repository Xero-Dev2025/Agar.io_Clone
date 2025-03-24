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
        }
      });
    }
  };
}