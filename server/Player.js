export default class Player {
    id;
    x;
    y;
    radius;
    color;
    speed;
    stats;
    creationTime;

    constructor(id, x, y, radius, color, speed) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.creationTime = Date.now();
        
        this.stats = {
            score: 0,
            highScore: 0,
            timeAlive: 0,
            playersEaten: 0,
            foodEaten: 0
        };
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
    }

    growPlayer(growthFactor) {
        this.radius *= growthFactor;
        this.updateScore();
    }

    updateStats() {
        this.updateScore();
        this.updateTimeAlive();
    }
    
    updateScore() {
        const newScore = Math.floor(this.radius * 10);
        this.stats.score = newScore;
        
        if (newScore > this.stats.highScore) {
            this.stats.highScore = newScore;
        }
    }
    
    updateTimeAlive() {
        if (this.creationTime) {
            const currentTime = Date.now();
            const seconds = Math.floor((currentTime - this.creationTime) / 1000);
            this.stats.timeAlive = seconds;
        }
    }
    
    incrementPlayersEaten() {
        this.stats.playersEaten += 1;
        console.log(`Player ${this.id} has eaten ${this.stats.playersEaten} players`);
    }
    
    incrementFoodEaten() {
        this.stats.foodEaten += 1;
    }
}