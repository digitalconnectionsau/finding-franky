import './style.css'
import { analytics } from './firebase.js'
import { logEvent as _logEvent } from 'firebase/analytics'

// Safe analytics wrapper — no-op if analytics isn't ready (SSR / blocked)
function safeLogEvent(eventName, params) {
  if (analytics) _logEvent(analytics, eventName, params)
}

// ===== HELPERS =====
function clampTime() {
  if (gameState.timeRemaining < 0) gameState.timeRemaining = 0
}

// Track active puzzle intervals (e.g. MFA timer) so Escape can clean them up
const activePuzzleIntervals = new Set()

function registerPuzzleInterval(id) { activePuzzleIntervals.add(id) }
function clearPuzzleIntervals() {
  activePuzzleIntervals.forEach(id => clearInterval(id))
  activePuzzleIntervals.clear()
}

// ===== GAME STATE =====
const gameState = {
  timeRemaining: 1800, // 30 minutes in seconds
  timerInterval: null,
  timerPaused: false,
  currentZone: 'desk',
  awarenessPoints: 0,
  completedLessons: new Set(),
  decryptedFragments: [],
  serverCode: ((n) => n.toString())(1337), // Derived at runtime
  
  lessons: {
    stickyNote: {
      id: 'stickyNote',
      title: 'Physical Security & Credential Protection',
      description: 'Safeguarding physical workspace credentials',
      zone: 'desk',
      completed: false
    },
    passwordStrength: {
      id: 'passwordStrength',
      title: 'Password Complexity and Strength',
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
      title: 'Patch Management & Software Updates',
      description: 'The importance of timely system maintenance',
      zone: 'boardroom',
      completed: false
    },
    phishing: {
      id: 'phishing',
      title: 'Phishing Awareness & Email Literacy',
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
      title: 'Risks of Removable Media',
      description: 'Safe handling of unknown USB devices',
      zone: 'boardroom',
      completed: false
    },
    publicWifi: {
      id: 'publicWifi',
      title: 'Secure Remote Connectivity (Public Wi-Fi vs. VPN)',
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

// ===== LLAMA HINTS =====
const llamaHints = [
  "Tick tock, kid. Time's not your friend in this business.",
  "You missed something. Check the desk more carefully.",
  "That sticky note isn't just bad practice - it's a disaster waiting to happen.",
  "Frankie wouldn't leave without securing the network first. Keep looking.",
  "The boardroom holds secrets. Corporate types always leave a mess.",
  "Public Wi-Fi at a cafe? Might as well broadcast your password on the news.",
  "MFA isn't optional anymore. It's the difference between secure and sorry.",
  "Those USB drives? They're not gifts. They're trojan horses.",
  "You're running out of time. Focus on what matters.",
  "The decryption terminal is your roadmap. Watch it closely."
]

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
  safeLogEvent('game_start', {
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
      <div class="hud-right">
        <div class="zone-indicator" id="zone-indicator">FLOOR 20 — DESK</div>
        <div class="awareness-counter">
          AWARENESS POINTS: <span id="awareness-count">0</span> / 10
        </div>
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
    <div class="elevator-button" id="elevator-btn" tabindex="0" role="button" aria-label="Open elevator">🛗</div>
    
    <!-- Llama Hint -->
    <div class="llama-hint" id="llama-hint">
      <div class="character">🦙</div>
      <div class="message" id="llama-message"></div>
    </div>
  `
  
  updateDecryptionTerminal()
  setupEventListeners()
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Hotspot clicks + keyboard support
  document.querySelectorAll('.hotspot').forEach(hotspot => {
    hotspot.setAttribute('tabindex', '0')
    hotspot.setAttribute('role', 'button')
    hotspot.addEventListener('click', function() {
      const lessonId = this.getAttribute('data-lesson')
      openPuzzle(lessonId)
    })
    hotspot.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const lessonId = this.getAttribute('data-lesson')
        openPuzzle(lessonId)
      }
    })
  })
  
  // Elevator button
  const elevatorBtn = document.getElementById('elevator-btn')
  elevatorBtn.addEventListener('click', openElevator)
  elevatorBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openElevator() }
  })
  
  // Terminal toggle
  document.getElementById('terminal-toggle').addEventListener('click', toggleTerminal)
  
  // Keyboard: Escape to close overlays
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearPuzzleIntervals()
      document.querySelector('.modal-overlay.active')?.remove()
      document.querySelector('.elevator-overlay.active')?.remove()
      document.querySelector('.keypad-overlay.active')?.remove()
      resumeTimer()
    }
  })
}

// ===== TIMER SYSTEM =====
function startTimer() {
  gameState.timerInterval = setInterval(() => {
    if (!gameState.timerPaused && gameState.timeRemaining > 0) {
      gameState.timeRemaining--
      updateTimerDisplay()
      
      // Check for game over
      if (gameState.timeRemaining <= 0) {
        gameState.timeRemaining = 0
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
const zoneLabels = { desk: 'FLOOR 20 — DESK', boardroom: 'FLOOR 19 — BOARDROOM', cafe: 'GROUND — CAFE' }

function switchZone(zoneName) {
  gameState.currentZone = zoneName
  
  document.querySelectorAll('.game-zone').forEach(zone => {
    zone.classList.remove('active')
  })
  
  document.getElementById(`zone-${zoneName}`).classList.add('active')
  
  // Update zone indicator
  const indicator = document.getElementById('zone-indicator')
  if (indicator) indicator.textContent = zoneLabels[zoneName] || zoneName.toUpperCase()
  
  // Show a contextual llama hint
  const hintIndex = { desk: 1, boardroom: 4, cafe: 5 }
  if (hintIndex[zoneName] !== undefined) showLlamaHint(hintIndex[zoneName])
  
  // Track zone visit
  safeLogEvent('zone_visit', {
    zone_name: zoneName,
    time_elapsed: 1800 - gameState.timeRemaining
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
      gameState.timeRemaining -= 30
      clampTime()
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
    puzzles[lessonId](lesson)
  }
}

function createModal(content) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay active'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-modal', 'true')
  modal.innerHTML = `<div class="modal-content">${content}</div>`
  document.body.appendChild(modal)
  // Focus first interactive element
  const firstBtn = modal.querySelector('button, input, [tabindex]')
  if (firstBtn) setTimeout(() => firstBtn.focus(), 50)
  
  // Scroll-arrow indicator: show arrow when content is scrollable, hide at bottom
  const mc = modal.querySelector('.modal-content')
  function checkScroll() {
    const canScroll = mc.scrollHeight - mc.scrollTop - mc.clientHeight > 10
    mc.classList.toggle('can-scroll', canScroll)
  }
  mc.addEventListener('scroll', checkScroll)
  // Check after content renders
  setTimeout(checkScroll, 100)
  
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
  
  // Show llama hint for this completion
  if (gameState.awarenessPoints <= llamaHints.length) {
    showLlamaHint(gameState.awarenessPoints - 1)
  }
  
  // Track puzzle completion
  safeLogEvent('puzzle_complete', {
    lesson_id: lessonId,
    lesson_title: lesson.title,
    awareness_points: gameState.awarenessPoints,
    time_remaining: gameState.timeRemaining
  })
}

// ===== INDIVIDUAL PUZZLES =====

function renderStickyNotePuzzle(lesson) {
  const modal = createModal(`
    <h2>🔍 ${lesson.title}</h2>
    <p>You found a sticky note on the desk with a password written on it: <strong>Admin123</strong></p>
    
    <div class="quiz-question">
      <h3>Why is this a security risk?</h3>
      <div class="quiz-options" id="quiz-options">
        <button class="quiz-option" data-correct="false">
          It's fine - it's a strong password
        </button>
        <button class="quiz-option" data-correct="true">
          Physical access to credentials bypasses all digital security
        </button>
        <button class="quiz-option" data-correct="false">
          Sticky notes are encrypted
        </button>
        <button class="quiz-option" data-correct="false">
          The password is too complex to remember
        </button>
      </div>
    </div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
    </div>
  `)
  
  modal.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
      // Disable all options after click
      modal.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none'
      })
      
      const isCorrect = this.getAttribute('data-correct') === 'true'
      
      if (isCorrect) {
        this.classList.add('correct')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message success">
            Correct! Physical security is the first line of defense. 
            No password should ever be written down where others can see it.
          </div>
        `
        setTimeout(() => {
          completePuzzle(lesson.id)
          closeModal(modal)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Try again. (Time penalty applied)
          </div>
        `
        gameState.timeRemaining -= 15
        clampTime()
        setTimeout(() => {
          // Re-enable options
          modal.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'auto'
            opt.classList.remove('incorrect')
          })
          modal.querySelector('#feedback').innerHTML = ''
        }, 2000)
      }
    })
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
}

function renderPasswordPuzzle(lesson) {
  const modal = createModal(`
    <h2>🔐 ${lesson.title}</h2>
    <p>Create a strong password for the network admin account.</p>
    <p style="font-size: 0.9rem; color: var(--text-secondary);">
      Requirements: Minimum 12 characters, uppercase, lowercase, numbers, and symbols
    </p>
    
    <input type="text" class="input-field" id="password-input" placeholder="Enter password...">
    
    <div class="password-strength-meter">
      <div class="password-strength-bar" id="strength-bar"></div>
    </div>
    <div id="strength-feedback" style="color: var(--text-secondary); margin-bottom: 20px;"></div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
      <button class="btn-primary" id="submit-btn" disabled>SUBMIT</button>
    </div>
  `)
  
  const input = modal.querySelector('#password-input')
  const strengthBar = modal.querySelector('#strength-bar')
  const strengthFeedback = modal.querySelector('#strength-feedback')
  const submitBtn = modal.querySelector('#submit-btn')
  
  input.addEventListener('input', function() {
    const password = this.value
    const strength = calculatePasswordStrength(password)
    
    strengthBar.className = 'password-strength-bar'
    
    if (strength.score === 0) {
      strengthFeedback.textContent = 'Very Weak'
    } else if (strength.score === 1) {
      strengthBar.classList.add('strength-weak')
      strengthFeedback.textContent = 'Weak - Add more characters and variety'
    } else if (strength.score === 2) {
      strengthBar.classList.add('strength-medium')
      strengthFeedback.textContent = 'Medium - Getting better'
    } else if (strength.score === 3) {
      strengthBar.classList.add('strength-good')
      strengthFeedback.textContent = 'Good - Almost there'
    } else {
      strengthBar.classList.add('strength-strong')
      strengthFeedback.textContent = '✓ Strong - Excellent password'
      submitBtn.disabled = false
    }
  })
  
  submitBtn.addEventListener('click', () => {
    completePuzzle(lesson.id)
    closeModal(modal)
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
}

function calculatePasswordStrength(password) {
  let score = 0
  
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  return { score: Math.min(score, 4) }
}

function renderMFAPuzzle(lesson) {
  const randomCode = Math.floor(100000 + Math.random() * 900000)
  
  const modal = createModal(`
    <h2>📱 ${lesson.title}</h2>
    <p>A login attempt was detected from an unknown device. 
    Your authentication app shows this code:</p>
    
    <div style="text-align: center; padding: 20px; background: rgba(0,0,0,0.5); 
                border-radius: 10px; margin: 20px 0;">
      <div style="font-family: 'Orbitron', monospace; font-size: 2.5rem; 
                  color: var(--neon-green); text-shadow: 0 0 10px var(--neon-green);">
        ${randomCode}
      </div>
      <div id="mfa-countdown" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 10px;">
        Expires in 30 seconds
      </div>
    </div>
    
    <input type="text" class="input-field" id="mfa-input" 
           placeholder="Enter 6-digit code..." maxlength="6">
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
      <button class="btn-primary" id="verify-btn">VERIFY</button>
    </div>
  `)
  
  modal.querySelector('#verify-btn').addEventListener('click', () => {
    const input = modal.querySelector('#mfa-input').value
    
    if (input === randomCode.toString()) {
      modal.querySelector('#feedback').innerHTML = `
        <div class="feedback-message success">
          ✓ Authentication successful! MFA prevents unauthorized access even if passwords are compromised.
        </div>
      `
      setTimeout(() => {
        completePuzzle(lesson.id)
        closeModal(modal)
      }, 2000)
    } else {
      modal.querySelector('#feedback').innerHTML = `
        <div class="feedback-message error">
          ❌ Invalid code. Check the displayed number carefully.
        </div>
      `
      gameState.timeRemaining -= 10
      clampTime()
    }
  })
  
  // MFA countdown timer (actually expires)
  let mfaTimeLeft = 30
  const countdownEl = modal.querySelector('#mfa-countdown')
  const mfaTimer = setInterval(() => {
    mfaTimeLeft--
    if (countdownEl) countdownEl.textContent = `Expires in ${mfaTimeLeft} seconds`
    if (mfaTimeLeft <= 0) {
      clearInterval(mfaTimer)
      activePuzzleIntervals.delete(mfaTimer)
      modal.querySelector('#feedback').innerHTML = `
        <div class="feedback-message error">
          ⏰ Code expired! Time penalty applied.
        </div>
      `
      gameState.timeRemaining -= 15
      clampTime()
      setTimeout(() => closeModal(modal), 2000)
    }
  }, 1000)
  registerPuzzleInterval(mfaTimer)
  
  // Clean up timer if modal is closed early
  const origClose = modal.querySelector('#close-btn')
  origClose.addEventListener('click', () => { clearInterval(mfaTimer); closeModal(modal) })
}

function renderCleanDeskPuzzle(lesson) {
  const modal = createModal(`
    <h2>📄 ${lesson.title}</h2>
    <p>You found sensitive documents left on the boardroom table. 
    Secure them properly using drag and drop.</p>
    
    <div class="drag-drop-container">
      <div class="drop-zone" id="insecure-zone">
        <h3>⚠️ Insecure Locations</h3>
        <div class="draggable-item" draggable="true" data-item="pii">
          Employee PII Documents
        </div>
        <div class="draggable-item" draggable="true" data-item="financial">
          Financial Reports
        </div>
        <div class="draggable-item" draggable="true" data-item="credentials">
          Network Credentials
        </div>
      </div>
      
      <div class="drop-zone" id="secure-zone">
        <h3>🔒 Locked File Cabinet</h3>
      </div>
    </div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
      <button class="btn-primary" id="check-btn" disabled>CHECK SECURITY</button>
    </div>
  `)
  
  const insecureZone = modal.querySelector('#insecure-zone')
  const secureZone = modal.querySelector('#secure-zone')
  const checkBtn = modal.querySelector('#check-btn')
  
  let draggedItem = null
  
  modal.querySelectorAll('.draggable-item').forEach(item => {
    item.addEventListener('dragstart', function() {
      draggedItem = this
      this.classList.add('dragging')
    })
    
    item.addEventListener('dragend', function() {
      this.classList.remove('dragging')
    })
  })
  
  ;[insecureZone, secureZone].forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault()
    })
    
    zone.addEventListener('drop', function(e) {
      e.preventDefault()
      if (draggedItem && !draggedItem.matches('h3')) {
        this.appendChild(draggedItem)
        
        // Check if all items are in secure zone
        if (secureZone.querySelectorAll('.draggable-item').length === 3) {
          checkBtn.disabled = false
          secureZone.classList.add('valid')
        } else {
          checkBtn.disabled = true
          secureZone.classList.remove('valid')
        }
      }
    })
  })
  
  checkBtn.addEventListener('click', () => {
    modal.querySelector('#feedback').innerHTML = `
      <div class="feedback-message success">
        ✓ Excellent! All sensitive documents secured. A clean desk policy prevents data breaches.
      </div>
    `
    setTimeout(() => {
      completePuzzle(lesson.id)
      closeModal(modal)
    }, 2000)
  })
  
  // Touch support for drag and drop
  addTouchDragSupport(modal)
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
}

// ===== TOUCH DRAG & DROP =====
function addTouchDragSupport(container) {
  let draggedItem = null
  let touchOffsetX = 0
  let touchOffsetY = 0
  let placeholder = null
  
  container.querySelectorAll('.draggable-item').forEach(item => {
    item.addEventListener('touchstart', function(e) {
      draggedItem = this
      const touch = e.touches[0]
      const rect = this.getBoundingClientRect()
      touchOffsetX = touch.clientX - rect.left
      touchOffsetY = touch.clientY - rect.top
      this.classList.add('dragging')
      
      // Create placeholder
      placeholder = this.cloneNode(true)
      placeholder.style.opacity = '0.3'
      placeholder.style.pointerEvents = 'none'
      this.parentNode.insertBefore(placeholder, this.nextSibling)
      
      // Make item follow touch
      this.style.position = 'fixed'
      this.style.zIndex = '10000'
      this.style.width = rect.width + 'px'
      this.style.left = (touch.clientX - touchOffsetX) + 'px'
      this.style.top = (touch.clientY - touchOffsetY) + 'px'
    }, { passive: true })
    
    item.addEventListener('touchmove', function(e) {
      if (!draggedItem) return
      e.preventDefault()
      const touch = e.touches[0]
      this.style.left = (touch.clientX - touchOffsetX) + 'px'
      this.style.top = (touch.clientY - touchOffsetY) + 'px'
    }, { passive: false })
    
    item.addEventListener('touchend', function(e) {
      if (!draggedItem) return
      this.classList.remove('dragging')
      this.style.position = ''
      this.style.zIndex = ''
      this.style.width = ''
      this.style.left = ''
      this.style.top = ''
      
      placeholder?.remove()
      placeholder = null
      
      // Find drop zone under touch point
      const touch = e.changedTouches[0]
      const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)
      const zone = dropTarget?.closest('.drop-zone')
      
      if (zone && !draggedItem.matches('h3')) {
        zone.appendChild(draggedItem)
        // Trigger check button logic
        const secureZone = container.querySelector('#secure-zone')
        const checkBtn = container.querySelector('#check-btn')
        if (secureZone && checkBtn) {
          if (secureZone.querySelectorAll('.draggable-item').length === 3) {
            checkBtn.disabled = false
            secureZone.classList.add('valid')
          } else {
            checkBtn.disabled = true
            secureZone.classList.remove('valid')
          }
        }
      }
      
      draggedItem = null
    })
  })
}

function renderPatchPuzzle(lesson) {
  const modal = createModal(`
    <h2>💻 ${lesson.title}</h2>
    <p>The server shows several pending updates. Which should be prioritized?</p>
    
    <div class="quiz-question">
      <h3>Select all critical updates:</h3>
      <div class="quiz-options" id="quiz-options">
        <button class="quiz-option" data-critical="true">
          Security Patch - CVE-2024-0001 (Critical)
        </button>
        <button class="quiz-option" data-critical="false">
          UI Theme Update
        </button>
        <button class="quiz-option" data-critical="true">
          Firewall Security Update
        </button>
        <button class="quiz-option" data-critical="false">
          New Emoji Pack
        </button>
      </div>
    </div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
      <button class="btn-primary" id="submit-btn">INSTALL SELECTED</button>
    </div>
  `)
  
  const selectedOptions = new Set()
  
  modal.querySelectorAll('.quiz-option').forEach((option, index) => {
    option.addEventListener('click', function() {
      if (this.classList.contains('selected')) {
        this.classList.remove('selected')
        selectedOptions.delete(index)
      } else {
        this.classList.add('selected')
        selectedOptions.add(index)
      }
    })
  })
  
  modal.querySelector('#submit-btn').addEventListener('click', () => {
    const allOptions = Array.from(modal.querySelectorAll('.quiz-option'))
    const selectedCritical = Array.from(selectedOptions).filter(idx => 
      allOptions[idx].getAttribute('data-critical') === 'true'
    ).length
    const selectedNonCritical = Array.from(selectedOptions).filter(idx => 
      allOptions[idx].getAttribute('data-critical') === 'false'
    ).length
    
    if (selectedCritical === 2 && selectedNonCritical === 0) {
      modal.querySelector('#feedback').innerHTML = `
        <div class="feedback-message success">
          ✓ Correct! Security patches close vulnerabilities that hackers exploit. They must be prioritized.
        </div>
      `
      setTimeout(() => {
        completePuzzle(lesson.id)
        closeModal(modal)
      }, 2000)
    } else {
      modal.querySelector('#feedback').innerHTML = `
        <div class="feedback-message error">
          ❌ Incorrect selection. Focus on security-critical updates only.
        </div>
      `
      gameState.timeRemaining -= 15
      clampTime()
      setTimeout(() => {
        modal.querySelector('#feedback').innerHTML = ''
        // Re-enable selection after wrong answer
        modal.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'))
        selectedOptions.clear()
      }, 2000)
    }
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
}

function renderPhishingPuzzle(lesson) {
  const modal = createModal(`
    <h2>📧 ${lesson.title}</h2>
    <p>You received an email. Analyze it carefully.</p>
    
    <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; 
                margin: 20px 0; border: 2px solid var(--text-secondary);">
      <div style="margin-bottom: 10px;">
        <strong>From:</strong> admin@llama-s0ftware.com
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Subject:</strong> URGENT: Verify Your Account NOW
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Body:</strong>
      </div>
      <div style="line-height: 1.8;">
        Dear Employee,<br><br>
        Your account will be SUSPENDED in 1 hour unless you verify immediately!<br>
        Click here: <span style="color: var(--neon-cyan);">http://llama-verify-now.ru/login</span><br><br>
        Enter your password to confirm.<br><br>
        - IT Department
      </div>
    </div>
    
    <div class="quiz-question">
      <h3>What indicates this is a phishing attempt?</h3>
      <div class="quiz-options">
        <button class="quiz-option" data-correct="false">
          It's from IT Department
        </button>
        <button class="quiz-option" data-correct="true">
          Suspicious domain (.ru), urgency tactics, requests password
        </button>
        <button class="quiz-option" data-correct="false">
          The formatting looks professional
        </button>
      </div>
    </div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
    </div>
  `)
  
  modal.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
      // Disable all options after click
      modal.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none'
      })
      
      const isCorrect = this.getAttribute('data-correct') === 'true'
      
      if (isCorrect) {
        this.classList.add('correct')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message success">
            ✓ Correct! Red flags: Mismatched domain, urgency, password request. Always verify sender.
          </div>
        `
        setTimeout(() => {
          completePuzzle(lesson.id)
          closeModal(modal)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Look for red flags: domain, urgency, password requests. (Time penalty)
          </div>
        `
        gameState.timeRemaining -= 15
        clampTime()
        setTimeout(() => {
          modal.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'auto'
            opt.classList.remove('incorrect')
          })
          modal.querySelector('#feedback').innerHTML = ''
        }, 2000)
      }
    })
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
}

function renderSocialEngineeringPuzzle(lesson) {
  const modal = createModal(`
    <h2>📞 ${lesson.title}</h2>
    <p>You receive a phone call:</p>
    
    <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; 
                margin: 20px 0; border: 2px solid var(--warning);">
      <p style="font-style: italic; line-height: 1.8;">
        "Hi, this is David from IT. We're doing emergency maintenance and need your 
        login credentials to update your account. Can you provide your password and 
        MFA code right now? It's urgent."
      </p>
    </div>
    
    <div class="quiz-question">
      <h3>What should you do?</h3>
      <div class="quiz-options">
        <button class="quiz-option" data-correct="false">
          Provide the information - it's IT
        </button>
        <button class="quiz-option" data-correct="true">
          Refuse and report to IT - legitimate IT never asks for passwords
        </button>
        <button class="quiz-option" data-correct="false">
          Give just the password but not MFA
        </button>
      </div>
    </div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
    </div>
  `)
  
  modal.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
      // Disable all options after click
      modal.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none'
      })
      
      const isCorrect = this.getAttribute('data-correct') === 'true'
      
      if (isCorrect) {
        this.classList.add('correct')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message success">
            ✓ Correct! Never share credentials over phone. IT will never ask for passwords or MFA codes.
          </div>
        `
        setTimeout(() => {
          completePuzzle(lesson.id)
          closeModal(modal)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Legitimate IT never asks for passwords. (Time penalty)
          </div>
        `
        gameState.timeRemaining -= 15
        clampTime()
        setTimeout(() => {
          modal.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'auto'
            opt.classList.remove('incorrect')
          })
          modal.querySelector('#feedback').innerHTML = ''
        }, 2000)
      }
    })
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
}

function renderUSBPuzzle(lesson) {
  const modal = createModal(`
    <h2>💾 ${lesson.title}</h2>
    <p>You found an unmarked USB drive in the boardroom labeled "Q4 Financials".</p>
    
    <div class="quiz-question">
      <h3>What should you do?</h3>
      <div class="quiz-options">
        <button class="quiz-option" data-correct="false">
          Plug it in to see what's on it
        </button>
        <button class="quiz-option" data-correct="true">
          Report it to IT - unknown USB devices can contain malware
        </button>
        <button class="quiz-option" data-correct="false">
          Use it if it looks official
        </button>
        <button class="quiz-option" data-correct="false">
          Scan it with antivirus first, then use
        </button>
      </div>
    </div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
    </div>
  `)
  
  modal.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
      // Disable all options after click
      modal.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none'
      })
      
      const isCorrect = this.getAttribute('data-correct') === 'true'
      
      if (isCorrect) {
        this.classList.add('correct')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message success">
            ✓ Correct! Unknown USB devices are a common attack vector. Never plug in unknown media.
          </div>
        `
        setTimeout(() => {
          completePuzzle(lesson.id)
          closeModal(modal)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Unknown USB devices can contain malware. (Time penalty)
          </div>
        `
        gameState.timeRemaining -= 15
        clampTime()
        setTimeout(() => {
          modal.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'auto'
            opt.classList.remove('incorrect')
          })
          modal.querySelector('#feedback').innerHTML = ''
        }, 2000)
      }
    })
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
}

function renderWifiPuzzle(lesson) {
  const modal = createModal(`
    <h2>📡 ${lesson.title}</h2>
    <p>You're working from the cafe. Available Wi-Fi networks:</p>
    
    <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; margin: 20px 0;">
      <div style="margin-bottom: 15px; padding: 10px; border: 2px solid var(--text-secondary); border-radius: 5px;">
        📶 "Free_Public_WiFi" (No password)
      </div>
      <div style="margin-bottom: 15px; padding: 10px; border: 2px solid var(--text-secondary); border-radius: 5px;">
        📶 "Llama_Corp_VPN" (Requires company credentials)
      </div>
      <div style="margin-bottom: 15px; padding: 10px; border: 2px solid var(--text-secondary); border-radius: 5px;">
        📶 "Cafe_Guest" (No password)
      </div>
    </div>
    
    <div class="quiz-question">
      <h3>Which is safe for company work?</h3>
      <div class="quiz-options">
        <button class="quiz-option" data-correct="false">
          Free_Public_WiFi - it's convenient
        </button>
        <button class="quiz-option" data-correct="true">
          Llama_Corp_VPN - encrypted company connection
        </button>
        <button class="quiz-option" data-correct="false">
          Cafe_Guest - it's provided by the cafe
        </button>
      </div>
    </div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
    </div>
  `)
  
  modal.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
      // Disable all options after click
      modal.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none'
      })
      
      const isCorrect = this.getAttribute('data-correct') === 'true'
      
      if (isCorrect) {
        this.classList.add('correct')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message success">
            ✓ Correct! Always use company VPN on public networks. Public Wi-Fi is unencrypted.
          </div>
        `
        setTimeout(() => {
          completePuzzle(lesson.id)
          closeModal(modal)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Public Wi-Fi is insecure without VPN. (Time penalty)
          </div>
        `
        gameState.timeRemaining -= 15
        clampTime()
        setTimeout(() => {
          modal.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'auto'
            opt.classList.remove('incorrect')
          })
          modal.querySelector('#feedback').innerHTML = ''
        }, 2000)
      }
    })
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
}

function renderIncidentReportingPuzzle(lesson) {
  const modal = createModal(`
    <h2>🚨 ${lesson.title}</h2>
    <p>You noticed suspicious activity: Someone tried to access the server room without authorization.</p>
    
    <div class="quiz-question">
      <h3>What should you do immediately?</h3>
      <div class="quiz-options">
        <button class="quiz-option" data-correct="false">
          Ignore it - security will notice
        </button>
        <button class="quiz-option" data-correct="true">
          Report immediately to IT Security (Canary IT)
        </button>
        <button class="quiz-option" data-correct="false">
          Wait until your next team meeting to mention it
        </button>
        <button class="quiz-option" data-correct="false">
          Investigate it yourself first
        </button>
      </div>
    </div>
    
    <div id="feedback"></div>
    
    <div class="modal-buttons">
      <button class="btn-secondary" id="close-btn">CANCEL</button>
    </div>
  `)
  
  modal.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
      // Disable all options after click
      modal.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none'
      })
      
      const isCorrect = this.getAttribute('data-correct') === 'true'
      
      if (isCorrect) {
        this.classList.add('correct')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message success">
            ✓ Correct! Immediate reporting is critical. Speed of response depends on speed of reporting.
          </div>
        `
        setTimeout(() => {
          completePuzzle(lesson.id)
          closeModal(modal)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Security incidents require immediate reporting. (Time penalty)
          </div>
        `
        gameState.timeRemaining -= 15
        clampTime()
        setTimeout(() => {
          modal.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'auto'
            opt.classList.remove('incorrect')
          })
          modal.querySelector('#feedback').innerHTML = ''
        }, 2000)
      }
    })
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal))
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
  if (index < gameState.encryptedMessage.length && !gameState.decryptedFragments.includes(index)) {
    gameState.decryptedFragments.push(index)
    updateDecryptionTerminal()
  }
}

// ===== LLAMA HINTS =====
function showLlamaHint(index) {
  const hint = document.getElementById('llama-hint')
  const message = document.getElementById('llama-message')
  
  if (!hint || !message) return
  
  message.textContent = llamaHints[index]
  hint.classList.add('active')
  
  setTimeout(() => {
    hint.classList.remove('active')
  }, 5000)
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
  safeLogEvent('game_complete', {
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
