import http from 'http';
import dotenv from 'dotenv';
import { Server as IOServer } from 'socket.io';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGameServer } from './gameServer.js';

dotenv.config();

const players = {};
const foodItems = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = new IOServer(httpServer, { cors: true });

const port = process.env.PORT || 8081;
const GAME_WIDTH = 2000;
const GAME_HEIGHT = 2000;

app.use(express.static(path.join(__dirname, '../client/public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/jeu.html'));
});

const gameServer = createGameServer(players, foodItems);

gameServer.initializeFood(GAME_WIDTH, GAME_HEIGHT);
console.log(`Boules alimentaires initialisées: ${foodItems.length}`);

const MAX_FOOD = 100;        
const SPAWN_INTERVAL = 2000; 
const SPAWN_COUNT = 5;       

function startFoodSpawning() {
    setInterval(() => {
        if (foodItems.length < MAX_FOOD) {
            const countToSpawn = Math.min(SPAWN_COUNT, MAX_FOOD - foodItems.length);
            if (countToSpawn > 0) {
                const newFood = gameServer.spawnFood(countToSpawn, GAME_WIDTH, GAME_HEIGHT);
                console.log(`${newFood} nouvelles boules alimentaires générées (total: ${foodItems.length})`);
                
                if (Object.keys(players).length > 0) {
                    io.emit('gameState', { players: players, foodItems: foodItems });
                }
            }
        }
    }, SPAWN_INTERVAL);
}

startFoodSpawning();

io.on('connection', (socket) => {
    console.log('Nouveau joueur connecté:', socket.id);
    
    gameServer.handleConnection(socket);
    
    socket.emit('gameState', { players: players, foodItems: foodItems });
    
    socket.on('playerMove', (position) => {
        gameServer.handlePlayerMove(socket.id, position);
        
        const collisions = gameServer.detectFoodCollisions(socket.id);
        
        if (collisions.length > 0) {
            console.log(`Joueur ${socket.id} a mangé ${collisions.length} boules`);
            collisions.forEach(food => {
                gameServer.handleFoodCollision(socket.id, food);
            });
        }
        
        io.emit('gameState', { players: players, foodItems: foodItems });
    });
    
    socket.on('disconnect', () => {
        console.log('Joueur déconnecté:', socket.id);
        gameServer.handleDisconnect(socket.id);
        io.emit('gameState', { players: players, foodItems: foodItems });
    });
});

httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

export { createGameServer };