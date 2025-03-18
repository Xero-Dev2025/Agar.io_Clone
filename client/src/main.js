import { io } from 'socket.io-client';

const canvas = document.querySelector('.gameCanvas');
const ctx = canvas.getContext('2d');

// Définir les dimensions du canvas
function setCanvasDimensions(canvas) {
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 100;
}

setCanvasDimensions(canvas);

const allPlayers = {}; // Stocke tous les joueurs reçus du serveur

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

// Dessiner tous les joueurs
function drawAllPlayers() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    Object.keys(allPlayers).forEach(id => {
        const player = allPlayers[id];
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Écouter les mouvements de la souris
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;

});

// Envoyer les mouvements de la souris au serveur toutes les 60 FPS
setInterval(() => {
    socket.emit('playerMove', mouse);
}
, 1000 / 60);

// Boucle de jeu
function gameLoop() {
    drawAllPlayers();
    requestAnimationFrame(gameLoop);
}

// Connexion au serveur
const socket = io(window.location.hostname + ':8080');

// Recevoir l'état initial du jeu
socket.on('initGameState', (players) => {
    Object.assign(allPlayers, players);
});

// Recevoir les mises à jour du jeu
socket.on('gameState', (players) => {
    Object.keys(allPlayers).forEach(id => delete allPlayers[id]);
    Object.assign(allPlayers, players);
});

// Démarrer la boucle de jeu
gameLoop();

console.log('Jeu initialisé');