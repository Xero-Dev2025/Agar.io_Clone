import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { createServer } from '../server/index.js';

describe('Game Server', () => {
    let gameServer;
    let players;
    
    beforeEach(() => {
        players = {};
        gameServer = createServer(players);
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
});