import { createModal, closeModal } from './utils.js'

export function renderCleanDeskPuzzle(lesson, gameState, completePuzzle, resumeTimer) {
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
  
  // Make the modal wider for better drag-drop experience
  modal.querySelector('.modal-content').classList.add('modal-wide')
  
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
      closeModal(modal, gameState, resumeTimer)
    }, 2000)
  })
  
  modal.querySelector('#close-btn').addEventListener('click', () => closeModal(modal, gameState, resumeTimer))
}
