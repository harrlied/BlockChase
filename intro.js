function showIntro() {
    document.getElementById('intro-screen').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
}

function startGame() {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    startNewGame();
    // createGameBoard(18, 18); // Adjust the size as needed
}