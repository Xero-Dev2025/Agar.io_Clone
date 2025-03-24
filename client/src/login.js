export function setupLoginForm(socket) {    
    const loginOverlay = document.getElementById('loginOverlay');
    const profileOverlay = document.getElementById('profileOverlay');
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const guestForm = document.getElementById('guestForm');
    
    const showLoginBtn = document.getElementById('showLoginForm');
    const showRegisterBtn = document.getElementById('showRegisterForm');
    
    const session = JSON.parse(localStorage.getItem('userSession'));
    if (session && session.username && session.authenticated) {
        displayProfile(session, socket);
        return;
    }
    
    showLoginBtn.addEventListener('click', event => {
        event.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
    });
    
    showRegisterBtn.addEventListener('click', event => {
        event.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        showLoginBtn.classList.remove('active');
        showRegisterBtn.classList.add('active');
    });
    
    loginForm.addEventListener('submit', event => {
        event.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        socket.emit('login', { username, password }, (resp) => {
            if (resp.success) {
                const sessionData = {
                    username: username,
                    authenticated: true
                };
                
                localStorage.setItem('userSession', JSON.stringify(sessionData));
                socket.emit('setUsername', username);
                
                displayProfile(resp, socket);
            } else {
                showNotification(resp.message);
            }
        });
    });
    
    registerForm.addEventListener('submit', event => {
        event.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        
        socket.emit('register', { username, password }, (resp) => {
            if (resp.success) {
                showNotification('Registration successful. Please log in.', 'success');
                
                showLoginBtn.click();
            } else {
                showNotification(resp.message);
            }
        });
    });
    
    guestForm.addEventListener('submit', event => {
        event.preventDefault();
        
        const username = document.getElementById('guestUsername').value.trim();
        
        socket.emit('setUsername', username);
        
        loginOverlay.style.display = 'none';
        document.body.classList.remove('login-active');
    });
    
    function displayProfile(response, socket) {
        document.getElementById('authForms').style.display = 'none';
        
        profileOverlay.style.display = 'flex';
        profileOverlay.style.justifyContent = 'center';
        profileOverlay.style.alignItems = 'center';
        
        const username = response.username || (session && session.username);
        document.getElementById('profileUsername').textContent = username;
        
        socket.emit('getPlayerStats', username, (stats) => {
            if (stats) {
                updateProfileStats(stats);
            } else if (response.stats) {
                updateProfileStats(response.stats);
            }
        });
        
        setupProfileButtons(username, socket);
    }
    
    function updateProfileStats(stats) {
        // Game Records
        document.getElementById('profileHighScore').textContent = stats.highScore;
        document.getElementById('profileGamesPlayed').textContent = stats.gamesPlayed;
        document.getElementById('profileLongestTimeAlive').textContent = stats.longestTimeAlive;
        
        // Career Totals
        document.getElementById('profilePlayersEaten').textContent = stats.totalPlayersEaten;
        document.getElementById('profileFoodEaten').textContent = stats.totalFoodEaten;
        document.getElementById('profileTotalTimeAlive').textContent = stats.totalTimeAlive;
        document.getElementById('profileTotalScore').textContent = stats.totalScore;
    }
    
    function setupProfileButtons(username, socket) {
        document.getElementById('playButton').addEventListener('click', () => {
            socket.emit('setUsername', username);
            loginOverlay.style.display = 'none';
            document.body.classList.remove('login-active');
        });
        
        document.getElementById('logoutButton').addEventListener('click', () => {
            localStorage.removeItem('userSession');
            window.location.reload();
        });
    }
}

function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification-box');
    notification.className = 'notification';
    notification.classList.add(type);
    notification.textContent = message;
    
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}