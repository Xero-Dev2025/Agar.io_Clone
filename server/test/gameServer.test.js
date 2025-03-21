import assert from 'assert';
import {describe, it, beforeEach} from 'node:test';
import { createGameServer } from '../gameServer.js';
import Player from '../Player.js';
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
        
        assert.ok(players[mockSocket.id] instanceof Player);
        assert.equal(players[mockSocket.id].id, mockSocket.id);
        assert.equal(players[mockSocket.id].radius, GAME_CONFIG.PLAYER.INITIAL_RADIUS);
    });

    it('should handle player movement', () => {
        gameServer.handleConnection(mockSocket);
        const initialX = players[mockSocket.id].x;
        const initialY = players[mockSocket.id].y;
        
        gameServer.handlePlayerMove(mockSocket.id, { x: 100, y: 100 });
        
        assert.notEqual(players[mockSocket.id].x, initialX);
        assert.notEqual(players[mockSocket.id].y, initialY);
    });

    it('should handle player disconnection', () => {
        gameServer.handleConnection(mockSocket);
        assert.ok(players[mockSocket.id]);
        
        gameServer.handleDisconnect(mockSocket.id);
        assert.ok(!players[mockSocket.id]);
    });

    it('should spawn multiple players with minimum distance between them', () => {
        const mockSockets = [
            { id: 'player1' },
            { id: 'player2' },
            { id: 'player3' }
        ];

        mockSockets.forEach(socket => {
            gameServer.handleConnection(socket);
        });

        mockSockets.forEach(socket => {
            assert.ok(players[socket.id]);
        });

        const playerPairs = [];
        Object.values(players).forEach((player1, i) => {
            Object.values(players).slice(i + 1).forEach(player2 => {
                playerPairs.push([player1, player2]);
            });
        });

        playerPairs.forEach(([player1, player2]) => {
            const dx = player1.x - player2.x;
            const dy = player1.y - player2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = player1.radius * 2;

            assert.ok(
                distance >= minDistance,
                `Players ${player1.id} and ${player2.id} are too close: ${distance} < ${minDistance}`
            );
        });

        Object.values(players).forEach(player => {
            assert.ok(player.x >= 0 && player.x <= gameMap.width);
            assert.ok(player.y >= 0 && player.y <= gameMap.height);
        });
    });
});
