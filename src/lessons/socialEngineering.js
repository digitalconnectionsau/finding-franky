import { createModal, closeModal, applyTimePenalty } from './utils.js'

export function renderSocialEngineeringPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
          closeModal(modal, gameState, resumeTimer)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Legitimate IT never asks for passwords. (Time penalty)
          </div>
        `
        applyTimePenalty(gameState, 15)
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
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal, gameState, resumeTimer))
}
