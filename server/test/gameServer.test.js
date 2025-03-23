import assert from 'assert';
import { describe, it, beforeEach } from 'node:test';
import { createGameServer } from '../gameServer.js';
import Player from '../models/player.js';
import { GAME_CONFIG } from '../utils/config.js';

describe('GameServer', () => {
    let gameServer;
    let players;
    let foodItems;
    let gameMap;
    let mockSocket;

    beforeEach(() => {
        players = {};
        foodItems = [];
        gameMap = { width: GAME_CONFIG.WIDTH, height: GAME_CONFIG.HEIGHT };
        mockSocket = { id: 'test-socket-id' };
        gameServer = createGameServer(players, foodItems, gameMap);
    });

    it('should handle new player connection', () => {
        gameServer.handleConnection(mockSocket);
        
        assert.ok(players[mockSocket.id]);
        assert.equal(players[mockSocket.id].id, mockSocket.id);
    });

    it('should handle player movement', () => {
        players[mockSocket.id] = new Player(mockSocket.id, 0, 0, GAME_CONFIG.PLAYER.INITIAL_RADIUS, 'red', 5);
        const initialX = players[mockSocket.id].x;
        const initialY = players[mockSocket.id].y;
        
        gameServer.handlePlayerMove(mockSocket.id, { x: 100, y: 100 });
        
        assert.notEqual(players[mockSocket.id].x, initialX);
        assert.notEqual(players[mockSocket.id].y, initialY);
    });

    it('should handle player disconnection', () => {
        players[mockSocket.id] = new Player(mockSocket.id, 0, 0, GAME_CONFIG.PLAYER.INITIAL_RADIUS, 'red', 5);
        assert.ok(players[mockSocket.id]);
        
        gameServer.handleDisconnect(mockSocket.id);
        assert.ok(!players[mockSocket.id]);
    });

    it('should get animations', () => {
        const animations = gameServer.getAnimations();
        assert.ok(Array.isArray(animations), "Animations should be an array");
    });
});