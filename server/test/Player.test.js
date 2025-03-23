import assert from 'node:assert/strict';
import { describe, beforeEach, it} from 'node:test';
import Player from '../models/player.js'; 

describe('Player class', () => {
  describe('moveTowards method', () => {
    let player;
    
    beforeEach(() => {
      player = new Player('test-id', 0, 0, 30, 'red', 5);
    });
    
    it('should move towards the target when far away', () => {
      const targetX = 10;
      const targetY = 10;
      player.moveTowards(targetX, targetY);
      
      assert(player.x > 0, 'x should have increased');
      assert(player.y > 0, 'y should have increased');
      
      const expectedX = 3.5355;
      const expectedY = 3.5355;
      const tolerance = 0.0001;
      
      assert(Math.abs(player.x - expectedX) < tolerance, `x should be close to ${expectedX}`);
      assert(Math.abs(player.y - expectedY) < tolerance, `y should be close to ${expectedY}`);
    });
    
    it('should reach the target when close enough', () => {
      const targetX = 3;
      const targetY = 4;
      player.moveTowards(targetX, targetY);
      assert.strictEqual(player.x, targetX, 'x should equal targetX');
      assert.strictEqual(player.y, targetY, 'y should equal targetY');
    });
    
    it('should not move if already at the target', () => {
      const targetX = 0;
      const targetY = 0;
      player.moveTowards(targetX, targetY);
      assert.strictEqual(player.x, targetX, 'x should remain at 0');
      assert.strictEqual(player.y, targetY, 'y should remain at 0');
    });
    
    it('should move correctly along the X axis', () => {
      const targetX = 10;
      const targetY = 0;
      player.moveTowards(targetX, targetY);
      assert.strictEqual(player.x, player.speed, 'x should equal speed');
      assert.strictEqual(player.y, 0, 'y should remain at 0');
    });
    
    it('should move correctly along the Y axis', () => {
      const targetX = 0;
      const targetY = 10;
      player.moveTowards(targetX, targetY);
      assert.strictEqual(player.x, 0, 'x should remain at 0');
      assert.strictEqual(player.y, player.speed, 'y should equal speed');
    });
    
    it('should handle negative coordinates', () => {
      const targetX = -10;
      const targetY = -10;
      player.moveTowards(targetX, targetY);
      
      assert(player.x < 0, 'x should have decreased');
      assert(player.y < 0, 'y should have decreased');
      
      const expectedX = -3.5355;
      const expectedY = -3.5355;
      const tolerance = 0.0001;
      
      assert(Math.abs(player.x - expectedX) < tolerance, `x should be close to ${expectedX}`);
      assert(Math.abs(player.y - expectedY) < tolerance, `y should be close to ${expectedY}`);
    });
  });
  
  describe('stats related methods', () => {
    let player;
    
    beforeEach(() => {
      player = new Player('test-id', 100, 100, 30, 'red', 5);
    });
    
    it('should update score based on radius', () => {
      player.radius = 50;
      player.updateScore();
      assert.strictEqual(player.stats.score, 500, 'Score should be 10 * radius');
    });
    
    it('should update high score when score increases', () => {
      player.radius = 40; 
      player.updateScore();
      assert.strictEqual(player.stats.highScore, 400, 'High score should match score when higher');
      
      player.radius = 30; 
      player.updateScore();
      assert.strictEqual(player.stats.highScore, 400, 'High score should not decrease');
    });
    
    it('should increment playersEaten counter', () => {
      assert.strictEqual(player.stats.playersEaten, 0, 'Initial value should be 0');
      player.incrementPlayersEaten();
      assert.strictEqual(player.stats.playersEaten, 1, 'Counter should increment by 1');
    });
    
    it('should increment foodEaten counter', () => {
      assert.strictEqual(player.stats.foodEaten, 0, 'Initial value should be 0');
      player.incrementFoodEaten();
      assert.strictEqual(player.stats.foodEaten, 1, 'Counter should increment by 1');
    });
    
    it('should update timeAlive', () => {
      const fakeNow = Date.now();
      player.creationTime = fakeNow - 5000;
      
      player.updateTimeAlive();
      assert.strictEqual(player.stats.timeAlive, 5, 'Time alive should be 5 seconds');
    });
    
    it('should return all stats', () => {
      player.stats = {
        score: 100,
        highScore: 200,
        timeAlive: 30,
        playersEaten: 2,
        foodEaten: 15
      };
      
      const stats = player.getAllStats();
      
      assert.deepStrictEqual(stats, {
        score: 100,
        highScore: 200,
        timeAlive: 30,
        playersEaten: 2,
        foodEaten: 15
      }, 'Should return all stats');
    });
  });
  
  describe('setUsername method', () => {
    let player;
    
    beforeEach(() => {
      player = new Player('test-id', 100, 100, 30, 'red', 5);
    });
    
    it('should set the username property', () => {
      const username = 'TestPlayer123';
      
      player.setUsername(username);
      
      assert.strictEqual(player.username, username, 
        'Username should be updated to the new value');
    });
  });
  
  describe('growPlayer method', () => {
    let player;
    
    beforeEach(() => {
      player = new Player('test-id', 100, 100, 30, 'red', 5);
    });
    
    it('should increase player radius by the growth factor', () => {
      const initialRadius = player.radius;
      const growthFactor = 1.1;
      
      player.growPlayer(growthFactor);
      
      const expectedRadius = initialRadius * growthFactor;
      assert.strictEqual(player.radius, expectedRadius, 
        'Radius should be multiplied by growth factor');
    });
    
    it('should update score after growing', () => {
      player.radius = 30;
      const growthFactor = 1.5;
      
      player.growPlayer(growthFactor);
      
      assert.strictEqual(player.stats.score, 450, 
        'Score should be updated based on new radius');
    });
  });
});