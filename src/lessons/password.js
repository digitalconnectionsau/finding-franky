import { createModal, closeModal } from './utils.js'

function calculatePasswordStrength(password) {
  let score = 0
  
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  return { score: Math.min(score, 4) }
}

export function renderPasswordPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
    closeModal(modal, gameState, resumeTimer)
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal, gameState, resumeTimer))
}
