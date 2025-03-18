import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { createGameServer } from '../gameServer.js';
import { GAME_CONFIG } from '../utils/config.js';

let originalDateNow;

describe('Game Server', () => {
    let gameServer;
    let players;
    let foodItems;
    
    beforeEach(() => {
        originalDateNow = Date.now;
        
        let mockTime = 1000;
        Date.now = () => mockTime;
        
        global.advanceTime = (ms) => {
            mockTime += ms;
        };
        
        players = {};
        foodItems = [];
        gameServer = createGameServer(players, foodItems);
    });
    
    afterEach(() => {
        Date.now = originalDateNow;
        delete global.advanceTime;
    });

    it('should add a new player on connection', () => {
        const mockSocket = { id: 'player1', on: () => {} };
        gameServer.handleConnection(mockSocket);
        assert.deepStrictEqual(players[mockSocket.id], { 
            x: 0, 
            y: 0, 
            radius: 30,
            id: 'player1',
            color: players[mockSocket.id].color 
        });
    });
    
    it('should update player position', () => {
        const mockSocket = { id: 'player1', on: () => {} };
        gameServer.handleConnection(mockSocket);
        gameServer.handlePlayerMove(mockSocket.id, { x: 100, y: 200 });
        
        assert.equal(players[mockSocket.id].x, 100);
        assert.equal(players[mockSocket.id].y, 200);
        assert.equal(players[mockSocket.id].radius, 30);
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
        players['player1'] = { 
            id: 'player1',
            x: 100, 
            y: 100, 
            radius: 30,
            color: '#FF5252' 
        };
        
        foodItems.push({ 
            id: 1, 
            x: 105, 
            y: 105, 
            radius: 10,
            isBeingConsumed: false 
        });
        
        const collisions = gameServer.detectFoodCollisions('player1');
        assert.equal(collisions.length, 1, 'A collision should be detected');
    });
    
    it('should start animation and mark food as being consumed after collision', () => {
        const playerId = 'player1';
        players[playerId] = { 
            id: playerId,
            x: 100, 
            y: 100, 
            radius: 30,
            color: '#FF5252'
        };
        
        const foodItem = { id: 'food1', x: 105, y: 105, radius: 10 };
        foodItems.push(foodItem);
        
        gameServer.handleFoodCollision(playerId, foodItem);
        
        assert.equal(foodItem.isBeingConsumed, true);
        assert.equal(foodItem.consumingPlayerId, playerId);
        
        const animations = gameServer.getAnimations();
        assert.equal(animations.length, 1);
        assert.equal(animations[0].foodId, 'food1');
        assert.equal(animations[0].playerId, playerId);
    });
    
    it('should increase player size and remove food after animation completes', () => {
        const playerId = 'player1';
        const initialRadius = 30;
        players[playerId] = { 
            id: playerId,
            x: 100, 
            y: 100, 
            radius: initialRadius,
            color: '#FF5252'
        };
        
        const foodItem = { id: 'food1', x: 105, y: 105, radius: 10 };
        foodItems.push(foodItem);
        
        gameServer.handleFoodCollision(playerId, foodItem);
        
        global.advanceTime(GAME_CONFIG.ANIMATION.CONSUME_DURATION + 10);
        
        gameServer.updateAnimations();
        
        assert.ok(players[playerId].radius > initialRadius, 'Player radius should increase');
        
        const foodStillExists = foodItems.some(f => f.id === 'food1');
        assert.equal(foodStillExists, false, 'The food item should be removed');
    });
    
    it('should not detect collision with food being consumed', () => {
        players['player1'] = { 
            id: 'player1',
            x: 100, 
            y: 100, 
            radius: 30,
            color: '#FF5252'
        };
        
        foodItems.push({ 
            id: 1, 
            x: 105, 
            y: 105, 
            radius: 10,
            isBeingConsumed: true,
            consumingPlayerId: 'player2'
        });
        
        const collisions = gameServer.detectFoodCollisions('player1');
        assert.equal(collisions.length, 0, 'No collision should be detected with food being consumed');
    });
});