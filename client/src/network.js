import { io } from 'socket.io-client';
import { showGameOver } from './gameOver.js';
import { setupLoginForm } from './login.js';

export function setupNetworking(player, allPlayers, foodItems, mouse, gameMap, canvas, gameState) {
  const socket = io(window.location.origin);
  const animations = [];

  socket.on('connect', () => {
    console.log('Connecté au serveur avec l\'ID:', socket.id);
    
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session && session.username && session.authenticated) {
      socket.emit('reauthenticate', { 
        username: session.username,
        authenticated: session.authenticated,
      });
    }
    
    setupLoginForm(socket);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Erreur de connexion:', error);
  });
  
  socket.on('gameState', (data) => {
    handleGameState(data, socket, player, allPlayers, foodItems, animations, gameMap, gameState);
  });
  
  socket.on('playerEaten', (stats) => {
    console.log('Vous avez été mangé! Stats:', stats);
    gameState.gameOverDisplayed = true;
  });
  
  socket.on('logout', () => {
    localStorage.removeItem('userSession');
    window.location.reload();
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

function handleGameState(gameState, socket, player, allPlayers, foodItems, animations, gameMap, gameStateObj) {
  const playerExists = gameState.players && gameState.players[socket.id];
  
  if (!playerExists && Object.keys(allPlayers).includes(socket.id) && !gameStateObj.gameOverDisplayed) {
    console.log("Joueur disparu du gameState - affichage game over");
    showGameOver(allPlayers[socket.id]?.stats || {}, allPlayers[socket.id]?.username, socket);
    gameStateObj.gameOverDisplayed = true; 
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
  
  if (gameState.ejectedMasses && gameState.ejectedMasses.length > 0) {
    console.log(`Reçu ${gameState.ejectedMasses.length} masses éjectées`);
  }
  
  if (gameState && gameState.ejectedMasses) {
    if (!gameStateObj.ejectedMasses) {
      gameStateObj.ejectedMasses = [];
    }
    
    gameStateObj.ejectedMasses.length = 0;
    gameState.ejectedMasses.forEach(mass => {
      gameStateObj.ejectedMasses.push(mass);
    });
  }
}