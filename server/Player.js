import { GAME_CONFIG } from './utils/config.js';

export default class Player {
    id
    x;
    y;
    radius;
    color;
    speed;

    constructor(id, x, y, radius, color, speed) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
    }

    moveTowards(targetX, targetY) {
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.speed) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        } else {
            this.x = targetX;
            this.y = targetY;
        }
        

        /*
        // Calculer le vecteur de direction depuis le centre du canvas
        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;
        
        // Calculer la direction en fonction de la position de la souris par rapport au centre
        const dx = targetX.x - centerX;
        const dy = targetY.y - centerY;
        
        // Vecteur de direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const directionX = dx / distance;
            const directionY = dy / distance;
            
            // Appliquer le mouvement en fonction de la direction et de la vitesse
            this.x += directionX * this.speed;
            this.y += directionY * this.speed;
        }
        */
    }

    growPlayer(growthFactor) {
          this.radius *= growthFactor;
      }
}