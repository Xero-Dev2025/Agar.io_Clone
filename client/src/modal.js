export function setupModals() {
    const modalOverlay = document.querySelector('.modalOverlay');
    const modalContainer = document.getElementById('modalContainer');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalCloseBtn = document.getElementById('modalClose');
    const modalCloseFooterBtn = document.getElementById('modalCloseBtn');
  
    const controlsBox = document.querySelector('.settings-box');
    const creditsBox = document.querySelector('.credits-box');
    const rulesBox = document.querySelector('.rules-box');
    const achievementsBox = document.querySelector('.achievements-box');
    
    [controlsBox, creditsBox, rulesBox, achievementsBox].forEach(box => {
      if (box) {
        box.style.cursor = 'pointer';
        
        box.addEventListener('mouseover', () => {
          box.style.boxShadow = '0 0 15px rgba(33, 33, 255, 0.6)';
          box.style.backgroundColor = '#050510';
        });
        
        box.addEventListener('mouseout', () => {
          box.style.boxShadow = ''; 
          box.style.backgroundColor = '';
        });
      }
    });
    
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        closeModal(modalOverlay, modalContainer);
      });
    }
    
    if (modalCloseFooterBtn) {
      modalCloseFooterBtn.addEventListener('click', () => {
        closeModal(modalOverlay, modalContainer);
      });
    }
  
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        closeModal(modalOverlay, modalContainer);
      }
    });
    
    if (controlsBox) {
      controlsBox.addEventListener('click', () => {
        showModal('Controls', getControlsContent(), modalOverlay, modalContainer, modalTitle, modalContent);
      });
    }
    
    if (creditsBox) {
      creditsBox.addEventListener('click', () => {
        showModal('Credits', getCreditsContent(), modalOverlay, modalContainer, modalTitle, modalContent);
      });
    }
    
    if (rulesBox) {
      rulesBox.addEventListener('click', () => {
        showModal('Game Rules', getRulesContent(), modalOverlay, modalContainer, modalTitle, modalContent);
      });
    }
    
    if (achievementsBox) {
      achievementsBox.addEventListener('click', () => {
        showModal('Achievements', getAchievementsContent(), modalOverlay, modalContainer, modalTitle, modalContent);
      });
    }
  }
  
  function closeModal(overlay, container) {
    container.style.opacity = '0';
    container.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      overlay.style.display = 'none';
      container.style.transform = '';
    }, 300);
  }
  
  function showModal(title, content, overlay, container, titleElement, contentElement) {
    titleElement.textContent = title;
    contentElement.innerHTML = content;
    overlay.style.display = 'flex';
    
    container.style.opacity = '0';
    container.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 10);
  }
  
  function getControlsContent() {
    return `
      <div class="modal-section">
        <h3>Basic Controls</h3>
        <div class="modal-controls">
          <div class="control-detail">
            <div class="control-key">Mouse</div>
            <div class="control-desc">Move your cell in the direction of your cursor. The further your cursor is from your cell, the faster it moves.</div>
          </div>
          <div class="control-detail">
            <div class="control-key">Space</div>
            <div class="control-desc">Split your cell into two equal halves. This allows you to quickly catch smaller players. Your cells will recombine after a period of time.</div>
          </div>
          <div class="control-detail">
            <div class="control-key">W</div>
            <div class="control-desc">Eject mass from your cell. This reduces your size slightly but can be used tactically to feed teammates or bait enemies.</div>
          </div>
        </div>
      </div>
      
      <div class="modal-section">
        <h3>Advanced Techniques</h3>
        <ul class="advanced-controls">
          <li>
            <strong>Splitting:</strong> Use split strategically to quickly catch smaller cells that are escaping. Be careful not to split when larger predators are nearby!
          </li>
          <li>
            <strong>Cornering:</strong> Try to trap smaller players against the borders of the map. This prevents them from escaping and makes them easier to catch.
          </li>
          <li>
            <strong>Baiting:</strong> Sometimes ejecting a bit of mass can attract smaller players who think they're getting free food. Once they come close enough, you can quickly eat them.
          </li>
          <li>
            <strong>Hiding:</strong> When you're small and being chased, try to navigate between virus obstacles to escape larger predators.
          </li>
        </ul>
      </div>
    `;
  }
  
  function getCreditsContent() {
    return `
      <div class="modal-section">
        <h3>Game Development Team</h3>
        <div class="credits-team">
          <div class="team-member">
            <h4>JSAÉ Team</h4>
            <p>Made by :</p>
            <ul class="inspiration-list">
                <li><strong>Antoine Domisse, Groupe I, Hokle, League of Legend, 100%</strong</li>
                <li><strong>Atilla Tas, Groupe I, PoA, Final Fantasy, 100%</strong></li>
                <li><strong>Kellian Mirey, Groupe I, Stazz, Minecraft, 100%</strong></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="modal-section">
        <h3>Inspiration & Acknowledgments</h3>
        <p>This game draws inspiration from popular titles like:</p>
        <ul class="inspiration-list">
          <li><strong>Agar.io</strong> - For the cell-eating and growth mechanics</li>
          <li><strong>Pac-Man</strong> - For the maze navigation and food collection concept</li>
        </ul>
      </div>
      
      <div class="modal-section">
        <h3>Technologies Used</h3>
        <div class="tech-stack">
          <div class="tech-item">
            <strong>Frontend:</strong> HTML5, CSS3, JavaScript (ES6+)
          </div>
          <div class="tech-item">
            <strong>Backend:</strong> Node.js, Express
          </div>
          <div class="tech-item">
            <strong>Networking:</strong> Socket.io for real-time communication
          </div>
        </div>
      </div>
    `;
  }
  
  function getRulesContent() {
    return `
      <div class="modal-section">
        <h3>Basic Rules</h3>
        <ul class="rules-list">
          <li>Move your cell with the mouse to navigate around the game world.</li>
          <li>Consume food dots scattered around the map to grow larger.</li>
          <li>You can eat players smaller than you (approximately 30% smaller).</li>
          <li>Beware of larger players who can consume you!</li>
          <li>The game continues until you are eaten by another player.</li>
        </ul>
      </div>
      
      <div class="modal-section">
        <h3>Gameplay Mechanics</h3>
        <div class="mechanics">
          <div class="mechanic-item">
            <h4>Size & Speed</h4>
            <p>As you grow larger by consuming food and other players, your movement speed decreases. This creates a balance where smaller players can escape from larger ones.</p>
          </div>
          <div class="mechanic-item">
            <h4>Splitting</h4>
            <p>Press Space to split your cell into two equal parts. This allows for quick movements to catch other players. Your cells will automatically recombine after some time.</p>
          </div>
          <div class="mechanic-item">
            <h4>Mass Ejection</h4>
            <p>Press W to eject a small portion of your mass. This can be used tactically to feed teammates or to bait other players.</p>
          </div>
        </div>
      </div>
      
      <div class="modal-section">
        <h3>Scoring</h3>
        <p>Your score is based on the size of your cell. The larger you grow, the higher your score.</p>
        <p>The leaderboard displays the top players in the current game session.</p>
        <p>When you are eaten, your final score and stats are recorded.</p>
      </div>
    `;
  }
  
  function getAchievementsContent() {
    return `
      <div class="modal-section">
        <h3>Beginner Achievements</h3>
        <div class="achievements-grid">
          <div class="achievement-card">
            <div class="achievement-title">Hungry Beginner</div>
            <div class="achievement-desc">Eat 10 food items in a single game</div>
            <div class="achievement-reward">Reward: Special color unlocked</div>
          </div>
          <div class="achievement-card">
            <div class="achievement-title">First Blood</div>
            <div class="achievement-desc">Eat your first player</div>
            <div class="achievement-reward">Reward: Profile badge</div>
          </div>
          <div class="achievement-card">
            <div class="achievement-title">Survivor</div>
            <div class="achievement-desc">Stay alive for 5 minutes</div>
            <div class="achievement-reward">Reward: +100 XP</div>
          </div>
        </div>
      </div>
      
      <div class="modal-section">
        <h3>Intermediate Achievements</h3>
        <div class="achievements-grid">
          <div class="achievement-card">
            <div class="achievement-title">Predator</div>
            <div class="achievement-desc">Eat 5 players in a single game</div>
            <div class="achievement-reward">Reward: Custom skin unlocked</div>
          </div>
          <div class="achievement-card">
            <div class="achievement-title">Glutton</div>
            <div class="achievement-desc">Eat 50 food items in a single game</div>
            <div class="achievement-reward">Reward: +200 XP</div>
          </div>
          <div class="achievement-card">
            <div class="achievement-title">Fast Growth</div>
            <div class="achievement-desc">Reach size 500 within 3 minutes</div>
            <div class="achievement-reward">Reward: Special effect when splitting</div>
          </div>
        </div>
      </div>
      
      <div class="modal-section">
        <h3>Advanced Achievements</h3>
        <div class="achievements-grid">
          <div class="achievement-card">
            <div class="achievement-title">Apex Predator</div>
            <div class="achievement-desc">Eat 20 players in a single game</div>
            <div class="achievement-reward">Reward: Exclusive skin</div>
          </div>
          <div class="achievement-card">
            <div class="achievement-title">Dominator</div>
            <div class="achievement-desc">Reach the #1 position on the leaderboard</div>
            <div class="achievement-reward">Reward: Crown icon next to name</div>
          </div>
          <div class="achievement-card">
            <div class="achievement-title">Unstoppable</div>
            <div class="achievement-desc">Stay alive for 30 minutes</div>
            <div class="achievement-reward">Reward: +500 XP and special trail effect</div>
          </div>
        </div>
      </div>
      
      <div class="modal-section">
        <h3>Legendary Achievements</h3>
        <div class="achievements-grid">
          <div class="achievement-card legendary">
            <div class="achievement-title">World Eater</div>
            <div class="achievement-desc">Reach a size of 10,000</div>
            <div class="achievement-reward">Reward: Golden aura effect</div>
          </div>
          <div class="achievement-card legendary">
            <div class="achievement-title">Master Player</div>
            <div class="achievement-desc">Complete all other achievements</div>
            <div class="achievement-reward">Reward: Unique title and custom animation</div>
          </div>
        </div>
      </div>
    `;
  }