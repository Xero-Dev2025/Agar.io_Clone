import { v4 as uuid } from 'uuid';
import { getRandomColor } from '../utils/colors.js';
import { GAME_CONFIG } from '../utils/config.js';

export function createFood(id, x, y) {
  return {
    id,
    x,
    y,
    radius: GAME_CONFIG.FOOD.RADIUS,
    color: getRandomColor()
  };
}

function generateRandomPosition(width, height) {
    const margin = GAME_CONFIG.FOOD.RADIUS * 2; // Marge de sécurité
    return {
        x: margin + Math.random() * (width - margin * 2),
        y: margin + Math.random() * (height - margin * 2)
    };
}

export function generateFoodItems(count, width, height) {
    const items = [];
    for (let i = 0; i < count; i++) {
        const position = generateRandomPosition(width, height);
        items.push({
            id: uuid(),
            x: position.x,
            y: position.y,
            radius: GAME_CONFIG.FOOD.RADIUS,
            color: getRandomColor()
        });
    }
    return items;
}