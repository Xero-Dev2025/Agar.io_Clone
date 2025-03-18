import http from 'http';
import dotenv from 'dotenv';
import { Server as IOServer } from 'socket.io';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const players = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const httpServer = http.createServer(app);

const io = new IOServer(httpServer, { cors: true });

const port = process.env.PORT;

app.use(express.static(path.join(__dirname, '../client/public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/jeu.html'));
});

httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

function createServer(players = {}) {
    return {
      handleConnection(socket) {
        players[socket.id] = { x: 0, y: 0 };
      },
      handlePlayerMove(socketId, position) {
        if (players[socketId]) {
          players[socketId].x = position.x;
          players[socketId].y = position.y;
        }
      },
      handleDisconnect(socketId) {
        delete players[socketId];
      }
    };
}

const gameServer = createServer(players);

io.on('connection', (socket) => {
    console.log('Nouveau joueur connecté:', socket.id);
    gameServer.handleConnection(socket);
    socket.on('playerMove', (position) => {
        gameServer.handlePlayerMove(socket.id, position);
        io.emit('gameState', players);
    });
    
    socket.on('disconnect', () => {
        console.log('Joueur déconnecté:', socket.id);
        gameServer.handleDisconnect(socket.id);
        io.emit('gameState', players);
    });
});

export { createServer };