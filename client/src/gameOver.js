let statsAlreadySent = false;

export function showGameOver(stats = {}, username, socket) {
    const canvas = document.querySelector('.gameCanvas');
    const nameGame = document.querySelector('.nameGame');
    
    const gameOverUsername = document.querySelector('.gameOverUsername');
    const gameOverScore = document.querySelector('.gameOverScore');
    const gameOverHighScore = document.querySelector('.gameOverHighScore');
    const gameOverTimeAlive = document.querySelector('.gameOverTime');
    const gameOverPeopleEaten = document.querySelector('.gameOverPeopleEaten');
    const gameOverFoodEaten = document.querySelector('.gameOverFoodEaten');
  
    if (nameGame) nameGame.style.display = 'none';
    if (canvas) canvas.style.display = 'none';
    
    const gameOverScreen = document.querySelector('.gameOver');
    if (gameOverScreen) {
      gameOverScreen.style.display = 'block';
      
      if (gameOverUsername) gameOverUsername.textContent = username || 'Anonymous';
      if (gameOverScore) gameOverScore.textContent = stats.score || 0;
      if (gameOverHighScore) gameOverHighScore.textContent = stats.highScore || stats.score || 0;
      if (gameOverTimeAlive) gameOverTimeAlive.textContent = stats.timeAlive || 0;
      if (gameOverPeopleEaten) gameOverPeopleEaten.textContent = stats.playersEaten || 0;
      if (gameOverFoodEaten) gameOverFoodEaten.textContent = stats.foodEaten || 0;
    }
    
    if (socket && username && !statsAlreadySent) {
        console.log("Envoi des statistiques de fin de partie au serveur ...");
        socket.emit('gameOver', {
            username: username,
            stats: stats
        });
        statsAlreadySent = true;
    }
    
    const restartButton = document.querySelector('.restartButton');
    if (restartButton) {
      restartButton.onclick = () => {
        statsAlreadySent = false;
        window.location.reload();
      };
    }
}

export function resetGameOverState() {
    statsAlreadySent = false;
}