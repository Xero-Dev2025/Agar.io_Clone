export function setupLoginForm(socket) {
    const loginForm = document.getElementById('loginForm');
    const loginOverlay = document.getElementById('loginOverlay');

    loginForm.addEventListener('submit', event => {
        event.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();
                
        socket.emit('setUsername', username);
            
        // Enleve le formulaire de connexion
        loginOverlay.style.display = 'none';
        // Enleve la classe login-active du body
        document.body.classList.remove('login-active');
    });
}
