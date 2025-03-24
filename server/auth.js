import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function usersDirectoryExists() {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function loadUsers() {
    usersDirectoryExists();
    
    if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
    }

    return {};
}

function saveUsers(users) {
    usersDirectoryExists();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}


function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function registerUser(username, password) {
    const users = loadUsers();
    
    if (users[username]) {
        return {
            success: false,
            message: 'Username already taken'
        };
    }
    
    const hashedPassword = hashPassword(password);
    users[username] = {
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        stats: {
            highScore: 0,
            totalScore: 0,
            gamesPlayed: 0,
            totalTimeAlive: 0,
            totalPlayersEaten: 0,
            totalFoodEaten: 0,
            longestTimeAlive: 0
        }
    };
    
    saveUsers(users);
    
    return {
        success: true,
        message: 'Registration successful'
    };
}

function authenticateUser(username, password) {
    const users = loadUsers();
    
    if (!users[username]) {
        return {
            success: false,
            message: 'User not found'
        };
    }
    
    const hashedPassword = hashPassword(password);
    if (users[username].password !== hashedPassword) {
        return {
            success: false,
            message: 'Invalid password'
        };
    }
    
    return {
        success: true,
        message: 'Authentication successful'
    };
}

function updateUserStats(username, gameStats) {    
    const users = loadUsers();
    
    if (!users[username]) {
        console.log(`Joueur ${username} non trouvé`);
        return false;
    }
    
    const userStats = users[username].stats;
    
    userStats.highScore = Math.max(userStats.highScore, gameStats.highScore);
    userStats.totalScore += gameStats.score;
    userStats.gamesPlayed += 1;
    userStats.totalTimeAlive += gameStats.timeAlive;
    userStats.totalPlayersEaten += gameStats.playersEaten;
    userStats.totalFoodEaten += gameStats.foodEaten;
    userStats.longestTimeAlive = Math.max(userStats.longestTimeAlive, gameStats.timeAlive);
    
    users[username].stats = userStats;
    saveUsers(users);
    console.log(`Statistiques mise à jour pour ${username}`);
    return true;
}

function getUserStats(username) {    
    const users = loadUsers();
    
    if (!users[username]) {
        return null;
    }
    
    return users[username].stats;
}

export default {
    registerUser,
    authenticateUser,
    updateUserStats,
    getUserStats
};
