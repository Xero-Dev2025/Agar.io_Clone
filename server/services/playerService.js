import Player from '../models/player.js';

export default class PlayerService {
  constructor(gameConfig) {
    this.gameConfig = gameConfig;
  }

  handleConnection(players, socket, gameMap) {
    let x;
    let y;
    let spawnPossible = false;

    while (!spawnPossible){
      x = Math.random() * gameMap.width;
      y = Math.random() * gameMap.height;
      spawnPossible = true;

      Object.values(players).forEach(p => {
        const dx = x - p.x;
        const dy = y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= p.radius * 2) {
          spawnPossible = false;
        }
      });
    }
    
    players[socket.id] = new Player(
      socket.id, 
      x, 
      y, 
      this.gameConfig.PLAYER.INITIAL_RADIUS, 
      'red', 
      5
    );
  }

  handlePlayerMove(players, socketId, position, gameMap) {
    const player = players[socketId];

    if (player) {
      player.moveTowards(position.x, position.y);

      if (player.x - player.radius < 0) player.x = player.radius;
      if (player.x + player.radius >= gameMap.width) player.x = gameMap.width - player.radius;
      if (player.y - player.radius < 0) player.y = player.radius;
      if (player.y + player.radius > gameMap.height) player.y = gameMap.height - player.radius;
    }
  }

  handleDisconnect(players, socketId) {
    delete players[socketId];
  }

  updateAllPlayerStats(players) {
    Object.values(players).forEach(player => {
      player.updateStats();
    });
  }
}