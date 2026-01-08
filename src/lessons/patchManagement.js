import { createModal, closeModal, applyTimePenalty } from './utils.js'

export function renderPatchPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
        closeModal(modal, gameState, resumeTimer)
      }, 2000)
    } else {
      modal.querySelector('#feedback').innerHTML = `
        <div class="feedback-message error">
          ❌ Incorrect selection. Focus on security-critical updates only.
        </div>
      `
      applyTimePenalty(gameState, 15)
      setTimeout(() => {
        modal.querySelector('#feedback').innerHTML = ''
      }, 2000)
    }
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal, gameState, resumeTimer))
}
