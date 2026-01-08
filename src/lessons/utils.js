// Shared utility functions for lessons

export function createModal(content) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay active'
  modal.innerHTML = `<div class="modal-content">${content}</div>`
  document.body.appendChild(modal)
  return modal
}

export function closeModal(modal, gameState, resumeTimer) {
  modal.remove()
  resumeTimer()
}

export function applyTimePenalty(gameState, seconds = 15) {
  gameState.timeRemaining -= seconds
}
