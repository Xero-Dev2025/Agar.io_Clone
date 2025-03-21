import { io } from 'socket.io-client';
import { showGameOver } from './gameOver.js';
import { setupLoginForm } from './login.js';

export function setupNetworking(player, allPlayers, foodItems, mouse, gameMap, canvas) {
  const socket = io(window.location.origin);
  const animations = [];
  
  socket.on('connect', () => {
    console.log('Connecté au serveur avec l\'ID:', socket.id);
    setupLoginForm(socket);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Erreur de connexion:', error);
  });
  
  socket.on('gameState', (gameState) => {
    handleGameState(gameState, socket, player, allPlayers, foodItems, animations, gameMap);
  });
  
  socket.on('playerEaten', (stats) => {
    console.log('Vous avez été mangé! Stats:', stats);
    showGameOver(stats);
  });
  
  setInterval(() => {
    if (document.body.classList.contains('login-active') === false) {
      const worldX = player.x + (mouse.x - canvas.width/2);
      const worldY = player.y + (mouse.y - canvas.height/2);
      
      socket.emit('playerMove', {x: worldX, y: worldY});
    }
  }, 1000/60);
  
  return { socket, animations };
}

function handleGameState(gameState, socket, player, allPlayers, foodItems, animations, gameMap) {
  const playerExists = gameState.players && gameState.players[socket.id];
  
  if (!playerExists && Object.keys(allPlayers).includes(socket.id)) {
    console.log("Joueur disparu du gameState - affichage game over");
    showGameOver(allPlayers[socket.id]?.stats || {}, allPlayers[socket.id]?.username);
    return;
  }
  
  if (playerExists) {
    Object.assign(player, gameState.players[socket.id]);
  }
  
  Object.keys(allPlayers).forEach(id => delete allPlayers[id]);
  
  if (gameState && gameState.players) {
    Object.keys(gameState.players).forEach(id => {
      allPlayers[id] = gameState.players[id];
    });
  }
  
  if (gameState && gameState.gameMap) {
    Object.assign(gameMap, gameState.gameMap);
  }
  
  foodItems.length = 0;
  
  if (gameState && gameState.foodItems && Array.isArray(gameState.foodItems)) {
    gameState.foodItems.forEach(food => foodItems.push(food));
  }

  animations.length = 0;
  
  if (gameState && gameState.animations) {
    gameState.animations.forEach(anim => animations.push(anim));
  }
}