import { GAME_CONFIG } from './utils/config.js';
import GameMap from './GameMap.js';
import FoodService from './services/foodService.js';
import PlayerService from './services/playerService.js';
import AnimationService from './services/animationService.js';
import CollisionService from './services/collisionsService.js';

export function createGameServer(players = {}, foodItems = [], gameMap) {
  const animationService = new AnimationService();
  const foodService = new FoodService(GAME_CONFIG);
  const playerService = new PlayerService(GAME_CONFIG);
  const collisionService = new CollisionService(GAME_CONFIG, animationService);
  
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
      return collisionService.handlePlayerCollision(players, playerId, otherPlayer, consumingAnimations);
    },
    

    updateAnimations() {
      return animationService.updateAnimations(consumingAnimations, players, foodItems);
    },
    
    getAnimations() {
      return consumingAnimations;
    },
    
    updateAllPlayerStats() {
      playerService.updateAllPlayerStats(players);
    }
  };
}