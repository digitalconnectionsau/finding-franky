import { createModal, closeModal, applyTimePenalty } from './utils.js'

export function renderUSBPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
          closeModal(modal, gameState, resumeTimer)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Unknown USB devices can contain malware. (Time penalty)
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
