import Player from '../models/Player.js';

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
    
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF8000', '#8000FF', '#00FF80'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    players[socket.id] = new Player(
      socket.id, 
      x, 
      y, 
      this.gameConfig.PLAYER.INITIAL_RADIUS, 
      color, 
      5
    );
}

handlePlayerMove(players, socketId, position, gameMap) {
  const player = players[socketId];

  if (player) {
      player.setTarget(position.x, position.y);
      
      player.moveTowards(position.x, position.y);
      
      player.handleCellCollisions(false);

      player.mergeCheck();

      player.cells.forEach(cell => {
          if (cell.x - cell.radius < 0) cell.x = cell.radius;
          if (cell.x + cell.radius >= gameMap.width) cell.x = gameMap.width - cell.radius;
          if (cell.y - cell.radius < 0) cell.y = cell.radius;
          if (cell.y + cell.radius > gameMap.height) cell.y = gameMap.height - cell.radius;
      });
  }
}
  
  handlePlayerSplit(players, socketId) {
    const player = players[socketId];
    if (player) {
      return player.split();
    }
    return false;
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