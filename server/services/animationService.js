export default class AnimationService {

    createFoodConsumptionAnimation(food, player, duration, growthFactor) {
      return {
        id: this._generateId(),
        foodId: food.id,
        playerId: player.id,
        startTime: Date.now(),
        duration: duration || 300,
        startPosition: { x: food.x, y: food.y },
        targetPosition: { x: player.x, y: player.y },
        initialFoodRadius: food.radius,
        initialPlayerRadius: player.radius,
        targetPlayerRadius: player.radius * growthFactor,
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
            food.x = animation.startPosition.x + (player.x - animation.startPosition.x) * progress;
            food.y = animation.startPosition.y + (player.y - animation.startPosition.y) * progress;
            
            food.radius = animation.initialFoodRadius * (1 - progress);
            
            player.radius = animation.initialPlayerRadius + 
                           (animation.targetPlayerRadius - animation.initialPlayerRadius) * progress;
          }
        } else {
          animation.completed = true;
          completedAnimations.push(animation);
          
          const player = players[animation.playerId];
          if (player && animation.foodId) {  
            player.radius = animation.targetPlayerRadius;
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