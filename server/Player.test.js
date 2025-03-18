import assert from 'node:assert/strict';
import { describe, beforeEach, it} from 'node:test';
import Player from './Player.js';

describe('Player.moveTowards', () => {
  let player;
  
  beforeEach(() => {
    player = new Player(0, 0, 10, 'red');
    player.speed = 5;
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