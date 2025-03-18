import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import createGameServer  from '../gameServer.js';

describe('Game Server', () => {
    let gameServer;
    let players;
    let foodItems;

    beforeEach(() => {
        players = {};
        foodItems = [];
        gameServer = createGameServer(players, foodItems);
      });

    it('should add a new player on connection', () => {
        const mockSocket = { id: 'player1', on: () => {} };
        gameServer.handleConnection(mockSocket);
        assert.deepStrictEqual(players[mockSocket.id], { x: 0, y: 0 });
    });
    
    it('should update player position', () => {
        const mockSocket = { id: 'player1', on: () => {} };
        gameServer.handleConnection(mockSocket);
        gameServer.handlePlayerMove(mockSocket.id, { x: 100, y: 200 });
        assert.deepStrictEqual(players[mockSocket.id], { x: 100, y: 200 });
    });
    
    it('should remove player on disconnect', () => {
        const mockSocket = { id: 'player1', on: () => {} };
        gameServer.handleConnection(mockSocket);
        gameServer.handleDisconnect(mockSocket.id);
        assert.equal(players[mockSocket.id], undefined);
    });

    it('should initialize food balls at startup', () => {
        gameServer.initializeFood(800, 600);
        assert.ok(foodItems.length > 0, 'Food items should be generated');
    });

    it('should detect collision between a player and a food ball', () => {
        players['player1'] = { x: 100, y: 100, radius: 30 };
        
        foodItems.push({ id: 1, x: 105, y: 105, radius: 10 });
        
        const collisions = gameServer.detectFoodCollisions('player1');
        assert.equal(collisions.length, 1, 'A collision should be detected');
    });
    it('should increase player size after eating a food ball', () => {
        const playerId = 'player1';
        const initialRadius = 30;
        players[playerId] = { x: 100, y: 100, radius: initialRadius };
        
        foodItems.push({ id: 1, x: 105, y: 105, radius: 10 });
        gameServer.handleFoodCollision(playerId, foodItems[0]);
    
        assert.ok(players[playerId].radius > initialRadius, 'Player radius should increase');
        assert.equal(foodItems.length, 0, 'The food item should be removed');
      });
});