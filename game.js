const gameBoard = document.getElementById('game-board');
const gamesPlayedDisplay = document.getElementById('games-played');
const movesCountDisplay = document.getElementById('moves-count');
const newGameBtn = document.getElementById('new-game-btn');
// const restartGameBtn = document.getElementById('restart-game-btn');
// const randomGameBtn = document.getElementById('new-random-game-btn');
const winMessage = document.getElementById('win-message');

let board;
let player;
let alien;
let horny;
let movesCount = 0;
let gamesPlayed = 0;
let gameWon = false;
let gameLost = false;
let alienInterval;
let hornyInterval;
let alienDirection = { x: 0, y: 0 };
let hornyDirection = { x: 0, y: 0 };
let targets = [];
let playerPath = [];
let ghost = null;
let ghostInterval;
let ghostSpawned = false;

let sleepy = null;
let sleepyState = 'passive';
let sleepyInterval;
let sleepyStateInterval;
let lastMoveTime = 0; // to add small delay, so arrows don't fire multiple times while key is held down

let body = null;
let bodyInterval;

const BOARD_SIZE = 18;
const SUB_BLOCK_SIZE = 6;


function placeBody(board) {
    const startingPoints = [
        {x: 5, y: 5},
        {x: 11, y: 5},
        {x: 5, y: 11},
        {x: 11, y: 11}
    ];

    const index = Math.floor(Math.random() * startingPoints.length);
    const point = startingPoints[index];

    console.log(`Attempting to place Body at (${point.x}, ${point.y})`);

    if (isAreaClear(board, point.x, point.y, 2, 2)) {
        body = {x: point.x, y: point.y};
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                board[point.y + dy][point.x + dx] = 'O';
            }
        }
        console.log(`Body successfully placed at (${point.x}, ${point.y})`);
        return true;
    }
    console.log(`Failed to place Body at (${point.x}, ${point.y})`);
    return false;
}

function isAreaClear(board, x, y, width, height) {
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            if (board[y + dy][x + dx] !== ' ') {
                return false;
            }
        }
    }
    return true;
}

function moveBody() {
    if (gameWon || gameLost) return;

    const directions = [
        {dx: 1, dy: 0},
        {dx: -1, dy: 0},
        {dx: 0, dy: 1},
        {dx: 0, dy: -1}
    ];

    const direction = directions[Math.floor(Math.random() * directions.length)];
    const newX = body.x + direction.dx;
    const newY = body.y + direction.dy;

    if (isAreaClear(newX, newY, 2, 2) && newX > 0 && newX < BOARD_SIZE - 2 && newY > 0 && newY < BOARD_SIZE - 2) {
        // Clear old position
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                board[body.y + dy][body.x + dx] = ' ';
            }
        }

        // Set new position
        body.x = newX;
        body.y = newY;
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                board[body.y + dy][body.x + dx] = 'O';
            }
        }

        drawBoard();
    }
}



function startGame() {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    startNewGame();
    // setupEventListeners();
}



function isNearBody(x, y) {
    if (!body) return false;
    return Math.abs(x - body.x) < 2 && Math.abs(y - body.y) < 2;
}


function setupEventListeners() {
    const newRandomGameBtn = document.getElementById('new-random-game-btn');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const backToIntroBtn = document.getElementById('back-to-intro-btn');

    if (newRandomGameBtn) newRandomGameBtn.addEventListener('click', startNewGame);
    if (restartGameBtn) restartGameBtn.addEventListener('click', startNewGame);
    if (backToIntroBtn) backToIntroBtn.addEventListener('click', showIntro);

    // Set up keyboard controls
    document.addEventListener('keydown', handleKeyPress);

    // Set up on-screen control buttons
    ['up', 'down', 'left', 'right'].forEach(direction => {
        const button = document.getElementById(`${direction}-btn`);
        if (button) {
            button.addEventListener('click', () => handleDirectionButton(direction));
        }
    });
}

function handleKeyPress(event) {
    switch (event.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
    }
}

function handleDirectionButton(direction) {
    switch(direction) {
        case 'up': movePlayer(0, -1); break;
        case 'down': movePlayer(0, 1); break;
        case 'left': movePlayer(-1, 0); break;
        case 'right': movePlayer(1, 0); break;
    }
}


function showIntro() {
    document.getElementById('intro-screen').style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
}

function generateRandomBoard() {
    console.log("Starting to generate random board");
    const newBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(' '));

    console.log("Setting up perimeter walls");
    // Set walls around the perimeter
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (y === 0 || y === BOARD_SIZE - 1 || x === 0 || x === BOARD_SIZE - 1) {
                newBoard[y][x] = 'W';
            }
        }
    }

    console.log("Generating Tetris walls");
    // Generate Tetris-shaped walls
    generateTetrisWalls(newBoard);
    // generateRandomWalls(newBoard, numWalls);

    // console.log("Attempting to place Body");
    // let bodyPlaced = placeBody(newBoard);
    // console.log(`Body placed: ${bodyPlaced}`);

    // if (!bodyPlaced) {
    //     console.warn("Failed to place Body, continuing without it");
    // }

    // Place Body
    // let bodyPlaced = false;
    // let attempts = 0;
    // while (!bodyPlaced && attempts < 10) {
    //     bodyPlaced = placeBody(newBoard);
    //     attempts++;
    // }
    // console.log(`Body placed: ${bodyPlaced}, attempts: ${attempts}`);

    // if (!bodyPlaced) {
    //     console.error("Failed to place Body after 10 attempts");
    // }

    console.log("Placing Player");


    // Place Player
    do {
        player = placeRandomItem(newBoard, 'P');
    } while (isNearBody(player.x, player.y));

    console.log("Placing other elements");
    // Place Alien
    do {
        alien = placeRandomItem(newBoard, 'A');
    } while (Math.abs(alien.x - player.x) <= 1 && Math.abs(alien.y - player.y) <= 1);
    // alien = placeRandomItem(newBoard, 'A');
    setRandomAlienDirection();

    // Place Horny
    do {
        horny = placeRandomItem(newBoard, 'H');
    } while (Math.abs(horny.x - player.x) <= 1 && Math.abs(horny.y - player.y) <= 1);
    // horny = placeRandomItem(newBoard, 'H');

    // Place Sleepy
    sleepy = null; // Reset sleepy before placing
    do {
        sleepy = placeRandomItem(newBoard, 'S');
    } while (Math.abs(sleepy.x - player.x) <= 2 && Math.abs(sleepy.y - player.y) <= 2);

    // number of boxes and targets on the board
    const numTargets = 3;
    targets = [];
    for (let i = 0; i < numTargets; i++) {
        let target;
        do {
            target = placeRandomItem(newBoard, 'T');
        } while (targets.some(t => t.x === target.x && t.y === target.y));
        targets.push(target);
    }

    for (let i = 0; i < numTargets; i++) {
        placeRandomBox(newBoard, 'B');
    }
    console.log("Board generation complete");
    return newBoard;
}

function generateTetrisWalls(board) {
    const tetrisPieces = [
        [[1,1],[1,1]],  // Square
        [[1,1,1,1]],    // I
        [[1,1,1],[0,1,0]],  // T
        [[1,1,0],[0,1,1]],  // Z
        [[0,1,1],[1,1,0]],  // S
        [[1,0,0],[1,1,1]],  // L
        [[0,0,1],[1,1,1]]   // J
    ];

    for (let blockY = 0; blockY < 3; blockY++) {
        for (let blockX = 0; blockX < 3; blockX++) {
            const piece = tetrisPieces[Math.floor(Math.random() * tetrisPieces.length)];
            const rotation = Math.floor(Math.random() * 4);
            const rotatedPiece = rotatePiece(piece, rotation);

            const startY = blockY * SUB_BLOCK_SIZE + Math.floor((SUB_BLOCK_SIZE - rotatedPiece.length) / 2);
            const startX = blockX * SUB_BLOCK_SIZE + Math.floor((SUB_BLOCK_SIZE - rotatedPiece[0].length) / 2);

            placePiece(board, rotatedPiece, startY, startX);
        }
    }
}

function rotatePiece(piece, rotation) {
    for (let i = 0; i < rotation; i++) {
        piece = piece[0].map((_, colIndex) => piece.map(row => row[colIndex]).reverse());
    }
    return piece;
}

function placePiece(board, piece, startY, startX) {
    for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
            if (piece[y][x] === 1) {
                board[startY + y][startX + x] = 'W';
            }
        }
    }
}


function generateRandomWalls(board, numWalls) {
    const edges = ['left', 'right', 'top', 'bottom'];
    const usedEdges = [];

    for (let i = 0; i < numWalls; i++) {
        let edge;
        do {
            edge = edges[getRandomInt(0, edges.length - 1)];
        } while (usedEdges.includes(edge));
        usedEdges.push(edge);

        let start, wallLength;
        switch (edge) {
            case 'left':
                start = getRandomInt(2, board.length - 4);
                wallLength = getRandomInt(2, 3);
                for (let j = 0; j < wallLength; j++) {
                    if (board[start + j][1] === ' ') {
                        board[start + j][1] = 'W';
                    }
                }
                break;
            case 'right':
                start = getRandomInt(2, board.length - 4);
                wallLength = getRandomInt(2, 3);
                for (let j = 0; j < wallLength; j++) {
                    if (board[start + j][board[0].length - 2] === ' ') {
                        board[start + j][board[0].length - 2] = 'W';
                    }
                }
                break;
            case 'top':
                start = getRandomInt(2, board[0].length - 4);
                wallLength = getRandomInt(2, 3);
                for (let j = 0; j < wallLength; j++) {
                    if (board[1][start + j] === ' ') {
                        board[1][start + j] = 'W';
                    }
                }
                break;
            case 'bottom':
                start = getRandomInt(2, board[0].length - 4);
                wallLength = getRandomInt(2, 3);
                for (let j = 0; j < wallLength; j++) {
                    if (board[board.length - 2][start + j] === ' ') {
                        board[board.length - 2][start + j] = 'W';
                    }
                }
                break;
        }
    }
}

function placeRandomItem(board, item) {
    let x, y;
    let attempts = 0;
    do {
        x = getRandomInt(1, board[0].length - 2);
        y = getRandomInt(1, board.length - 2);
        attempts++;
        if (attempts > 100) {
            console.warn(`Failed to place ${item} after 100 attempts`);
            return null;
        }
    } while (board[y][x] !== ' ' || isNearBody(x,y));
    board[y][x] = item;
    return { x, y };
}

function placeRandomBox(board, item) {
    let x, y;
    do {
        x = getRandomInt(1, board[0].length - 2);
        y = getRandomInt(1, board.length - 2);
    } while (board[y][x] !== ' ' || isAdjacentToWall(board, x, y));
    board[y][x] = item;
    return { x, y };
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isAdjacentToWall(board, x, y) {
    const adjacentCells = [
        board[y - 1][x],
        board[y + 1][x],
        board[y][x - 1],
        board[y][x + 1]
    ];
    return adjacentCells.includes('W');
}

function drawBoard() {
    console.log("Drawing board");
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${board[0].length}, 1fr)`;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            switch (board[y][x]) {
                case 'W': cell.classList.add('wall'); break;  // W = Wall
                case 'P': cell.classList.add('player'); break; // P = Player
                case 'B': cell.classList.add('box'); break; // B = Box
                case 'T': cell.classList.add('target'); break; // T = Target
                case 'A': cell.classList.add('alien'); break; // A = Alien, was M = pacman1
                case 'H': cell.classList.add('horny'); break; // H = Horny, was N = pacman2
                case 'G': cell.classList.add('ghost'); break;  // G = ghost
                case 'BT': cell.classList.add('box-on-target'); break; // BT = Box on Target
                case 'S':                                               // S = Sleepy
                    cell.classList.add('sleepy');
                    cell.style.backgroundImage = `url('${sleepyState === 'passive' ? 'sleepy_passive.png' : 'sleepy_active.png'}')`;
                    break;
                case 'O':
                    if (x === body.x && y === body.y) {
                        cell.classList.add('body');
                        cell.style.gridColumn = 'span 2';
                        cell.style.gridRow = 'span 2';
                        x++; // Skip the next cell
                    }
                    break;
            }

            gameBoard.appendChild(cell);
        }
    }
    console.log("Board drawing complete");
}
function movePlayer(dx, dy) {
    const now = Date.now();
    if (now - lastMoveTime < 150) return; // Prevent moves less than 150ms apart
    lastMoveTime = now;
    if (gameWon || gameLost) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (board[newY][newX] === 'W' || board[newY][newX] === 'T' || board[newY][newX] === 'BT') return;

    if (board[newY][newX] === 'B' || board[newY][newX] === 'BT') {
        const boxNewX = newX + dx;
        const boxNewY = newY + dy;

        if (board[boxNewY][boxNewX] === ' ' || board[boxNewY][boxNewX] === 'T') {
            board[boxNewY][boxNewX] = board[boxNewY][boxNewX] === 'T' ? 'BT' : 'B';
            board[newY][newX] = board[newY][newX] === 'BT' ? 'T' : ' ';
        } else {
            return;
        }
    }
    if (board[newY][newX] === 'O') {
        gameLost = true;
        winMessage.textContent = 'You ran into the Body! Game over.';
        clearAllIntervals();
        return;
    }


    if (board[newY][newX] === 'A' || board[newY][newX] === 'H') {
        gameLost = true;
        winMessage.textContent = 'You ran into a monster! Game over.';
        clearInterval(alienInterval);
        clearInterval(hornyInterval);
        return;
    }

    board[player.y][player.x] = board[player.y][player.x] === 'T' ? 'T' : ' ';
    player.x = newX;
    player.y = newY;
    board[player.y][player.x] = 'P';

    // Store the player's position in the path
    playerPath.push({x: newX, y: newY});

    // Check if it's time to spawn the ghost
    if (!ghostSpawned && playerPath.length === 6) {
        spawnGhost();
    }

    movesCount++;
    movesCountDisplay.textContent = `Moves: ${movesCount}`;

    if (checkWinCondition()) {
        winMessage.textContent = 'You won!';
        gameWon = true;
        clearInterval(alienInterval);
        clearInterval(hornyInterval);
    }

    drawBoard();
}

// spawn the ghost , monster that follows player's path
function spawnGhost() {
    if (playerPath.length > 0) {
        const startPos = playerPath[0];
        ghost = {x: startPos.x, y: startPos.y};
        board[ghost.y][ghost.x] = 'G';
        ghostSpawned = true;
        ghostInterval = setInterval(moveGhost, 1500); // Move every 1.5 seconds
    }
}

// move the ghost
function moveGhost() {
    if (gameWon || gameLost) return;

    if (playerPath.length > 0) {
        const nextPos = playerPath.shift();

        if (nextPos.x === player.x && nextPos.y === player.y) {
            gameLost = true;
            winMessage.textContent = 'Ghost got you! Game over.';
            clearAllIntervals();
            return;
        }

        board[ghost.y][ghost.x] = ' ';
        ghost.x = nextPos.x;
        ghost.y = nextPos.y;
        board[ghost.y][ghost.x] = 'G';

        drawBoard();
    }
}

function moveSleepy() {
    if (gameWon || gameLost) return;

    if (sleepyState === 'active') {
        const dx = player.x > sleepy.x ? 1 : player.x < sleepy.x ? -1 : 0;
        const dy = player.y > sleepy.y ? 1 : player.y < sleepy.y ? -1 : 0;

        const newX = sleepy.x + dx;
        const newY = sleepy.y + dy;

        if (newX === player.x && newY === player.y) {
            gameLost = true;
            winMessage.textContent = 'Sleepy caught you! Game over.';
            clearAllIntervals();
            return;
        }

        if (board[newY][newX] === ' ' || board[newY][newX] === 'P') {
            board[sleepy.y][sleepy.x] = ' ';
            sleepy.x = newX;
            sleepy.y = newY;
            board[sleepy.y][sleepy.x] = 'S';
        }
    }

    drawBoard();
}

function toggleSleepyState() {
    if (!sleepy) return;

    sleepyState = sleepyState === 'passive' ? 'active' : 'passive';
    console.log('Sleepy state changed to:', sleepyState); // Debugging log

    if (sleepyState === 'active') {
        sleepyInterval = setInterval(moveSleepy, 400); // Move every 200ms when active
    } else {
        clearInterval(sleepyInterval);
    }
    drawBoard(); // Redraw to update Sleepy's appearance
}

function setRandomAlienDirection() {
    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];
    alienDirection = directions[getRandomInt(0, directions.length - 1)];
}

function moveAlien() {
    if (gameWon || gameLost) return;

    const newX = alien.x + alienDirection.x;
    const newY = alien.y + alienDirection.y;

    if (newX === player.x && newY === player.y) {
        gameLost = true;
        winMessage.textContent = 'Alien grabbed you! Game over.';
        clearInterval(alienInterval);
        clearInterval(hornyInterval);
        return;
    }

    if (board[newY][newX] === ' ' || board[newY][newX] === 'P' || board[newY][newX] === 'A' || board[newY][newX] === 'H') {
        board[alien.y][alien.x] = ' ';
        alien.x = newX;
        alien.y = newY;
        board[alien.y][alien.x] = 'A';

        // Check if alien entered a new sub-block
        if (alien.x % SUB_BLOCK_SIZE === 0 || alien.y % SUB_BLOCK_SIZE === 0) {
            setRandomAlienDirection();
        }
    } else {
        setRandomAlienDirection();
    }

    drawBoard();
}
function moveHorny() {
    if (gameWon || gameLost) return;

    let dx = player.x > horny.x ? 1 : player.x < horny.x ? -1 : 0;
    let dy = player.y > horny.y ? 1 : player.y < horny.y ? -1 : 0;

    let newX = horny.x + dx;
    let newY = horny.y + dy;

    if (newX === player.x && newY === player.y) {
        gameLost = true;
        winMessage.textContent = 'Horny caught you! Game over.';
        clearInterval(alienInterval);
        clearInterval(hornyInterval);
        return;
    }

    if (board[newY][newX] === ' ' || board[newY][newX] === 'P' || board[newY][newX] === 'A') {
        board[horny.y][horny.x] = ' ';
        horny.x = newX;
        horny.y = newY;
        board[horny.y][horny.x] = 'H';
    } else {
        // If Horny can't move towards the player, move randomly
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        let moved = false;
        while (!moved && directions.length > 0) {
            const randomIndex = Math.floor(Math.random() * directions.length);
            const randomDirection = directions[randomIndex];
            newX = horny.x + randomDirection.x;
            newY = horny.y + randomDirection.y;

            if (board[newY][newX] === ' ' || board[newY][newX] === 'P' || board[newY][newX] === 'A') {
                board[horny.y][horny.x] = ' ';
                horny.x = newX;
                horny.y = newY;
                board[horny.y][horny.x] = 'H';
                moved = true;
            } else {
                directions.splice(randomIndex, 1);
            }
        }
    }

    drawBoard();
}

function checkWinCondition() {
    if (targets.every(({ x, y }) => board[y][x] === 'BT')) {
        clearAllIntervals();
        return true;
    }
    return false;
}

function startNewGame() {
    console.log("Starting new game");
    board = generateRandomBoard();
    console.log("Board generated");
    movesCount = 0;
    gameWon = false;
    gameLost = false;
    playerPath = [];
    ghost = null;
    ghostSpawned = false;
    movesCountDisplay.textContent = `Moves: ${movesCount}`;
    winMessage.textContent = '';

    clearAllIntervals();
    // placeBody();
    // clearInterval(bodyInterval);
    // bodyInterval = setInterval(moveBody, 2000); // Move every 2 seconds

    setRandomAlienDirection();
    alienInterval = setInterval(moveAlien, 500);
    hornyInterval = setInterval(moveHorny, 1000);
    sleepyState = 'passive';
    clearInterval(sleepyStateInterval);

    sleepyStateInterval = setInterval(toggleSleepyState, 5000); // Toggle state every 5 seconds

    console.log("Drawing board");
    drawBoard();
    console.log("Board drawn");
}

function clearAllIntervals() {
    clearInterval(alienInterval);
    clearInterval(hornyInterval);
    clearInterval(ghostInterval);
    clearInterval(sleepyInterval);
    clearInterval(sleepyStateInterval);
    clearInterval(bodyInterval);
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
    }
    event.preventDefault(); // Prevent default scrolling behaviour
});

// newGameBtn.addEventListener('click', () => {
//     gamesPlayed++;
//     gamesPlayedDisplay.textContent = `Games played: ${gamesPlayed}`;
//     startNewGame();
// });

function createGameBoard(width, height) {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = ''; // Clear the board before creating a new one
    gameBoard.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${height}, 1fr)`;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            gameBoard.appendChild(cell);
        }
    }
}


document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();

    // Check if we should start the game immediately or show the intro screen
    const gameContainer = document.getElementById('game-container');
    const introScreen = document.getElementById('intro-screen');

    if (gameContainer && gameContainer.style.display !== 'none') {
        startNewGame();
    } else if (introScreen) {
        showIntro();
    }
});

// randomGameBtn.addEventListener('click2', () => {
//     gamesPlayed++;
//     gamesPlayedDisplay.textContent = `Games played: ${gamesPlayed}`;
//     startNewGame();
// });

// restartGameBtn.addEventListener('click', () => {
//     gamesPlayed++;
//     gamesPlayedDisplay.textContent = `Games played: ${gamesPlayed}`;
//     startNewGame();
// });

// Make sure to call startNewGame when the page loads
window.onload = function() {
    setupEventListeners();
    // The game will start when the "Start Game" button is clicked
};
// window.onload = startNewGame;
