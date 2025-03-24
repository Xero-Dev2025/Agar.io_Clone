import { calculateOverlapPercentage } from '../utils/mathUtils.js';

export default class CollisionService {
  constructor(gameConfig, animationService) {
    this.gameConfig = gameConfig;
    this.animationService = animationService;
    this.OVERLAP_THRESHOLD = 0.7;
    this.PLAYER_OVERLAP_THRESHOLD = 0.65;
  }

  detectFoodCollisions(players, playerId, foodItems) {
    if (!players[playerId]) return [];
    
    const player = players[playerId];
    const availableFoodItems = foodItems.filter(food => !food.isBeingConsumed);
    const collidedFood = [];
    
    player.cells.forEach(cell => {
      availableFoodItems.forEach(food => {
        if (collidedFood.includes(food)) return; // Éviter les doublons
        
        const dx = cell.x - food.x;
        const dy = cell.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const overlapPercentage = calculateOverlapPercentage(
          cell.radius, food.radius, distance, food.radius
        );
        
        if (overlapPercentage >= this.OVERLAP_THRESHOLD) {
          collidedFood.push(food);
        }
      });
    });
    
    return collidedFood;
  }

  handleFoodCollision(players, playerId, food, consumingAnimations) {
    if (!players[playerId]) return;
    const player = players[playerId];
    
    food.isBeingConsumed = true;
    food.consumingPlayerId = playerId;
    
    player.incrementFoodEaten();
    
    let closestCell = null;
    let minDistance = Infinity;
    
    player.cells.forEach(cell => {
      const dx = cell.x - food.x;
      const dy = cell.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCell = cell;
      }
    });
    
    if (closestCell) {
      const animation = {
        id: this.animationService._generateId(),
        foodId: food.id,
        playerId: player.id,
        cellId: closestCell.id,
        startTime: Date.now(),
        duration: this.gameConfig.ANIMATION.CONSUME_DURATION || 300,
        startPosition: { x: food.x, y: food.y },
        targetPosition: { x: closestCell.x, y: closestCell.y },
        initialFoodRadius: food.radius,
        initialCellRadius: closestCell.radius,
        targetCellRadius: closestCell.radius * this.gameConfig.PLAYER.GROWTH_FACTOR,
        completed: false
      };
      
      consumingAnimations.push(animation);
    }
    
    player.updateScore();
  }

  detectPlayerCollisions(players, playerId) {
    if (!players[playerId]) return [];
    
    const player = players[playerId];
    const collidingPlayers = [];
    
    Object.values(players).forEach(otherPlayer => {
      if (otherPlayer.id === playerId) return;
      
      // console.log(`Vérification de collision entre ${playerId} et ${otherPlayer.id}`);
      
      let collision = false;
      
      for (let i = 0; i < player.cells.length && !collision; i++) {
        const playerCell = player.cells[i];
        
        for (let j = 0; j < otherPlayer.cells.length && !collision; j++) {
          const otherCell = otherPlayer.cells[j];
          
          const dx = playerCell.x - otherCell.x;
          const dy = playerCell.y - otherCell.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // console.log(`  Distance: ${distance}, Rayon joueur: ${playerCell.radius}, Rayon autre: ${otherCell.radius}`);
          
          if (playerCell.radius > otherCell.radius * 1.25 && distance < playerCell.radius) {
            // console.log(`  Collision détectée: ${playerId} peut manger ${otherPlayer.id}`);
            collision = true;
            break;
          } else if (otherCell.radius > playerCell.radius * 1.25 && distance < otherCell.radius) {
            // console.log(`  Collision détectée: ${otherPlayer.id} peut manger ${playerId}`);
            collision = true;
            break;
          }
        }
      }
      
        if (collision) {
            collidingPlayers.push(otherPlayer);
        }
        });
        
        return collidingPlayers;
    }

    handlePlayerCollision(players, playerId, otherPlayerId, consumingAnimations) {
        const otherId = typeof otherPlayerId === 'string' ? otherPlayerId : otherPlayerId.id;
        
        if (!players[playerId] || !players[otherId]) {
            // console.log(`Erreur: un joueur manquant - ${playerId} ou ${otherId}`);
            return false;
        }
        
        const player = players[playerId];
        const other = players[otherId];
        
        //console.log(`Gestion de la collision entre ${player.id} et ${other.id}`);
        
        let playerAteOther = false;
        let otherAtePlayer = false;
        
        const playerCellsToRemove = [];
        const otherCellsToRemove = [];
        
        player.cells.forEach(playerCell => {
          other.cells.forEach(otherCell => {
            const dx = playerCell.x - otherCell.x;
            const dy = playerCell.y - otherCell.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (playerCell.radius > otherCell.radius * 1.25 && distance < playerCell.radius) {
              playerAteOther = true;
              
              const areaEaten = Math.PI * otherCell.radius * otherCell.radius;
              const currentArea = Math.PI * playerCell.radius * playerCell.radius;
              const newArea = currentArea + areaEaten;
              
              playerCell.radius = Math.sqrt(newArea / Math.PI);
              
              otherCellsToRemove.push(otherCell.id);
              
              // console.log(`Joueur ${player.id} mange une cellule de ${other.id}`);
            }
            else if (otherCell.radius > playerCell.radius * 1.25 && distance < otherCell.radius) {
              otherAtePlayer = true;
              
              const areaEaten = Math.PI * playerCell.radius * playerCell.radius;
              const currentArea = Math.PI * otherCell.radius * otherCell.radius;
              const newArea = currentArea + areaEaten;
              
              otherCell.radius = Math.sqrt(newArea / Math.PI);
              
              playerCellsToRemove.push(playerCell.id);
              
              // console.log(`Joueur ${other.id} mange une cellule de ${player.id}`);
            }
          });
        });
        
        if (playerCellsToRemove.length > 0) {
          player.cells = player.cells.filter(cell => !playerCellsToRemove.includes(cell.id));
        }
        
        if (otherCellsToRemove.length > 0) {
          other.cells = other.cells.filter(cell => !otherCellsToRemove.includes(cell.id));
        }
        
        if (player.cells.length === 0) {
          other.incrementPlayersEaten();
          other.updateScore();
          delete players[playerId];
          return true;
        }
        
        if (other.cells.length === 0) {
          player.incrementPlayersEaten();
          player.updateScore();
          delete players[otherId];
          return true;
        }
        
        if (playerAteOther || otherAtePlayer) {
          player.updateMainRadius();
          other.updateMainRadius();
          
          player.updateScore();
          other.updateScore();
        }
        
        return playerAteOther || otherAtePlayer;
    }

  _handlePlayerEatsPlayer(players, predator, prey, consumingAnimations) {
    const predatorArea = Math.PI * predator.radius * predator.radius;
    const preyArea = Math.PI * prey.radius * prey.radius;
    const newRadius = Math.sqrt((predatorArea + preyArea) / Math.PI);
    
    predator.radius = newRadius;
    
    predator.incrementPlayersEaten();
    predator.updateStats();
    
    const eatenPlayerStats = JSON.parse(JSON.stringify(prey.stats));

    const animation = this.animationService.createPlayerConsumptionAnimation(
      predator,
      prey,
      this.gameConfig.ANIMATION.CONSUME_DURATION,
      eatenPlayerStats
    );
    
    consumingAnimations.push(animation);

    const result = { 
      predator: predator, 
      prey: { 
        id: prey.id, 
        stats: eatenPlayerStats 
      }, 
      action: 'consume' 
    };

    delete players[prey.id];
    
    return result;
  }
}