import { createModal, closeModal, applyTimePenalty } from './utils.js'

export function renderMFAPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 10px;">
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
        closeModal(modal, gameState, resumeTimer)
      }, 2000)
    } else {
      modal.querySelector('#feedback').innerHTML = `
        <div class="feedback-message error">
          ❌ Invalid code. Check the displayed number carefully.
        </div>
      `
      applyTimePenalty(gameState, 10)
    }
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal, gameState, resumeTimer))
}
