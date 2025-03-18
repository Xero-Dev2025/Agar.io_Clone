import { createPlayer, updatePlayerPosition } from './player.js';
import { drawGame } from './render.js';
import { setupNetworking } from './network.js';

const canvas = document.querySelector('.gameCanvas');

function setCanvasDimensions(canvas) {
    canvas.width = window.innerWidth - 20;  
    canvas.height = window.innerHeight - 100;  
}

setCanvasDimensions(canvas);

const ctx = canvas.getContext('2d');

const allPlayers = {};
const foodItems = [];
const player = createPlayer(canvas.width, canvas.height);
const mouse = {
  x: window.innerWidth / 2,  // Utiliser la même référence que dans updatePlayerPosition
  y: window.innerHeight / 2
};

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

const { socket, animations } = setupNetworking(player, allPlayers, foodItems);

function gameLoop() {
    updatePlayerPosition(player, mouse);
    drawGame(ctx, player, foodItems, allPlayers, socket.id, animations);
    requestAnimationFrame(gameLoop);
}

gameLoop();