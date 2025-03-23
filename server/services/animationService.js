export default class AnimationService {

    createFoodConsumptionAnimation(food, player, duration, growthFactor) {
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
        
        if (!closestCell) {
          closestCell = player.cells[0]; 
        }
        
        return {
          id: this._generateId(),
          foodId: food.id,
          playerId: player.id,
          cellId: closestCell.id,
          startTime: Date.now(),
          duration: duration || 300,
          startPosition: { x: food.x, y: food.y },
          targetPosition: { x: closestCell.x, y: closestCell.y },
          initialFoodRadius: food.radius,
          initialCellRadius: closestCell.radius,
          targetCellRadius: closestCell.radius * growthFactor,
          completed: false
        };
      }

    createPlayerConsumptionAnimation(predator, prey, duration, eatenPlayerStats) {
      return {
        id: this._generateId(),
        playerId: predator.id,
        eatenPlayerId: prey.id,
        startTime: Date.now(),
        duration: duration || 300,
        startPosition: { x: prey.x, y: prey.y },
        targetPosition: { x: predator.x, y: predator.y },
        initialEatenRadius: prey.radius,
        completed: false,
        eatenPlayerStats: eatenPlayerStats
      };
    }

    updateAnimations(consumingAnimations, players, foodItems) {
        const now = Date.now();
        const completedAnimations = [];
        
        consumingAnimations.forEach(animation => {
          const elapsed = now - animation.startTime;
          const progress = Math.min(1, elapsed / animation.duration);
          
          if (animation.eatenPlayerId) {
            const predator = players[animation.playerId];
            
            if (predator) {
              if (progress >= 1) {
                animation.completed = true;
                completedAnimations.push(animation);
              }
            } else {
              animation.completed = true;
              completedAnimations.push(animation);
            }
            return;
          }
      
          if (progress < 1) {
            const food = foodItems.find(f => f.id === animation.foodId);
            const player = players[animation.playerId];
            
            if (food && player) {
              const cell = player.cells.find(c => c.id === animation.cellId);
              
              if (cell) {
                food.x = animation.startPosition.x + (cell.x - animation.startPosition.x) * progress;
                food.y = animation.startPosition.y + (cell.y - animation.startPosition.y) * progress;
                food.radius = animation.initialFoodRadius * (1 - progress);
                
                cell.radius = animation.initialCellRadius + (animation.targetCellRadius - animation.initialCellRadius) * progress;
              } else {
                animation.completed = true;
                completedAnimations.push(animation);
              }
            } else {
              animation.completed = true;
              completedAnimations.push(animation);
            }
          } else {
            animation.completed = true;
            completedAnimations.push(animation);
            
            const player = players[animation.playerId];
            if (player && animation.foodId) {
              const cell = player.cells.find(c => c.id === animation.cellId);
              if (cell) {
                cell.radius = animation.targetCellRadius;
              }
              
              player.updateMainRadius();
              player.updateScore();
            }
          }
        });
        
        this._cleanupCompletedAnimations(completedAnimations, consumingAnimations, foodItems);
        
        return {
          players,
          foodItems,
          animations: consumingAnimations
        };
      }
  
    _cleanupCompletedAnimations(completedAnimations, consumingAnimations, foodItems) {
      completedAnimations.forEach(animation => {
        const animIndex = consumingAnimations.findIndex(a => a.id === animation.id);
        if (animIndex !== -1) {
          consumingAnimations.splice(animIndex, 1);
        }
        
        const foodIndex = foodItems.findIndex(f => f.id === animation.foodId);
        if (foodIndex !== -1) {
          foodItems.splice(foodIndex, 1);
        }
      });
    }
  
    _generateId() {
      return Date.now() + Math.random().toString(36).substr(2, 5);
    }
  }