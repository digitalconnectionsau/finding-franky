import { createModal, closeModal, applyTimePenalty } from './utils.js'

export function renderStickyNotePuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
          closeModal(modal, gameState, resumeTimer)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Try again. (Time penalty applied)
          </div>
        `
        applyTimePenalty(gameState, 15)
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
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal, gameState, resumeTimer))
}
