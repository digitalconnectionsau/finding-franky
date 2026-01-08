import { createModal, closeModal, applyTimePenalty } from './utils.js'

export function renderWifiPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
          closeModal(modal, gameState, resumeTimer)
        }, 2000)
      } else {
        this.classList.add('incorrect')
        modal.querySelector('#feedback').innerHTML = `
          <div class="feedback-message error">
            Incorrect. Public Wi-Fi is insecure without VPN. (Time penalty)
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
