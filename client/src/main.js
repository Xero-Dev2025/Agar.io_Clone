import {io} from 'socket.io-client';
const canvas = document.querySelector('.gameCanvas');

function setCanvasDimensions(canvas) {
    canvas.width = window.innerWidth - 20;  
    canvas.height = window.innerHeight - 100;  
}

setCanvasDimensions(canvas);

const ctx = canvas.getContext('2d');

const allPlayers = {};
const foodItems = [];

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
    
    if (foodItems.length > 0) {
        foodItems.forEach((food, index) => {
            if (food && typeof food.x === 'number' && typeof food.y === 'number') {
                try {
                    ctx.beginPath();
                    ctx.arc(food.x, food.y, food.radius || 10, 0, Math.PI * 2);
                    ctx.fillStyle = food.color || '#8BC34A';
                    ctx.fill();
                    ctx.closePath();
                } catch (e) {
                    console.error(`Erreur lors du dessin de la boule ${index}:`, e, food);
                }
            } else {
                console.error(`Boule alimentaire invalide à l'index ${index}:`, food);
            }
        });
    }
        ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
        Object.keys(allPlayers).forEach(id => {
        if (id !== socket.id) {
            const otherPlayer = allPlayers[id];
            if (otherPlayer) {
                ctx.beginPath();
                ctx.arc(otherPlayer.x, otherPlayer.y, otherPlayer.radius || 30, 0, Math.PI * 2);
                ctx.fillStyle = 'blue';
                ctx.fill();
                ctx.closePath();
            }
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

const socket = io(window.location.origin);

socket.on('connect', () => {
    console.log('Connecté au serveur avec l\'ID:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Erreur de connexion:', error);
});

setInterval(() => {
    socket.emit('playerMove', { x: player.x, y: player.y });
}, 50);

socket.on('gameState', (gameState) => {
    
    Object.keys(allPlayers).forEach(id => delete allPlayers[id]);
    
    if (gameState && gameState.players) {
        Object.keys(gameState.players).forEach(id => {
            allPlayers[id] = gameState.players[id];
            
            if (id === socket.id) {
                player.radius = gameState.players[id].radius;
            }
        });
    } else {
        console.error("Aucun joueur dans gameState:", gameState);
    }
    
    foodItems.length = 0;
    
    if (gameState && gameState.foodItems && Array.isArray(gameState.foodItems)) {
        gameState.foodItems.forEach(food => foodItems.push(food));
    } else {
        console.error("Aucune boule alimentaire dans gameState ou format incorrect:", gameState);
    }
    
});

gameLoop();

console.log('Jeu initialisé');