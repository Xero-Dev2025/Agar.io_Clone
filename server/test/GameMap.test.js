import assert from 'node:assert/strict';
import { describe, beforeEach, it } from 'node:test';
import GameMap from '../GameMap.js'; 

describe('GameMap', () => {
  it('should create a GameMap with positive dimensions', () => {
    const map = new GameMap(100, 200);
    assert.strictEqual(map.width, 100, 'width should be 100');
    assert.strictEqual(map.height, 200, 'height should be 200');
  });

  it('should throw an error when width is negative', () => {
    assert.throws(
      () => new GameMap(-10, 200),
      {
        name: 'Error',
        message: 'Map width cannot be negative or zero'
      },
      'should throw an error for negative width'
    );
  });

  it('should throw an error when height is negative', () => {
    assert.throws(
      () => new GameMap(100, -10),
      {
        name: 'Error',
        message: 'Map height cannot be negative or zero'
      },
      'should throw an error for negative height'
    );
  });

  it('should throw an error when width is zero', () => {
    assert.throws(
      () => new GameMap(0, 200),
      {
        name: 'Error',
        message: 'Map width cannot be negative or zero'
      },
      'should throw an error for zero width'
    );
  });

  it('should throw an error when height is zero', () => {
    assert.throws(
      () => new GameMap(100, 0),
      {
        name: 'Error',
        message: 'Map height cannot be negative or zero'
      },
      'should throw an error for zero height'
    );
  });

  it('should allow large dimensions', () => {
    const map = new GameMap(5000, 10000);
    assert.strictEqual(map.width, 5000, 'width should be 5000');
    assert.strictEqual(map.height, 10000, 'height should be 10000');
  });
});