import http from 'http';
import dotenv from 'dotenv';
import { Server as IOServer } from 'socket.io';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGameServer } from './gameServer.js';
import { GAME_CONFIG } from './utils/config.js';
import auth from './auth.js';

dotenv.config();
const BOT_COUNT = 5;
const players = {}; 
const foodItems = [];
const gameMap = {
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = new IOServer(httpServer, { cors: true });

const port = process.env.PORT || 8081;

app.use(express.static(path.join(__dirname, '../client/public')));
app.use('/shared', express.static(path.join(__dirname, '../shared')));

app.get('/paku', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/game.html'));
});

const gameServer = createGameServer(players, foodItems, gameMap);
gameServer.initalizeGameMap(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
gameServer.initializeFood(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
gameServer.initializeBots(BOT_COUNT);

const BOT_UPDATE_INTERVAL = 16;
const BOT_TOTAL_UPDATE = 100; 

let botUpdateIndex = 0;

setInterval(() => {
    const botIds = gameServer.getBotIds();
    if (botIds.length === 0) return;
    
    gameServer.updateSpecificBots(botIds);
}, BOT_UPDATE_INTERVAL);



function startFoodSpawning() {
    setInterval(() => {
        if (foodItems.length < GAME_CONFIG.FOOD.MAX_COUNT) {
            const countToSpawn = Math.min(
                GAME_CONFIG.FOOD.SPAWN_COUNT, 
                GAME_CONFIG.FOOD.MAX_COUNT - foodItems.length
            );
            
            if (countToSpawn > 0) {
                const newFood = gameServer.spawnFood(
                    countToSpawn, 
                    GAME_CONFIG.WIDTH, 
                    GAME_CONFIG.HEIGHT
                );
                
                if (Object.keys(players).length > 0) {
                    io.emit('gameState', { 
                        players: players, 
                        foodItems: foodItems,
                        animations: gameServer.getAnimations()
                    });
                }
            }
        }
    }, GAME_CONFIG.FOOD.SPAWN_INTERVAL);
}

const ANIMATION_UPDATE_INTERVAL = 33; 

function startAnimationUpdates() {
    setInterval(() => {
        const gameState = gameServer.updateAnimations();
        
        if (Object.keys(players).length > 0 && gameState.animations.length > 0) {
            io.emit('gameState', { 
                players: gameState.players, 
                foodItems: gameState.foodItems, 
                animations: gameState.animations 
            });
        }
    }, ANIMATION_UPDATE_INTERVAL);
}

function startStatsUpdates() {
    setInterval(() => {
        Object.values(players).forEach(player => {
            if (player && player.updateStats) {
                player.updateStats();
            }
        });
        
        if (Object.keys(players).length > 0) {
            io.emit('gameState', { 
                players: players, 
                foodItems: foodItems,
                animations: gameServer.getAnimations(),
                gameMap: gameMap
            });
        }
    }, 1000); 
}

startStatsUpdates();
startFoodSpawning();
startAnimationUpdates();

io.on('connection', (socket) => {
    
    gameServer.handleConnection(socket);
    
    socket.emit('gameState', { 
        players: players, 
        foodItems: foodItems,
        animations: gameServer.getAnimations(),
        gameMap: gameMap
    });
    
    socket.on('login', (data, callback) => {
        const result = auth.authenticateUser(data.username, data.password);
        
        if (result.success) {
            const userStats = auth.getUserStats(data.username);
            result.stats = userStats;
            
            socket.user = {
                username: data.username,
                authenticated: true
            };
        } else {
        }
        
        callback(result);
    });

    socket.on('reauthenticate', (data) => {
        socket.user = {
            username: data.username,
            authenticated: data.authenticated
        };
    });

    socket.on('register', (data, callback) => {
        const result = auth.registerUser(data.username, data.password);
        
        callback(result);
    });
    
    socket.on('setUsername', (username) => {
        if (players[socket.id] && username) {
            players[socket.id].setUsername(username);
            
            io.emit('gameState', { 
                players: players, 
                foodItems: foodItems,
                animations: gameServer.getAnimations(),
                gameMap: gameMap
            });
        }
    });
    
    socket.on('playerMove', (position) => {
        gameServer.handlePlayerMove(socket.id, position);
        
        if (players[socket.id]) {
            players[socket.id].updateStats();
        }
        
        const collisionsPlayers = gameServer.detectPlayerCollisions(socket.id);
        
        if (collisionsPlayers.length > 0) {
            
            collisionsPlayers.forEach(otherPlayer => {
                const result = gameServer.handlePlayerCollision(socket.id, otherPlayer.id);
                if (result) {
                    
                    io.emit('gameState', { 
                        players: players, 
                        foodItems: foodItems,
                        animations: gameServer.getAnimations()
                    });
                }
            });
        }
        
        const collisionsFood = gameServer.detectFoodCollisions(socket.id);
        
        if (collisionsFood.length > 0) {
            collisionsFood.forEach(food => {
                gameServer.handleFoodCollision(socket.id, food);
            });
        }
        
        io.emit('gameState', { 
            players: players, 
            foodItems: foodItems,
            animations: gameServer.getAnimations()
        });
    });

    socket.on('playerEaten', (data) => {
        if (data.isBot) {
            setTimeout(() => gameServer.respawnBot(), 5000);
        }
        if (socket.user && socket.user.authenticated) {
            const username = socket.user.username;
            const stats = data;
            auth.updateUserStats(username, stats);
        } else {
        }
    });

    socket.on('getPlayerStats', (username) => {
        const userStats = auth.getUserStats(username);
        
        socket.emit('playerStats', {
            username: username,
            stats: userStats || {}
        });
    });

    socket.on('playerSplit', () => {
        if (players[socket.id]) {
            const didSplit = gameServer.handlePlayerSplit(socket.id);
            if (didSplit) {
                io.emit('gameState', { 
                    players: players, 
                    foodItems: foodItems,
                    animations: gameServer.getAnimations(),
                    gameMap: gameMap
                });
            }
        }
    });

    socket.on('disconnect', () => {
        gameServer.handleDisconnect(socket.id);
        
        io.emit('gameState', { 
            players: players, 
            foodItems: foodItems,
            animations: gameServer.getAnimations()
        });
    });
});

httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});