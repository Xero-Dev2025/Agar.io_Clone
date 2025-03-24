import { drawGame } from './render.js';
import { setupNetworking } from './network.js';
import { setupModals } from './modal.js';

setupModals();

const canvas = document.querySelector('.gameCanvas');
const ctx = canvas.getContext('2d');

const gameOver = document.querySelector('.gameOver');

if (gameOver) gameOver.style.display = 'none';

function setCanvasDimensions(canvas) {
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 100;
}

setCanvasDimensions(canvas);

const allPlayers = {};
const foodItems = [];
const gameMap = {
    width: 0,
    height: 0
};
const player = {};
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

const gameState = { 
    ejectedMasses: [],
    gameOverDisplayed: false
};

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

let wKeyPressed = false;

window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && socket) {
        socket.emit('playerSplit');
        event.preventDefault();
    }
    
    if ((event.code === 'KeyW' || event.key === 'w') && socket && !wKeyPressed) {
        wKeyPressed = true;
        socket.emit('playerEjectMass');
        event.preventDefault();
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'KeyW' || event.key === 'w') {
        wKeyPressed = false;
    }
});

const { socket, animations } = setupNetworking(player, allPlayers, foodItems, mouse, gameMap, canvas, gameState);

function gameLoop() {
    drawGame(ctx, player, foodItems, allPlayers, socket.id, animations, gameMap, mouse, gameState.ejectedMasses);
    requestAnimationFrame(gameLoop);
}

gameLoop();