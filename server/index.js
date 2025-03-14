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

const io = new IOServer(httpServer,     { cors: true });

const port = process.env.PORT;

app.use(express.static(path.join(__dirname, '../client/public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/jeu.html'));
});

httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

io.on('connection', (socket) => {
    console.log('Nouveau joueur connecté:', socket.id);
    
    players[socket.id] = {
        x: 0,
        y: 0
    };
    
    socket.on('playerMove', (position) => {
        players[socket.id].x = position.x;
        players[socket.id].y = position.y;
        
        io.emit('gameState', players);
    });
    
    socket.on('disconnect', () => {
        console.log('Joueur déconnecté:', socket.id);
        delete players[socket.id];
        io.emit('gameState', players);
    });
});

export default io;