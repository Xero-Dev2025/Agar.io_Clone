import {io} from 'socket.io-client';
const canvas = document.querySelector('.gameCanvas');

function setCanvasDimensions(canvas) {
    canvas.width = window.innerWidth - 20;  
    canvas.height = window.innerHeight - 100;  
}

setCanvasDimensions(canvas);

const ctx = canvas.getContext('2d');

const allPlayers = {};

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 30,
    color: 'red',
    speed: 5
};

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

function drawAllPlayers() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    
    Object.keys(allPlayers).forEach(id => {
        if (id !== socket.id) { 
            ctx.beginPath();
            ctx.arc(allPlayers[id].x, allPlayers[id].y, player.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'blue';
            ctx.fill();
            ctx.closePath();
        }
    });
}

function updatePlayerPosition() {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > player.speed) {
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
    } else {
        player.x = mouse.x;
        player.y = mouse.y;
    }
}

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

function gameLoop() {
    updatePlayerPosition();
    drawAllPlayers(); 
    requestAnimationFrame(gameLoop);
}

const socket = io(window.location.hostname + ':8080');

setInterval(() => {
    socket.emit('playerMove', { x: player.x, y: player.y });
}, 50);

socket.on('gameState', (players) => {
    Object.keys(allPlayers).forEach(id => delete allPlayers[id]);
    Object.keys(players).forEach(id => {
        allPlayers[id] = players[id];
    });
});

gameLoop();

console.log('Jeu initialisé');