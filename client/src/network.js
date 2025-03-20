import { io } from 'socket.io-client';

export function setupNetworking(player, allPlayers, foodItems, mouse, gameMap, canvas) {
  const socket = io(window.location.origin);
  const animations = [];
  
  socket.on('connect', () => {
    console.log('Connecté au serveur avec l\'ID:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Erreur de connexion:', error);
  });
  
  socket.on('gameState', (gameState) => {
    handleGameState(gameState, socket, player, allPlayers, foodItems, animations, gameMap);
  });
  
  setInterval(() => {
    // Convertir les coordonnées écran en coordonnées monde
    const worldX = player.x + (mouse.x - canvas.width/2);
    const worldY = player.y + (mouse.y - canvas.height/2);
    
    socket.emit('playerMove', {x: worldX, y: worldY});
  }, 1000/60);
  
  return { socket, animations };
}

function handleGameState(gameState, socket, player, allPlayers, foodItems, animations, gameMap) {
  Object.keys(allPlayers).forEach(id => delete allPlayers[id]);
  
  if (gameState && gameState.players) {
    // Copier tous les joueurs dans allPlayers
    Object.assign(allPlayers, gameState.players);
    
    // Récupérer le joueur correspondant à la socket actuelle
    if (gameState.players[socket.id]) {
      Object.assign(player, gameState.players[socket.id]);
      console.log('Player actualisé:', player);
    }
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