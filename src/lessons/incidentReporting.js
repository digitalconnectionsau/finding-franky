import { createModal, closeModal, applyTimePenalty } from './utils.js'

export function renderIncidentReportingPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
          closeModal(modal, gameState, resumeTimer)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Security incidents require immediate reporting. (Time penalty)
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
