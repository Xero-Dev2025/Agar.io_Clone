import { v4 as uuidv4 } from 'uuid';

export default class BotService {
    constructor(gameConfig, playerService) {
      this.gameConfig = gameConfig;
      this.playerService = playerService;
      this.botIds = [];
      this.BOT_DECISION_INTERVAL = 300;  // 300ms entre les décisions
      this.BOT_MOVE_INTERVAL = 16;
      this.botCurrentPositions = {}; // Positions actuelles des bots
      this.botTargetPositions = {};
      this.lastBotUpdate = {};
      this.BOT_PREFIX = "Bot_";
      this.botTargets = {}; // Stockage des cibles actuelles des bots
      this.botNames = [
        "Gobeur", "Mangeur", "Rapide", "Malin", "Chasseur", 
        "Glouton", "Vorace", "Rusé", "Astucieux", "Affamé"
      ];
      this.botPersonalities = {}; // Personnalités des bots
    }

    initializeBots(players, foodItems, gameMap, count = 25) {
      console.log(`Initialisation de ${count} bots...`);
      
      for (let i = 0; i < count; i++) {
        const botId = `bot-${uuidv4()}`;
        
        // Chaque bot a une personnalité unique
        this.botPersonalities[botId] = {
          aggressiveness: Math.random(),         // 0 = prudent, 1 = agressif
          foodFocus: Math.random() * 0.5 + 0.5,  // 0.5-1 = préférence pour la nourriture
          splitChance: Math.random() * 0.5,      // Probabilité de se diviser
          movementSmoothing: Math.random() * 0.3 + 0.1  // Pour des mouvements plus naturels
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
          // Vitesse variable selon la personnalité du bot
          players[botId].speed = this.gameConfig.PLAYER.SPEED * (this.gameConfig.BOT?.SPEED_MULTIPLIER || 1.3);
          this.botIds.push(botId);
          this.lastBotUpdate[botId] = Date.now();
        }
      }
      
      console.log(`${this.botIds.length} bots initialisés`);
      return this.botIds;
    }

    updateBots(players, foodItems, gameMap) {
        const now = Date.now();
        
        this.botIds.forEach(botId => {
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
            if (!this.botTargets[botId] || now - this.lastBotUpdate[botId] >= decisionInterval) {
                const decision = this.makeDecision(botId, players, foodItems, gameMap);
                
                if (decision.action === 'move') {
                    this.botTargets[botId] = decision.target;
                    
                    if (!this.botCurrentPositions[botId]) {
                        this.botCurrentPositions[botId] = this.getCenterPosition(bot);
                    } else {
                        this.botCurrentPositions[botId] = {...this.getCenterPosition(bot)};
                    }
                    
                    this.botTargetPositions[botId] = {...decision.target};
                }
                else if (decision.action === 'split' && bot.cells.length < 4) {
                    this.playerService.handlePlayerSplit(players, botId);
                }
                
                this.lastBotUpdate[botId] = now;
                this.lastBotMoveTime[botId] = now;
            }
            
            if (this.botTargets[botId] && now - this.lastBotMoveTime[botId] >= this.BOT_MOVE_INTERVAL) {
                if (this.botCurrentPositions[botId] && this.botTargetPositions[botId]) {
                    const current = this.botCurrentPositions[botId];
                    const target = this.botTargetPositions[botId];
                    
                    const elapsedTime = now - this.lastBotMoveTime[botId];
                    const moveRatio = elapsedTime / 1000; 
                    const smoothFactor = 0.2 + personality.movementSmoothing * 0.2;
                    
                    const intermediatePos = {
                        x: current.x + (target.x - current.x) * moveRatio * smoothFactor * 20, // Augmenter de 10->20
                        y: current.y + (target.y - current.y) * moveRatio * smoothFactor * 20
                    };
                    this.botCurrentPositions[botId] = intermediatePos;
                    
                    this.playerService.handlePlayerMove(players, botId, intermediatePos, gameMap);
                    this.lastBotMoveTime[botId] = now;
                } else {
                    this.playerService.handlePlayerMove(players, botId, this.botTargets[botId], gameMap);
                    this.lastBotMoveTime[botId] = now;
                }
            }
        });
    }

    makeDecision(botId, players, foodItems, gameMap) {
        const bot = players[botId];
        if (!bot || bot.cells.length === 0) {
          return { action: 'none' };
        }
        
        // Position moyenne du bot
        const botPosition = this.getCenterPosition(bot);
        
        // 1. Détecter des proies potentielles (autres bots plus petits)
        const potentialPreys = [];
        
        Object.values(players).forEach(player => {
          if (player.id === botId) return; // Ne pas se cibler soi-même
          
          player.cells.forEach(cell => {
            bot.cells.forEach(botCell => {
              // Si bot est 25% plus grand, il peut manger
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
        
        // 2. Chercher de la nourriture classique
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
        
        // Priorité: d'abord les autres joueurs si assez gros
        if (potentialPreys.length > 0 && bot.cells[0].radius > 40) {
          potentialPreys.sort((a, b) => a.distance - b.distance);
          const closestPrey = potentialPreys[0];
          
          return {
            action: 'move',
            target: { x: closestPrey.x, y: closestPrey.y }
          };
        }
        
        // Ensuite, la nourriture la plus proche
        if (foodNearby.length > 0) {
          foodNearby.sort((a, b) => a.distance - b.distance);
          const closestFood = foodNearby[0];
          
          return {
            action: 'move',
            target: { x: closestFood.x, y: closestFood.y }
          };
        }
        
        // Mouvement aléatoire si rien d'intéressant
        return {
          action: 'move',
          target: {
            x: Math.max(0, Math.min(gameMap.width, botPosition.x + (Math.random() * 300 - 150))),
            y: Math.max(0, Math.min(gameMap.height, botPosition.y + (Math.random() * 300 - 150)))
          }
        };
      }
    
    // Trouve des clusters (groupes) de nourriture pour un comportement plus intelligent
    _findFoodClusters(foodItems, radius) {
      const clusters = [];
      const processedItems = new Set();
      
      // Pour chaque élément de nourriture
      for (const food of foodItems) {
        if (processedItems.has(food)) continue;
        processedItems.add(food);
        
        // Créer un nouveau cluster
        const cluster = {
          x: food.x,
          y: food.y,
          count: 1,
          totalX: food.x,
          totalY: food.y,
          distance: food.distance,
          items: [food]
        };
        
        // Trouver tous les éléments proches
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
        
        // Calculer le centre du cluster
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
        delete this.botCurrentPositions[botId];
        delete this.botTargetPositions[botId];
        delete this.botPersonalities[botId];
    }

    respawnBot(players, gameMap) {
      if (this.botIds.length >= 25) return; 
      
      const botId = `bot-${uuidv4()}`;
      const botName = `${this.BOT_PREFIX}${this.botNames[Math.floor(Math.random() * this.botNames.length)]}`;
      
      // Créer une nouvelle personnalité pour le bot
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
        // Vitesse variable selon la personnalité
        const personality = this.botPersonalities[botId];
        players[botId].speed = this.gameConfig.PLAYER.SPEED * (this.gameConfig.BOT?.SPEED_MULTIPLIER || 1.3);
        this.botIds.push(botId);
        this.lastBotUpdate[botId] = Date.now();
      }
      
      console.log(`Bot respawned: ${botName}`);
      return botId;
    }

    updateSpecificBots(botIds, players, foodItems, gameMap) {
        const now = Date.now();
        
        // S'assurer que lastBotMoveTime existe
        this.lastBotMoveTime = this.lastBotMoveTime || {};
        
        botIds.forEach(botId => {
            // Vérifier si le bot existe toujours
            if (!players[botId]) {
                this.cleanupBot(botId);
                return;
            }
            
            const bot = players[botId];
            if (!bot || bot.cells.length === 0) return;
            
            // Récupérer la personnalité du bot ou utiliser une par défaut
            const personality = this.botPersonalities[botId] || {
                aggressiveness: 0.5,
                foodFocus: 0.7,
                splitChance: 0.2,
                movementSmoothing: 0.2
            };
            
            // 1. Prendre une décision si nécessaire (moins fréquent)
            const decisionInterval = this.BOT_DECISION_INTERVAL * (1 + personality.movementSmoothing);
            if (!this.botTargets[botId] || now - (this.lastBotUpdate[botId] || 0) >= decisionInterval) {
                const decision = this.makeDecision(botId, players, foodItems, gameMap);
                
                if (decision.action === 'move') {
                    this.botTargets[botId] = decision.target;
                    
                    // Initialiser ou mettre à jour la position actuelle
                    if (!this.botCurrentPositions[botId]) {
                        this.botCurrentPositions[botId] = this.getCenterPosition(bot);
                    } else {
                        this.botCurrentPositions[botId] = {...this.getCenterPosition(bot)};
                    }
                    
                    // Mettre à jour la position cible
                    this.botTargetPositions[botId] = {...decision.target};
                }
                else if (decision.action === 'split' && bot.cells.length < 4) {
                    this.playerService.handlePlayerSplit(players, botId);
                }
                
                this.lastBotUpdate[botId] = now;
                this.lastBotMoveTime[botId] = now;
            }
            
            // 2. Déplacer le bot vers sa cible (plus fréquent)
            if (this.botTargets[botId] && now - (this.lastBotMoveTime[botId] || 0) >= this.BOT_MOVE_INTERVAL) {
                if (this.botCurrentPositions[botId] && this.botTargetPositions[botId]) {
                    // Interpolation linéaire pour un mouvement fluide
                    const current = this.botCurrentPositions[botId];
                    const target = this.botTargetPositions[botId];
                    
                    // Calcul du pas de mouvement basé sur le temps écoulé
                    const elapsedTime = now - (this.lastBotMoveTime[botId] || now);
                    const moveRatio = elapsedTime / 1000; // Basé sur une seconde
                    const smoothFactor = 0.05 + personality.movementSmoothing * 0.1;
                    
                    // Position intermédiaire pour un mouvement plus fluide
                    const intermediatePos = {
                        x: current.x + (target.x - current.x) * moveRatio * smoothFactor * 10,
                        y: current.y + (target.y - current.y) * moveRatio * smoothFactor * 10
                    };
                    
                    // Mettre à jour la position actuelle
                    this.botCurrentPositions[botId] = intermediatePos;
                    
                    // Déplacer le bot
                    this.playerService.handlePlayerMove(players, botId, intermediatePos, gameMap);
                    this.lastBotMoveTime[botId] = now;
                } else {
                    // Fallback si les positions ne sont pas définies
                    this.playerService.handlePlayerMove(players, botId, this.botTargets[botId], gameMap);
                    this.lastBotMoveTime[botId] = now;
                }
            }
        });
    }
}