export const GAME_CONFIG = {
    WIDTH: 2000,
    HEIGHT: 2000,
    
    PLAYER: {
      INITIAL_RADIUS: 30,
      GROWTH_FACTOR: 1.05,
      MAX_SCORE: 22500,
      SPEED: 5,
    },
    
    FOOD: {
      RADIUS: 10,
      MAX_COUNT: 1000,
      INITIAL_COUNT: 20,
      SPAWN_INTERVAL: 2000, 
      SPAWN_COUNT: 20
    },
    
    ANIMATION: {
      CONSUME_DURATION: 300, 
      GROWTH_DURATION: 300   
    },

    SCORE: {
      FOOD_VALUE: 10,
      PLAYER_VALUE: 100
    },

    BOT: {
      SPEED_MULTIPLIER: 1,  
      DECISION_INTERVAL: 300,  
      MOVE_INTERVAL: 16       
    },

    EJECT_MASS: {
      SPEED: 10,          
      FRICTION: 0.975     
  }
};