import { v4 as uuidv4 } from 'uuid';

export default class BotService {
    constructor(gameConfig, playerService) {
      this.gameConfig = gameConfig;
      this.playerService = playerService;
      this.botIds = [];
      this.BOT_DECISION_INTERVAL = 300; 
      this.BOT_MOVE_INTERVAL = 16;       
      this.lastBotUpdate = {};
      this.lastBotMoveTime = {};
      this.BOT_PREFIX = "Bot_";
      this.botTargets = {}; 
      this.botNames = [
        "Gobeur", "Mangeur", "Rapide", "Malin", "Chasseur", 
        "Glouton", "Vorace", "Rusé", "Astucieux", "Affamé"
      ];
      this.botPersonalities = {};
    }

    initializeBots(players, foodItems, gameMap, count = 25) {
      console.log(`Initialisation de ${count} bots...`);
      
      for (let i = 0; i < count; i++) {
        const botId = `bot-${uuidv4()}`;
        
        this.botPersonalities[botId] = {
          aggressiveness: Math.random(),       
          foodFocus: Math.random() * 0.5 + 0.5, 
          splitChance: Math.random() * 0.5,     
          movementSmoothing: Math.random() * 0.3 + 0.1 
        };
        
        const botName = `${this.BOT_PREFIX}${this.botNames[Math.floor(Math.random() * this.botNames.length)]}`;
        
        let x, y, spawnPossible;
        
        do {
          spawnPossible = true;
          x = Math.random() * gameMap.width;
          y = Math.random() * gameMap.height;
          
          Object.values(players).forEach(player => {
            player.cells.forEach(cell => {
              const dx = x - cell.x;
              const dy = y - cell.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < cell.radius + 30) {
                spawnPossible = false;
              }
            });
          });
        } while (!spawnPossible);
        
        const socket = {
          id: botId,
          isBot: true
        };
        
        this.playerService.handleConnection(players, socket, gameMap);
        
        if (players[botId]) {
          players[botId].setUsername(botName);
          players[botId].isBot = true;
          players[botId].speed = this.gameConfig.PLAYER.SPEED; 
          this.botIds.push(botId);
          this.lastBotUpdate[botId] = Date.now();
          this.lastBotMoveTime[botId] = Date.now();
        }
      }
      
      console.log(`${this.botIds.length} bots initialisés`);
      return this.botIds;
    }

    updateSpecificBots(botIds, players, foodItems, gameMap) {
      const now = Date.now();
      
      botIds.forEach(botId => {
        if (!players[botId]) {
          this.cleanupBot(botId);
          return;
        }
        
        const bot = players[botId];
        if (!bot || bot.cells.length === 0) return;
        
        const personality = this.botPersonalities[botId] || {
          aggressiveness: 0.5,
          foodFocus: 0.7,
          splitChance: 0.2,
          movementSmoothing: 0.2
        };
        
        const decisionInterval = this.BOT_DECISION_INTERVAL;
        if (!this.botTargets[botId] || now - (this.lastBotUpdate[botId] || 0) >= decisionInterval) {
          const decision = this.makeDecision(botId, players, foodItems, gameMap);
          
          if (decision.action === 'move') {
            this.botTargets[botId] = decision.target;
          }
          else if (decision.action === 'split' && bot.cells.length < 4) {
            this.playerService.handlePlayerSplit(players, botId);
          }
          
          this.lastBotUpdate[botId] = now;
        }
        
        if (this.botTargets[botId]) {
          this.playerService.handlePlayerMove(players, botId, this.botTargets[botId], gameMap);
        }
      });
    }

    makeDecision(botId, players, foodItems, gameMap) {
      const bot = players[botId];
      if (!bot || bot.cells.length === 0) {
        return { action: 'none' };
      }
      
      const botPosition = this.getCenterPosition(bot);
      
      if (this.botTargets[botId]) {
        const target = this.botTargets[botId];
        const dx = target.x - botPosition.x;
        const dy = target.y - botPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 50) {
          return { action: 'move', target: this.botTargets[botId] };
        }
      }
      
      const potentialPreys = [];
      
      Object.values(players).forEach(player => {
        if (player.id === botId) return;
        
        player.cells.forEach(cell => {
          bot.cells.forEach(botCell => {
            if (botCell.radius > cell.radius * 1.25) {
              const dx = cell.x - botCell.x;
              const dy = cell.y - botCell.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 300) {
                potentialPreys.push({
                  x: cell.x,
                  y: cell.y,
                  radius: cell.radius,
                  distance: distance,
                  isPlayer: true
                });
              }
            }
          });
        });
      });
      
      const foodNearby = [];
      const foodToCheck = foodItems
          .filter(food => !food.isBeingConsumed)
          .slice(0, 50);
      
      for (const food of foodToCheck) {
        const dx = food.x - botPosition.x;
        const dy = food.y - botPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 500) {
          foodNearby.push({
            x: food.x,
            y: food.y,
            distance: distance
          });
        }
      }
      
      const personality = this.botPersonalities[botId];
      if (potentialPreys.length > 0 && bot.cells[0].radius > 40 && Math.random() < personality.aggressiveness) {
        potentialPreys.sort((a, b) => a.distance - b.distance);
        const closestPrey = potentialPreys[0];
        
        return {
          action: 'move',
          target: { x: closestPrey.x, y: closestPrey.y }
        };
      }
      
      if (foodNearby.length > 0) {
        if (personality && personality.foodFocus > 0.7 && foodNearby.length > 3) {
          const clusters = this._findFoodClusters(foodNearby, 100);
          clusters.sort((a, b) => (b.count / (b.distance || 1)) - (a.count / (a.distance || 1)));
          
          if (clusters.length > 0 && clusters[0].count >= 3) {
            return {
              action: 'move',
              target: { x: clusters[0].x, y: clusters[0].y }
            };
          }
        }
        
        foodNearby.sort((a, b) => a.distance - b.distance);
        const closestFood = foodNearby[0];
        
        return {
          action: 'move',
          target: { x: closestFood.x, y: closestFood.y }
        };
      }
      
      return {
        action: 'move',
        target: {
          x: Math.max(0, Math.min(gameMap.width, botPosition.x + (Math.random() * 300 - 150))),
          y: Math.max(0, Math.min(gameMap.height, botPosition.y + (Math.random() * 300 - 150)))
        }
      };
    }

    _findFoodClusters(foodItems, radius) {
      const clusters = [];
      const processedItems = new Set();
      
      for (const food of foodItems) {
        if (processedItems.has(food)) continue;
        processedItems.add(food);
        
        const cluster = {
          x: food.x,
          y: food.y,
          count: 1,
          totalX: food.x,
          totalY: food.y,
          distance: food.distance,
          items: [food]
        };
        
        for (const other of foodItems) {
          if (food === other || processedItems.has(other)) continue;
          
          const dx = food.x - other.x;
          const dy = food.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < radius) {
            cluster.count++;
            cluster.totalX += other.x;
            cluster.totalY += other.y;
            if (other.distance < cluster.distance) {
              cluster.distance = other.distance;
            }
            cluster.items.push(other);
            processedItems.add(other);
          }
        }
        
        if (cluster.count > 1) {
          cluster.x = cluster.totalX / cluster.count;
          cluster.y = cluster.totalY / cluster.count;
        }
        
        clusters.push(cluster);
      }
      
      return clusters;
    }

    getCenterPosition(bot) {
      const position = {x: 0, y: 0};
      bot.cells.forEach(cell => {
        position.x += cell.x;
        position.y += cell.y;
      });
      position.x /= bot.cells.length;
      position.y /= bot.cells.length;
      return position;
    }
    
    cleanupBot(botId) {
      this.botIds = this.botIds.filter(id => id !== botId);
      delete this.lastBotUpdate[botId];
      delete this.lastBotMoveTime[botId];
      delete this.botTargets[botId];
      delete this.botPersonalities[botId];
    }

    respawnBot(players, gameMap) {
      if (this.botIds.length >= 25) return; 
      
      const botId = `bot-${uuidv4()}`;
      const botName = `${this.BOT_PREFIX}${this.botNames[Math.floor(Math.random() * this.botNames.length)]}`;
      
      this.botPersonalities[botId] = {
        aggressiveness: Math.random(),
        foodFocus: Math.random() * 0.5 + 0.5,
        splitChance: Math.random() * 0.5,
        movementSmoothing: Math.random() * 0.3 + 0.1
      };
      
      let x, y, spawnPossible;
      do {
        spawnPossible = true;
        x = Math.random() * gameMap.width;
        y = Math.random() * gameMap.height;
        
        Object.values(players).forEach(player => {
          player.cells.forEach(cell => {
            const dx = x - cell.x;
            const dy = y - cell.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < cell.radius + 30) {
              spawnPossible = false;
            }
          });
        });
      } while (!spawnPossible);
      
      const socket = {
        id: botId,
        isBot: true
      };
      
      this.playerService.handleConnection(players, socket, gameMap);
      
      if (players[botId]) {
        players[botId].setUsername(botName);
        players[botId].isBot = true;
        players[botId].speed = this.gameConfig.PLAYER.SPEED;
        this.botIds.push(botId);
        this.lastBotUpdate[botId] = Date.now();
        this.lastBotMoveTime[botId] = Date.now();
      }
      
      console.log(`Bot respawned: ${botName}`);
      return botId;
    }


    updateSpecificBots(botIds, players, foodItems, gameMap) {
      const now = Date.now();
      
      this.lastBotMoveTime = this.lastBotMoveTime || {};
      
      botIds.forEach(botId => {
          if (!players[botId]) {
              this.cleanupBot(botId);
              return;
          }
          
          const bot = players[botId];
          if (!bot || bot.cells.length === 0) return;
          
          const personality = this.botPersonalities[botId] || {
              aggressiveness: 0.5,
              foodFocus: 0.7,
              splitChance: 0.2,
              movementSmoothing: 0.2
          };
          
          const decisionInterval = this.BOT_DECISION_INTERVAL * (1 + personality.movementSmoothing);
          if (!this.botTargets[botId] || now - (this.lastBotUpdate[botId] || 0) >= decisionInterval) {
              const decision = this.makeDecision(botId, players, foodItems, gameMap);
              
              if (decision.action === 'move') {
                  this.botTargets[botId] = decision.target;
              }
              else if (decision.action === 'split' && bot.cells.length < 4) {
                  this.playerService.handlePlayerSplit(players, botId);
              }
              
              this.lastBotUpdate[botId] = now;
          }
          
          if (this.botTargets[botId] && now - (this.lastBotMoveTime[botId] || 0) >= this.BOT_MOVE_INTERVAL) {
              this.playerService.handlePlayerMove(players, botId, this.botTargets[botId], gameMap);
              this.lastBotMoveTime[botId] = now;
          }
      });
  }
}