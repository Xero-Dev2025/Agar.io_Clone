import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createFood, generateFoodItems } from '../models/food.js';

describe('Food Management', () => {
    it('should create a food ball with required properties', () => {
        const food = createFood(1, 100, 200);
        
        assert.equal(typeof food.id, 'number', 'Food must have an ID');
        assert.equal(food.x, 100, 'Food must have the requested X position');
        assert.equal(food.y, 200, 'Food must have the requested Y position');
        assert.equal(typeof food.radius, 'number', 'Food must have a radius');
        assert.ok(food.radius > 0, 'Radius must be positive');
        assert.equal(typeof food.color, 'string', 'Food must have a color');
    });
    
    it('should generate multiple food balls within specified limits', () => {
        const maxWidth = 800;
        const maxHeight = 600;
        const count = 10;
        
        const foodItems = generateFoodItems(count, maxWidth, maxHeight);
        
        assert.equal(foodItems.length, count, `Should generate ${count} food balls`);
        
        foodItems.forEach(food => {
            assert.ok(food.x >= 0 && food.x <= maxWidth, 'X position must be within limits');
            assert.ok(food.y >= 0 && food.y <= maxHeight, 'Y position must be within limits');
            assert.ok(food.id !== undefined, 'Each ball must have a unique ID');
        });
        
        // Check that all IDs are unique
        const ids = foodItems.map(food => food.id);
        const uniqueIds = new Set(ids);
        assert.equal(uniqueIds.size, count, 'All IDs must be unique');
    });
});