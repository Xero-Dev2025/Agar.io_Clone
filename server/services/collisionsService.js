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
    
    return availableFoodItems.filter(food => {
      const dx = player.x - food.x;
      const dy = player.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const overlapPercentage = calculateOverlapPercentage(
        player.radius, food.radius, distance, food.radius
      );
      
      return overlapPercentage >= this.OVERLAP_THRESHOLD;
    });
  }

  handleFoodCollision(players, playerId, food, consumingAnimations) {
    if (!players[playerId]) return;
    const player = players[playerId];
    
    food.isBeingConsumed = true;
    food.consumingPlayerId = playerId;
    
    player.incrementFoodEaten();

    const animation = this.animationService.createFoodConsumptionAnimation(
      food,
      player,
      this.gameConfig.ANIMATION.CONSUME_DURATION,
      this.gameConfig.PLAYER.GROWTH_FACTOR
    );
    
    consumingAnimations.push(animation);
  }

  detectPlayerCollisions(players, playerId) {
    if (!players[playerId]) return [];
    
    const player = players[playerId];
    
    return Object.values(players).filter(p => p.id !== playerId).filter(p => {
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance < player.radius + p.radius;
    });
  }

  handlePlayerCollision(players, playerId, otherPlayer, consumingAnimations) {
    if (!players[playerId] || !players[otherPlayer.id]) return;
    
    const player = players[playerId];
    const other = players[otherPlayer.id];
  
    const dx = player.x - other.x;
    const dy = player.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const playerIsLarger = player.radius / other.radius >= 1.3;
    const otherIsLarger = other.radius / player.radius >= 1.3;
    
    if (!playerIsLarger && !otherIsLarger) {
      return { player, other, action: 'pass' };
    }
    
    let smallerPlayer, largerPlayer;
    if (playerIsLarger) {
      largerPlayer = player;
      smallerPlayer = other;
    } else {
      largerPlayer = other;
      smallerPlayer = player;
    }
    
    const smallerArea = Math.PI * smallerPlayer.radius * smallerPlayer.radius;
    
    const overlapPercentage = calculateOverlapPercentage(
      largerPlayer.radius, 
      smallerPlayer.radius, 
      distance,
      smallerArea
    );
    
    if (playerIsLarger && overlapPercentage >= this.PLAYER_OVERLAP_THRESHOLD) {
      return this._handlePlayerEatsPlayer(players, player, other, consumingAnimations);
    }
    else if (otherIsLarger && overlapPercentage >= this.PLAYER_OVERLAP_THRESHOLD) {
      return this._handlePlayerEatsPlayer(players, other, player, consumingAnimations);
    }
    else {
      return { player, other, action: 'pass' };
    }
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