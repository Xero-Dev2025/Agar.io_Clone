export default class Player {
    id;
    cells = []; 
    color;
    speed;
    stats;
    creationTime;
    username;

    constructor(id, x, y, radius, color, speed, username = 'Anonymous') {
        this.id = id;
        this.color = color;
        this.speed = speed;
        this.username = username;
        this.creationTime = Date.now();
        
        this.cells.push({
            id: `${id}_0`,
            x: x,
            y: y,
            radius: radius,
            velocityX: 0,
            velocityY: 0,
            splitTime: 0
        });

        this.x = x;
        this.y = y;
        this.radius = radius;

        this.stats = {
            score: 0,
            highScore: 0,
            timeAlive: 0,
            playersEaten: 0,
            foodEaten: 0,
        };
    }

	moveTowards(targetX, targetY, speedMultiplier = 1) {
		this.cells.forEach((cell, index) => {
			const dx = targetX - cell.x;
			const dy = targetY - cell.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			
			if (distance > 0) {
				const speedFactor = Math.max(0.3, 50 / cell.radius);
				const adjustedSpeed = this.speed * speedFactor * speedMultiplier;
				
				if (distance > adjustedSpeed) {
					cell.x += (dx / distance) * adjustedSpeed;
					cell.y += (dy / distance) * adjustedSpeed;
				} else {
					cell.x = targetX;
					cell.y = targetY;
				}
			}
			
			if (index === 0) {
				this.x = cell.x;
				this.y = cell.y;
			}
		});
		
		this.updateMainRadius();
	}
    
	handleCellCollisions(isInitialSplit = false) {
		const now = Date.now();
		
		for (let i = 0; i < this.cells.length; i++) {
			const cell1 = this.cells[i];
			
			const timeElapsed = now - cell1.splitTime;
			if (timeElapsed < 1000 && !isInitialSplit) {
				cell1.x += cell1.velocityX;
				cell1.y += cell1.velocityY;
				
				cell1.velocityX *= 0.9;
				cell1.velocityY *= 0.9;
				
				if (Math.abs(cell1.velocityX) < 0.1) cell1.velocityX = 0;
				if (Math.abs(cell1.velocityY) < 0.1) cell1.velocityY = 0;
				
				continue;
			}
			
			for (let j = i + 1; j < this.cells.length; j++) {
				const cell2 = this.cells[j];
				
				const timeElapsed2 = now - cell2.splitTime;
				if (timeElapsed2 < 1000 && !isInitialSplit) continue;
				
				const dx = cell2.x - cell1.x;
				const dy = cell2.y - cell1.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const minDistance = cell1.radius + cell2.radius;
				
				const cell1MergeTime = now - cell1.splitTime;
				const cell2MergeTime = now - cell2.splitTime;
				const canMerge = cell1MergeTime >= 15000 && cell2MergeTime >= 15000;
				
				if (distance < minDistance && !canMerge) {
					const overlap = minDistance - distance;
					const angle = Math.atan2(dy, dx);
					
					const forceFactor = isInitialSplit ? 0.8 : 0.5;
					
					const adjustRatio1 = cell2.radius / (cell1.radius + cell2.radius);
					const adjustRatio2 = cell1.radius / (cell1.radius + cell2.radius);
					
					cell1.x -= Math.cos(angle) * overlap * adjustRatio1 * forceFactor;
					cell1.y -= Math.sin(angle) * overlap * adjustRatio1 * forceFactor;
					
					cell2.x += Math.cos(angle) * overlap * adjustRatio2 * forceFactor;
					cell2.y += Math.sin(angle) * overlap * adjustRatio2 * forceFactor;
				}
			}
		}
		
		this.updateMainRadius();
	}
    updateMainRadius() {
        const totalArea = this.cells.reduce((sum, cell) => {
            return sum + Math.PI * cell.radius * cell.radius;
        }, 0);
        this.radius = Math.sqrt(totalArea / Math.PI);
    }

	split() {
		const newCells = [];
		const now = Date.now();
		
		if (this.cells.length >= 8) return false;
		
		this.cells.forEach(cell => {
			if (cell.radius >= 40) {  
				const newRadius = cell.radius / Math.sqrt(2);
				cell.radius = newRadius;
				
				let angle;
				if (this.targetX !== undefined && this.targetY !== undefined) {
					const dx = this.targetX - cell.x;
					const dy = this.targetY - cell.y;
					angle = Math.atan2(dy, dx);
				} else {
					angle = Math.random() * Math.PI * 2;
				}
				
				const ejectionSpeed = 12;
				
				const initialOffset = newRadius * 0.1; 
				const newCell = {
					id: `${this.id}_${this.cells.length + newCells.length}`,
					x: cell.x + Math.cos(angle) * initialOffset,
					y: cell.y + Math.sin(angle) * initialOffset,
					radius: newRadius,
					velocityX: Math.cos(angle) * ejectionSpeed,
					velocityY: Math.sin(angle) * ejectionSpeed,
					splitTime: now,
					lastCollisionCheck: now
				};
				
				newCells.push(newCell);
			}
		});
		
		this.cells = this.cells.concat(newCells);
		
		if (newCells.length > 0) {
			this.handleCellCollisions(true); 
		}
		
		return newCells.length > 0;
	}
    
    mergeCheck() {
		const now = Date.now();
		const mergedCells = [];
		const MERGE_TIME = 15000; 
		
		for (let i = 0; i < this.cells.length; i++) {
			const cell1 = this.cells[i];
			
			if (mergedCells.includes(cell1.id)) continue;
			
			if (now - cell1.splitTime < MERGE_TIME) continue;
			
			for (let j = i + 1; j < this.cells.length; j++) {
				const cell2 = this.cells[j];
				
				if (mergedCells.includes(cell2.id)) continue;
				
				if (now - cell2.splitTime < MERGE_TIME) continue;
				
				const dx = cell1.x - cell2.x;
				const dy = cell1.y - cell2.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				
				if (distance < cell1.radius + cell2.radius * 0.5) {
					const area1 = Math.PI * cell1.radius * cell1.radius;
					const area2 = Math.PI * cell2.radius * cell2.radius;
					const totalArea = area1 + area2;
					const newRadius = Math.sqrt(totalArea / Math.PI);
					
					cell1.radius = newRadius;
					
					cell1.x = (cell1.x * area1 + cell2.x * area2) / totalArea;
					cell1.y = (cell1.y * area1 + cell2.y * area2) / totalArea;
					
					mergedCells.push(cell2.id);
				}
			}
		}
		
		if (mergedCells.length > 0) {
			this.cells = this.cells.filter(cell => !mergedCells.includes(cell.id));
			return true;
		}
		
		return false;
	}

    growPlayer(growthFactor) {
        this.cells.forEach(cell => {
            cell.radius *= growthFactor;
        });
        this.updateMainRadius();
        this.updateScore();
    }

    updateStats() {
        this.updateScore();
        this.updateTimeAlive();
    }

	updateScore() {
		let totalArea = 0;
		this.cells.forEach(cell => {
			totalArea += Math.PI * cell.radius * cell.radius;
		});
		
		const newScore = Math.floor(totalArea / 10);
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
    }

    incrementFoodEaten() {
        this.stats.foodEaten += 1;
    }

    setUsername(username) {
        this.username = username;
    }
    
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    getAllStats() {
        return {
            score: this.stats.score,
            highScore: this.stats.highScore,
            timeAlive: this.stats.timeAlive,
            playersEaten: this.stats.playersEaten,
            foodEaten: this.stats.foodEaten,
        };
    }
}