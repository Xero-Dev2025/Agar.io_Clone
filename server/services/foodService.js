import { generateFoodItems } from '../models/food.js';

export default class FoodService {
  constructor(gameConfig) {
    this.gameConfig = gameConfig;
  }

  initializeFood(foodItems, width, height) {
    const newFood = generateFoodItems(this.gameConfig.FOOD.INITIAL_COUNT, width, height);
    foodItems.push(...newFood);
  }

  spawnFood(foodItems, count, width, height) {
    const newFood = generateFoodItems(count, width, height);
    foodItems.push(...newFood);
    return newFood.length;
  }

  removeFood(foodItems, foodId) {
    const foodIndex = foodItems.findIndex(f => f.id === foodId);
    if (foodIndex !== -1) {
      foodItems.splice(foodIndex, 1);
      return true;
    }
    return false;
  }
}