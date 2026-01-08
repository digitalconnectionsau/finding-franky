import './style.css'

// Game state
const gameState = {
  puzzlesSolved: 0,
  totalPuzzles: 1,
  currentPuzzle: 1
};

// Correct answer (number of letters in "Frankie")
const CORRECT_CODE = 7;

// Initialize the game
function init() {
  const submitButton = document.getElementById('submit-code');
  const codeInput = document.getElementById('code-input');
  
  submitButton.addEventListener('click', checkCode);
  
  // Allow Enter key to submit
  codeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkCode();
    }
  });
}

// Check if the code is correct
function checkCode() {
  const input = document.getElementById('code-input');
  const feedback = document.getElementById('feedback');
  const userCode = parseInt(input.value);
  
  if (isNaN(userCode)) {
    showFeedback('Please enter a number!', 'error');
    return;
  }
  
  if (userCode === CORRECT_CODE) {
    showFeedback('🎉 Correct! The code is 7 (F-R-A-N-K-I-E). You\'ve unlocked the first clue!', 'success');
    gameState.puzzlesSolved++;
    updateProgress();
    
    // Unlock next part of the story
    setTimeout(() => {
      unlockNextPart();
    }, 2000);
  } else {
    showFeedback('❌ Incorrect code. Think about the hint...', 'error');
  }
}

// Show feedback message
function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

// Update progress counter
function updateProgress() {
  const solvedCount = document.getElementById('solved-count');
  solvedCount.textContent = gameState.puzzlesSolved;
}

// Unlock next part of the game
function unlockNextPart() {
  const storyText = document.getElementById('story-text');
  const puzzleContainer = document.querySelector('.puzzle-container');
  
  // Update story
  storyText.innerHTML = `
    <p>Excellent work! The safe opens with a satisfying click.</p>
    <p>Inside, you find a photograph of Frankie and a note: "Meet me where the sun sets over the city skyline."</p>
    <p><strong>🎊 You've completed the first puzzle! More adventures await...</strong></p>
  `;
  
  // Hide the puzzle
  puzzleContainer.style.opacity = '0.5';
  puzzleContainer.style.pointerEvents = 'none';
  
  // Add continue message
  const continueMsg = document.createElement('div');
  continueMsg.className = 'story-section';
  continueMsg.style.marginTop = '2rem';
  continueMsg.innerHTML = `
    <p style="text-align: center; font-size: 1.2rem; color: #2ecc71;">
      <strong>To be continued...</strong><br>
      <span style="font-size: 0.9rem; color: #95a5a6;">More puzzles coming soon!</span>
    </p>
  `;
  
  document.querySelector('.game-area').appendChild(continueMsg);
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
