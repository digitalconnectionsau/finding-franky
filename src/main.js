import './style.css'
import { analytics } from './firebase.js'
import { logEvent } from 'firebase/analytics'
import {
  renderStickyNotePuzzle,
  renderPasswordPuzzle,
  renderMFAPuzzle,
  renderCleanDeskPuzzle,
  renderPatchPuzzle,
  renderPhishingPuzzle,
  renderSocialEngineeringPuzzle,
  renderUSBPuzzle,
  renderWifiPuzzle,
  renderIncidentReportingPuzzle
} from './lessons/index.js'

// ===== GAME STATE =====
const gameState = {
  timeRemaining: 1800, // 30 minutes in seconds
  timerInterval: null,
  timerPaused: false,
  currentZone: 'desk',
  awarenessPoints: 0,
  completedLessons: new Set(),
  decryptedFragments: [],
  serverCode: '1337', // The secret code to access Level 17
  
  lessons: {
    stickyNote: {
      id: 'stickyNote',
      title: 'Physical Security',
      description: 'Safeguarding physical workspace credentials',
      zone: 'desk',
      completed: false
    },
    passwordStrength: {
      id: 'passwordStrength',
      title: 'Passwords',
      description: 'Constructing resilient passphrases',
      zone: 'desk',
      completed: false
    },
    mfa: {
      id: 'mfa',
      title: 'Multi-Factor Authentication (MFA/2FA)',
      description: 'Validating identity through secondary layers',
      zone: 'desk',
      completed: false
    },
    cleanDesk: {
      id: 'cleanDesk',
      title: 'Clean Desk Policy',
      description: 'Protecting sensitive physical documents',
      zone: 'boardroom',
      completed: false
    },
    patchManagement: {
      id: 'patchManagement',
      title: 'Patching & Software Updates',
      description: 'The importance of timely system maintenance',
      zone: 'boardroom',
      completed: false
    },
    phishing: {
      id: 'phishing',
      title: 'Phishing',
      description: 'Identifying and scrutinizing malicious communications',
      zone: 'desk',
      completed: false
    },
    socialEngineering: {
      id: 'socialEngineering',
      title: 'Social Engineering Defenses',
      description: 'Recognizing psychological manipulation',
      zone: 'boardroom',
      completed: false
    },
    usbRisk: {
      id: 'usbRisk',
      title: 'Removable Media',
      description: 'Safe handling of unknown USB devices',
      zone: 'boardroom',
      completed: false
    },
    publicWifi: {
      id: 'publicWifi',
      title: 'Public Wi-Fi',
      description: 'Ensuring data integrity outside the office',
      zone: 'cafe',
      completed: false
    },
    incidentReporting: {
      id: 'incidentReporting',
      title: 'Incident Reporting Culture',
      description: 'The critical role of the "human firewall" in reporting',
      zone: 'cafe',
      completed: false
    }
  },
  
  encryptedMessage: [
    'T█ T██ L██MA S█FT████ T██M:',
    'Th█ s██v███ ███ c██pr█m██ed. I f█und th█ ███ch - ██m█on█',
    'ins███ th█ ███████y h██ b███ pl██t██g m██w███ th████gh',
    'mu█t██l█ v██t██s. P████w███s ██pl██ed, M█A ██p█ss██,',
    'p███ch ██l███ed ███st██s. Th█ ███unc█ is in ███g██.',
    'I\'m ███c█ng th█ ██████t t█ L██el 17 - ███ Se█v██ R█om.',
    'F███w m█ ██ w█ lo██ ██ery██ing.',
    'C██e: ████',
    '- F█ank██'
  ]
}


// ===== INITIALIZATION =====
function initGame() {
  renderIntroScreen()
}

function startGame() {
  document.querySelector('.intro-screen')?.remove()
  renderGameUI()
  startTimer()
  switchZone('desk')
  
  // Track game start
  logEvent(analytics, 'game_start', {
    game_name: 'Finding Frankie',
    timestamp: new Date().toISOString()
  })
}

// ===== INTRO SCREEN =====
function renderIntroScreen() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <div class="intro-screen">
      <div class="intro-content">
        <h1>FINDING FRANKIE</h1>
        <h2>Llama Software Corp</h2>
        <p>In 30 minutes, Llama Software Corp launches its most anticipated title yet. 
        But Frankie, the lead System Admin, has vanished.</p>
        <p>The servers are flickering. The network is compromised. The clock is ticking.</p>
        <p>Your mission: Trace Frankie's digital footsteps, secure the network, 
        and save the launch before it's too late.</p>
        <p><strong>Learn cybersecurity. Save the company. Find Frankie.</strong></p>
        <button class="btn-primary start-game-button" onclick="window.startGame()">
          BEGIN MISSION
        </button>
      </div>
    </div>
  `
  
  window.startGame = startGame
}

// ===== UI RENDERING =====
function renderGameUI() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <!-- HUD -->
    <div class="hud">
      <div class="timer" id="timer">30:00</div>
      <div class="awareness-counter">
        AWARENESS POINTS: <span id="awareness-count">0</span> / 10
      </div>
    </div>
    
    <!-- Game Zones -->
    <div class="game-zone" id="zone-desk">
      <div class="zone-content">
        <div class="hotspot" data-lesson="stickyNote" style="top: 30%; left: 20%;">
          <div class="hotspot-icon">📝</div>
        </div>
        <div class="hotspot" data-lesson="passwordStrength" style="top: 50%; left: 60%;">
          <div class="hotspot-icon">🔐</div>
        </div>
        <div class="hotspot" data-lesson="mfa" style="top: 40%; left: 70%;">
          <div class="hotspot-icon">📱</div>
        </div>
        <div class="hotspot" data-lesson="phishing" style="top: 60%; left: 30%;">
          <div class="hotspot-icon">📧</div>
        </div>
      </div>
    </div>
    
    <div class="game-zone" id="zone-boardroom">
      <div class="zone-content">
        <div class="hotspot" data-lesson="cleanDesk" style="top: 35%; left: 50%;">
          <div class="hotspot-icon">📄</div>
        </div>
        <div class="hotspot" data-lesson="patchManagement" style="top: 55%; left: 65%;">
          <div class="hotspot-icon">💻</div>
        </div>
        <div class="hotspot" data-lesson="socialEngineering" style="top: 45%; left: 25%;">
          <div class="hotspot-icon">📞</div>
        </div>
        <div class="hotspot" data-lesson="usbRisk" style="top: 65%; left: 40%;">
          <div class="hotspot-icon">💾</div>
        </div>
      </div>
    </div>
    
    <div class="game-zone" id="zone-cafe">
      <div class="zone-content">
        <div class="hotspot" data-lesson="publicWifi" style="top: 40%; left: 35%;">
          <div class="hotspot-icon">📡</div>
        </div>
        <div class="hotspot" data-lesson="incidentReporting" style="top: 55%; left: 60%;">
          <div class="hotspot-icon">🚨</div>
        </div>
      </div>
    </div>
    
    <!-- Decryption Terminal -->
    <div class="decryption-terminal" id="decryption-terminal">
      <div class="header">
        <span>⚠️ ENCRYPTED MESSAGE INTERCEPTED</span>
        <button class="terminal-toggle" id="terminal-toggle">−</button>
      </div>
      <div class="encrypted-text" id="encrypted-message"></div>
    </div>
    
    <!-- Elevator Button -->
    <div class="elevator-button" id="elevator-btn">🛗</div>
    
    <!-- Phone Button -->
    <div class="phone-button" id="phone-btn">📱</div>
  `
  
  updateDecryptionTerminal()
  setupEventListeners()
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Hotspot clicks
  document.querySelectorAll('.hotspot').forEach(hotspot => {
    hotspot.addEventListener('click', function() {
      const lessonId = this.getAttribute('data-lesson')
      openPuzzle(lessonId)
    })
  })
  
  // Elevator button
  document.getElementById('elevator-btn').addEventListener('click', openElevator)
  
  // Phone button
  document.getElementById('phone-btn').addEventListener('click', openPhone)
  
  // Terminal toggle
  document.getElementById('terminal-toggle').addEventListener('click', toggleTerminal)
}

// ===== TIMER SYSTEM =====
function startTimer() {
  gameState.timerInterval = setInterval(() => {
    if (!gameState.timerPaused && gameState.timeRemaining > 0) {
      gameState.timeRemaining--
      updateTimerDisplay()
      
      // Check for game over
      if (gameState.timeRemaining <= 0) {
        endGame(false)
      }
    }
  }, 1000)
}

function updateTimerDisplay() {
  const minutes = Math.floor(gameState.timeRemaining / 60)
  const seconds = gameState.timeRemaining % 60
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  
  const timerEl = document.getElementById('timer')
  timerEl.textContent = timeStr
  
  // Add warning/danger classes
  timerEl.classList.remove('warning', 'danger')
  if (gameState.timeRemaining <= 300) { // 5 minutes
    timerEl.classList.add('danger')
  } else if (gameState.timeRemaining <= 600) { // 10 minutes
    timerEl.classList.add('warning')
  }
}

function pauseTimer() {
  gameState.timerPaused = true
}

function resumeTimer() {
  gameState.timerPaused = false
}

// ===== ZONE SWITCHING =====
function switchZone(zoneName) {
  gameState.currentZone = zoneName
  
  document.querySelectorAll('.game-zone').forEach(zone => {
    zone.classList.remove('active')
  })
  
  document.getElementById(`zone-${zoneName}`).classList.add('active')
  
  // Track zone visit
  logEvent(analytics, 'zone_visit', {
    zone_name: zoneName,
    time_elapsed: 1800 - gameState.timeRemaining
  })
}

// ===== PHONE SYSTEM =====
function openPhone() {
  const overlay = document.createElement('div')
  overlay.className = 'phone-overlay active'
  overlay.innerHTML = `
    <div class="phone-device">
      <div class="phone-screen">
        <div class="phone-header">
          <div class="phone-time">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          <div class="phone-status">🔋 📶 📡</div>
        </div>
        
        <div class="phone-content">
          <h2>Apps</h2>
          <div class="app-grid" id="app-grid">
            <!-- Apps will be added here later -->
            <div class="app-placeholder">
              <div class="app-icon">📱</div>
              <div class="app-name">No apps yet</div>
            </div>
          </div>
        </div>
        
        <div class="phone-footer">
          <button class="phone-home-btn" id="phone-close">⬤</button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(overlay)
  
  // Close button
  overlay.querySelector('#phone-close').addEventListener('click', () => {
    overlay.remove()
  })
  
  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove()
    }
  })
}

// ===== ELEVATOR SYSTEM =====
function openElevator() {
  const overlay = document.createElement('div')
  overlay.className = 'elevator-overlay active'
  overlay.innerHTML = `
    <div class="elevator-panel">
      <div class="elevator-header">
        <h2>SELECT FLOOR</h2>
        <button class="elevator-close" id="elevator-close">✕</button>
      </div>
      <div class="floor-grid" id="floor-grid">
        ${generateFloorButtons()}
      </div>
    </div>
  `
  
  document.body.appendChild(overlay)
  
  // Add event listeners for accessible floors
  overlay.querySelectorAll('.floor-btn[data-accessible="true"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const zone = this.getAttribute('data-zone')
      switchZone(zone)
      overlay.remove()
    })
  })
  
  // Add event listeners for restricted floors
  overlay.querySelectorAll('.floor-btn[data-accessible="false"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const floor = this.getAttribute('data-floor')
      if (floor === '17') {
        openServerRoomKeypad()
      } else {
        showFeedback('error', `Floor ${floor} requires PIN authorization`)
      }
    })
  })
  
  overlay.querySelector('#elevator-close').addEventListener('click', () => {
    overlay.remove()
  })
}

function generateFloorButtons() {
  const floors = []
  
  // Generate floors in groups of 5, from highest to lowest
  // 21-25, 16-20, 11-15, 6-10, 1-5
  const rows = [
    [21, 22, 23, 24, 25],
    [16, 17, 18, 19, 20],
    [11, 12, 13, 14, 15],
    [6, 7, 8, 9, 10],
    [1, 2, 3, 4, 5]
  ]
  
  rows.forEach(row => {
    row.forEach(i => {
      let accessible = false
      let zone = ''
      
      // Only floors 20, 19, and Ground are accessible
      if (i === 20) {
        accessible = true
        zone = 'desk'
      } else if (i === 19) {
        accessible = true
        zone = 'boardroom'
      }
      
      floors.push(`
        <button class="floor-btn ${accessible ? 'accessible' : 'restricted'}" 
                data-floor="${i}" 
                data-accessible="${accessible}" 
                ${accessible ? `data-zone="${zone}"` : ''}>
          ${i}
        </button>
      `)
    })
  })
  
  // Add Ground floor button (centered, full width)
  floors.push(`
    <button class="floor-btn accessible ground-btn" 
            data-floor="0" 
            data-accessible="true" 
            data-zone="cafe">
      G
    </button>
  `)
  
  return floors.join('')
}

// ===== SERVER ROOM KEYPAD =====
function openServerRoomKeypad() {
  if (gameState.awarenessPoints < 10) {
    showFeedback('error', 'ACCESS DENIED: Complete all security protocols first.')
    return
  }
  
  const overlay = document.createElement('div')
  overlay.className = 'keypad-overlay active'
  overlay.innerHTML = `
    <div class="keypad-container">
      <h2>🔒 RESTRICTED ACCESS</h2>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">
        Enter 4-digit security code
      </p>
      <div class="keypad-display" id="keypad-display"></div>
      <div class="keypad-buttons" id="keypad-buttons">
        ${[1,2,3,4,5,6,7,8,9,0].map(num => 
          `<button class="keypad-btn" data-num="${num}">${num}</button>`
        ).join('')}
      </div>
      <div class="keypad-actions">
        <button class="btn-secondary" id="keypad-clear">CLEAR</button>
        <button class="btn-primary" id="keypad-submit">SUBMIT</button>
        <button class="btn-secondary" id="keypad-cancel">CANCEL</button>
      </div>
    </div>
  `
  
  document.body.appendChild(overlay)
  
  let code = ''
  const display = overlay.querySelector('#keypad-display')
  
  overlay.querySelectorAll('.keypad-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (code.length < 4) {
        code += this.getAttribute('data-num')
        display.textContent = code
      }
    })
  })
  
  overlay.querySelector('#keypad-clear').addEventListener('click', () => {
    code = ''
    display.textContent = ''
  })
  
  overlay.querySelector('#keypad-submit').addEventListener('click', () => {
    if (code === gameState.serverCode) {
      overlay.remove()
      document.querySelector('.elevator-overlay')?.remove()
      endGame(true)
    } else {
      display.textContent = '❌ INVALID'
      setTimeout(() => {
        code = ''
        display.textContent = ''
      }, 1000)
      gameState.timeRemaining -= 30 // Penalty
    }
  })
  
  overlay.querySelector('#keypad-cancel').addEventListener('click', () => {
    overlay.remove()
  })
}

// ===== PUZZLE SYSTEM =====
function openPuzzle(lessonId) {
  const lesson = gameState.lessons[lessonId]
  
  if (lesson.completed) {
    return
  }
  
  pauseTimer()
  
  const puzzles = {
    stickyNote: renderStickyNotePuzzle,
    passwordStrength: renderPasswordPuzzle,
    mfa: renderMFAPuzzle,
    cleanDesk: renderCleanDeskPuzzle,
    patchManagement: renderPatchPuzzle,
    phishing: renderPhishingPuzzle,
    socialEngineering: renderSocialEngineeringPuzzle,
    usbRisk: renderUSBPuzzle,
    publicWifi: renderWifiPuzzle,
    incidentReporting: renderIncidentReportingPuzzle
  }
  
  if (puzzles[lessonId]) {
    puzzles[lessonId](lesson, gameState, completePuzzle, resumeTimer)
  }
}

function createModal(content) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay active'
  modal.innerHTML = `<div class="modal-content">${content}</div>`
  document.body.appendChild(modal)
  return modal
}

function closeModal(modal) {
  modal.remove()
  resumeTimer()
}

function completePuzzle(lessonId) {
  const lesson = gameState.lessons[lessonId]
  lesson.completed = true
  gameState.completedLessons.add(lessonId)
  gameState.awarenessPoints++
  
  // Mark hotspot as completed
  document.querySelector(`[data-lesson="${lessonId}"]`)?.classList.add('completed')
  
  // Update UI
  document.getElementById('awareness-count').textContent = gameState.awarenessPoints
  
  // Add decryption fragment
  addDecryptionFragment(gameState.awarenessPoints - 1)
  
  // Show success feedback
  showFeedback('success', `✓ ${lesson.title} - SECURED`)
  
  // Track puzzle completion
  logEvent(analytics, 'puzzle_complete', {
    lesson_id: lessonId,
    lesson_title: lesson.title,
    awareness_points: gameState.awarenessPoints,
    time_remaining: gameState.timeRemaining
  })
}

// ===== DECRYPTION SYSTEM =====
function updateDecryptionTerminal() {
  const terminal = document.getElementById('encrypted-message')
  if (!terminal) return
  
  let html = ''
  gameState.encryptedMessage.forEach((line, index) => {
    if (gameState.decryptedFragments.includes(index)) {
      html += `<div class="decrypted">${decryptLine(line)}</div>`
    } else {
      html += `<div>${line}</div>`
    }
  })
  
  terminal.innerHTML = html
}

function decryptLine(line) {
  // Simple decryption - replace █ with actual letters
  const decrypted = {
    'T█ T██ L██MA S█FT████ T██M:': 'TO THE LLAMA SOFTWARE TEAM:',
    'Th█ s██v███ ███ c██pr█m██ed. I f█und th█ ███ch - ██m█on█': 'The servers are compromised. I found the breach - someone',
    'ins███ th█ ███████y h██ b███ pl██t██g m██w███ th████gh': 'inside the company has been planting malware through',
    'mu█t██l█ v██t██s. P████w███s ██pl██ed, M█A ██p█ss██,': 'multiple vectors. Passwords exposed, MFA bypassed,',
    'p███ch ██l███ed ███st██s. Th█ ███unc█ is in ███g██.': 'patch delayed systems. The launch is in danger.',
    'I\'m ███c█ng th█ ██████t t█ L██el 17 - ███ Se█v██ R█om.': 'I\'m tracing the threat to Level 17 - the Server Room.',
    'F███w m█ ██ w█ lo██ ██ery██ing.': 'Follow me or we lose everything.',
    'C██e: ████': 'Code: 1337',
    '- F█ank██': '- Frankie'
  }
  
  return decrypted[line] || line
}

function addDecryptionFragment(index) {
  gameState.decryptedFragments.push(index)
  updateDecryptionTerminal()
}

// ===== FEEDBACK SYSTEM =====
function showFeedback(type, message) {
  const feedbackDiv = document.createElement('div')
  feedbackDiv.className = `feedback-message ${type}`
  feedbackDiv.textContent = message
  feedbackDiv.style.position = 'fixed'
  feedbackDiv.style.top = '100px'
  feedbackDiv.style.left = '50%'
  feedbackDiv.style.transform = 'translateX(-50%)'
  feedbackDiv.style.zIndex = '1000'
  feedbackDiv.style.minWidth = '300px'
  
  document.body.appendChild(feedbackDiv)
  
  setTimeout(() => {
    feedbackDiv.remove()
  }, 3000)
}

// ===== TERMINAL TOGGLE =====
function toggleTerminal() {
  const terminal = document.getElementById('decryption-terminal')
  const toggleBtn = document.getElementById('terminal-toggle')
  
  terminal.classList.toggle('minimized')
  
  if (terminal.classList.contains('minimized')) {
    toggleBtn.textContent = '+'
  } else {
    toggleBtn.textContent = '−'
  }
}

// ===== END GAME =====
function endGame(isVictory) {
  clearInterval(gameState.timerInterval)
  
  const timeUsed = 1800 - gameState.timeRemaining
  const minutes = Math.floor(timeUsed / 60)
  const seconds = timeUsed % 60
  
  const grade = calculateGrade()
  
  // Track game completion
  logEvent(analytics, 'game_complete', {
    victory: isVictory,
    time_used_seconds: timeUsed,
    awareness_points: gameState.awarenessPoints,
    lessons_completed: gameState.completedLessons.size,
    grade: grade,
    timestamp: new Date().toISOString()
  })
  
  const postGame = document.createElement('div')
  postGame.className = 'post-game active'
  postGame.innerHTML = `
    <div class="post-game-content">
      <h1 class="${isVictory ? '' : 'failure'}">
        ${isVictory ? 'MISSION COMPLETE' : 'MISSION FAILED'}
      </h1>
      
      ${isVictory ? `
        <p style="text-align: center; color: var(--neon-green); font-size: 1.2rem; margin-bottom: 30px;">
          You found Frankie and secured the network. The launch is saved!
        </p>
      ` : `
        <p style="text-align: center; color: var(--danger); font-size: 1.2rem; margin-bottom: 30px;">
          Time expired. The launch was cancelled. Llama Software Corp stock is plummeting.
        </p>
      `}
      
      <div class="scorecard">
        <div class="stat">
          <span class="label">Time Used:</span>
          <span class="value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
        </div>
        <div class="stat">
          <span class="label">Awareness Points:</span>
          <span class="value">${gameState.awarenessPoints} / 10</span>
        </div>
        <div class="stat">
          <span class="label">Lessons Completed:</span>
          <span class="value">${gameState.completedLessons.size} / 10</span>
        </div>
      </div>
      
      <div class="security-rating">
        <div class="grade">${grade}</div>
        <div style="color: var(--text-secondary);">Security Rating</div>
      </div>
      
      <div class="lessons-learned">
        <h2>LESSONS LEARNED</h2>
        ${Object.values(gameState.lessons).map(lesson => `
          <div class="lesson-item ${lesson.completed ? 'completed' : 'incomplete'}">
            <div class="title">${lesson.completed ? '✓' : '✗'} ${lesson.title}</div>
            <div class="description">${lesson.description}</div>
          </div>
        `).join('')}
      </div>
      
      ${isVictory ? `
        <p style="text-align: center; color: var(--neon-cyan); margin-top: 30px; font-size: 1.1rem;">
          🎉 Frankie is safe. The servers are secured. You're a cybersecurity hero.
        </p>
      ` : `
        <p style="text-align: center; color: var(--text-secondary); margin-top: 30px; font-style: italic;">
          "Better luck in the unemployment line, kid." - The Llama
        </p>
      `}
      
      <button class="btn-primary restart-button" onclick="location.reload()">
        RESTART MISSION
      </button>
    </div>
  `
  
  document.body.appendChild(postGame)
}

function calculateGrade() {
  const score = gameState.awarenessPoints
  if (score === 10) return 'S'
  if (score >= 8) return 'A'
  if (score >= 6) return 'B'
  if (score >= 4) return 'C'
  if (score >= 2) return 'D'
  return 'F'
}

// ===== START THE GAME =====
initGame()
