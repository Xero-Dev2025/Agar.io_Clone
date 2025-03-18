import { generateFoodItems } from './models/food.js';

export function createGameServer(players = {}, foodItems = []) {
  const INITIAL_FOOD_COUNT = 100;
  const PLAYER_GROWTH_FACTOR = 1.05;
  
  return {
    initializeFood(width, height) {
      const newFood = generateFoodItems(INITIAL_FOOD_COUNT, width, height);
      foodItems.push(...newFood);
    },
    
    spawnFood(count, width, height) {
      const newFood = generateFoodItems(count, width, height);
      foodItems.push(...newFood);
      return newFood.length;
    },
    
    handleConnection(socket) {
      players[socket.id] = { 
        x: 0, 
        y: 0, 
        radius: 30 
      };
    },
    
    handlePlayerMove(socketId, position) {
      if (players[socketId]) {
        players[socketId].x = position.x;
        players[socketId].y = position.y;
      }
    },
    
    handleDisconnect(socketId) {
      delete players[socketId];
    },
    
    detectFoodCollisions(playerId) {
      if (!players[playerId]) return [];
      
      const player = players[playerId];
      return foodItems.filter(food => {
        const dx = player.x - food.x;
        const dy = player.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < player.radius + (food.radius || 10);
      });
    },
    
    handleFoodCollision(playerId, food) {
      if (!players[playerId]) return;
      
      players[playerId].radius *= PLAYER_GROWTH_FACTOR;
      
      const index = foodItems.findIndex(f => f.id === food.id);
      if (index !== -1) {
        foodItems.splice(index, 1);
      }
    }
  };
}