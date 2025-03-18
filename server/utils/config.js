export const GAME_CONFIG = {
    WIDTH: 2000,
    HEIGHT: 2000,
    
    PLAYER: {
      INITIAL_RADIUS: 30,
      GROWTH_FACTOR: 1.05,
      SPEED: 5
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
    }
};