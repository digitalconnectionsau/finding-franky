import { createModal, closeModal, applyTimePenalty } from './utils.js'

export function renderPhishingPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
          closeModal(modal, gameState, resumeTimer)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Look for red flags: domain, urgency, password requests. (Time penalty)
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
