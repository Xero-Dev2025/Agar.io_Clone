import http from 'http';
import dotenv from 'dotenv';
import { Server as IOServer } from 'socket.io';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Player from './Player.js'; // Importer la classe Player

dotenv.config();

const players = {}; // Stocke tous les joueurs connectés

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

// Gestion des connexions des joueurs
io.on('connection', (socket) => {
    console.log('Nouveau joueur connecté:', socket.id);

    // Créer un nouveau joueur
    players[socket.id] = new Player(
        0,
        0,
        30,
        'red',
        4,
    );

    // Envoyer l'état initial du jeu au nouveau joueur
    socket.emit('initGameState', players);

    // Gérer les mouvements du joueur
    socket.on('playerMove', (mousePosition) => {
        const player = players[socket.id];
        if (!player) return;

        // Mettre à jour la position du joueur en fonction de la souris
        player.moveTowards(mousePosition.x, mousePosition.y);

        // Vérifier les collisions avec les bords de la carte
        const mapWidth = 2000;
        const mapHeight = 2000;

        if (player.x < 0) player.x = 0;
        if (player.x > mapWidth - player.radius * 2) player.x = mapWidth - player.radius * 2;
        if (player.y < 0) player.y = 0;
        if (player.y > mapHeight - player.radius * 2) player.y = mapHeight - player.radius * 2;

        // Envoyer l'état mis à jour du jeu à tous les clients
        io.emit('gameState', players);
    });

    // Gérer la déconnexion d'un joueur
    socket.on('disconnect', () => {
        console.log('Joueur déconnecté:', socket.id);
        delete players[socket.id];
        io.emit('gameState', players);
    });
});

export default io;