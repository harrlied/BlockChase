const gameBoard = document.getElementById('game-board');
// const gamesPlayedDisplay = document.getElementById('games-played');
// const movesCountDisplay = document.getElementById('moves-count');
const newGameBtn = document.getElementById('new-game-btn');
// const winMessage = document.getElementById('win-message');

let movesCountDisplay = document.getElementById('moves-count');
let winMessage = document.getElementById('win-message');
let gamesPlayedDisplay = document.getElementById('games-played');

let initialBoardState;
let board;
let player;
let alien;
let horny;
let movesCount = 0;
let gamesPlayed = 0;
let gameWon = false;
let gameLost = false;
// let alienInterval;
// let hornyInterval;
let alienDirection = { x: 0, y: 0 };
let hornyDirection = { x: 0, y: 0 };
let targets = [];
let playerPath = [];
let ghost = null;
// let ghostInterval;
let ghostSpawned = false;

let sleepy = null;
let sleepyState = 'passive';
// let sleepyInterval;
// let sleepyStateInterval;
let lastMoveTime = 0; // to add small delay, so arrows don't fire multiple times while key is held down

let body = null;
// let bodyInterval;
let plague = [];
// let plagueInterval;

let selectedMonsters = [];
let monsterLevels = {};


let lastTime = 0;
let monsterMoveTimers = {};
let gameRunning = false;

let sleepyStateChangeTime = 0;

const BOARD_SIZE = 18;
const SUB_BLOCK_SIZE = 6;

let keys = {};
let footprintCounter = 0;

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function gameLoop(currentTime) {
    if (!gameRunning) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Pelaajan liikkeiden käsittely
    if (keys['ArrowUp']) movePlayer(0, -1);
    if (keys['ArrowDown']) movePlayer(0, 1);
    if (keys['ArrowLeft']) movePlayer(-1, 0);
    if (keys['ArrowRight']) movePlayer(1, 0);

    selectedMonsters.forEach(monster => {
        if (!monsterMoveTimers[monster]) {
            monsterMoveTimers[monster] = 0;
        }

        monsterMoveTimers[monster] += deltaTime;

        const baseInterval = 3000; // 1 sekunti
        const level = monsterLevels[monster] || 3;
        const interval = Math.max(baseInterval / level, 600); // Vähintään 200ms

        if (monsterMoveTimers[monster] >= interval) {
            monsterMoveTimers[monster] = 0; // Nollaa ajastin
            if (monster === 'sleepy') {
                toggleSleepyState(currentTime);
            } else {
                console.log(`Moving ${monster}`);
                moveMonster(monster);
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

function moveMonster(monster) {
    switch(monster) {
        case 'horny':
            moveHorny();
            break;
        case 'alien':
            moveAlien();
            break;
        case 'ghost':
            moveGhost();
            break;
        case 'sleepy':
            if (sleepyState === 'active') {
                moveSleepy();
            }
            toggleSleepyState(); // Vaihda Sleepyn tilaa joka kerta kun sitä yritetään liikuttaa
            break;
        case 'body':
            moveBody();
            break;
        case 'plague':
            movePlague();
            break;

        // Lisää muut monsterit tähän
    }
}


function initializeplague(board) {
    console.log("Initializing Plague");
    let x, y;
    do {
        x = getRandomInt(1, BOARD_SIZE - 2);
        y = getRandomInt(1, BOARD_SIZE - 2);
    } while (board[y][x] !== ' ');

    plague = [{x, y}];
    board[y][x] = 'PL';
    console.log("Plague initialized at:", x, y);
}

function movePlague() {
    console.log("Moving Plague");
    if (gameWon || gameLost || plague.length === 0) return;

    const directions = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];

    const newHead = {
        x: plague[0].x + randomDirection.x,
        y: plague[0].y + randomDirection.y
    };

    if (newHead.x >= 0 && newHead.x < BOARD_SIZE && newHead.y >= 0 && newHead.y < BOARD_SIZE &&
        (board[newHead.y][newHead.x] === ' ' || board[newHead.y][newHead.x] === 'P')) {

        // Kasvata Plaguea joka kerta, mutta rajoita maksimipituuteen
        if (plague.length < 5) {
            plague.unshift(newHead);
            board[newHead.y][newHead.x] = 'PL';
        } else {
            const tail = plague.pop();
            board[tail.y][tail.x] = ' ';
            plague.unshift(newHead);
            board[newHead.y][newHead.x] = 'PL';
        }
    } else {
        // Jos Plague ei voi liikkua, yritä silti kasvaa paikallaan
        if (plague.length < 5) {
            plague.push({...plague[plague.length - 1]});
        }
    }
    console.log("Plague moved to:", newHead);
    checkPlagueCollision();
    drawBoard();
}

// function movePlague() {
//     console.log("Moving Plague");
//     if (gameWon || gameLost || plague.length === 0) return;

//     const directions = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
//     const randomDirection = directions[Math.floor(Math.random() * directions.length)];

//     const newHead = {
//         x: plague[0].x + randomDirection.x,
//         y: plague[0].y + randomDirection.y
//     };

//     if (newHead.x >= 0 && newHead.x < BOARD_SIZE && newHead.y >= 0 && newHead.y < BOARD_SIZE &&
//         (board[newHead.y][newHead.x] === ' ' || board[newHead.y][newHead.x] === 'P')) {

//         // Kasvata Plaguea vain joka toinen liike
//         if (plague.length < 5 && Math.random() < 0.5) {
//             plague.unshift(newHead);
//             board[newHead.y][newHead.x] = 'PL';
//         } else {
//             const tail = plague.pop();
//             board[tail.y][tail.x] = ' ';
//             plague.unshift(newHead);
//             board[newHead.y][newHead.x] = 'PL';
//         }

//         // Tarkista törmäys pelaajan kanssa
//         checkPlagueCollision();

//         drawBoard();
//     }
// }

function checkPlagueCollision() {
    for (let part of plague) {
        if (part.x === player.x && part.y === player.y) {
            gameLost = true;
            winMessage.textContent = 'plague caught you! Game over.';
            stopGame();
            return;
        }
    }
}

function placeBody(board) {
    const startingPoints = [
        {x: 5, y: 5},
        {x: 11, y: 5},
        {x: 5, y: 11},
        {x: 11, y: 11}
    ];

    const index = Math.floor(Math.random() * startingPoints.length);
    const point = startingPoints[index];

    body = {x: point.x, y: point.y};
    board[point.y][point.x] = 'O';
    board[point.y][point.x+1] = 'O1';
    board[point.y+1][point.x] = 'O1';
    board[point.y+1][point.x+1] = 'O1';
    // console.log(`Body placed at (${point.x}, ${point.y})`);
    return true;
}

function isAreaClear(board, x, y, width, height) {
    if (x < 1 || y < 1 || x + width > BOARD_SIZE - 1 || y + height > BOARD_SIZE - 1) {
        return false;
    }
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
        {dx: 1, dy: 0, check: [{x: 2, y: 0}, {x: 2, y: 1}]},
        {dx: -1, dy: 0, check: [{x: -1, y: 0}, {x: -1, y: 1}]},
        {dx: 0, dy: 1, check: [{x: 0, y: 2}, {x: 1, y: 2}]},
        {dx: 0, dy: -1, check: [{x: 0, y: -1}, {x: 1, y: -1}]}
    ];

    const direction = directions[Math.floor(Math.random() * directions.length)];
    const newX = body.x + direction.dx;
    const newY = body.y + direction.dy;

    if (canBodyMove(newX, newY, direction.check)) {
        // Clear old position
        if (board[newY][newX] !== 'B' && board[newY][newX] !== 'BT' &&
            board[newY][newX+1] !== 'B' && board[newY][newX+1] !== 'BT' &&
            board[newY+1][newX] !== 'B' && board[newY+1][newX] !== 'BT' &&
            board[newY+1][newX+1] !== 'B' && board[newY+1][newX+1] !== 'BT') {
            // Liikkumislogiikka...
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    if (board[body.y + dy][body.x + dx] === 'O' || board[body.y + dy][body.x + dx] === 'O1') {
                        board[body.y + dy][body.x + dx] = ' ';
                    }
                }
            }
        }
        // Set new position
        body.x = newX;
        body.y = newY;
        board[body.y][body.x] = 'O';
        board[body.y][body.x+1] = 'O1';
        board[body.y+1][body.x] = 'O1';
        board[body.y+1][body.x+1] = 'O1';

        drawBoard();
    }
}

function canBodyMove(newX, newY, checkPositions) {
    for (let pos of checkPositions) {
        const checkX = newX + pos.x;
        const checkY = newY + pos.y;
        if (checkX < 0 || checkY < 0 || checkX >= BOARD_SIZE || checkY >= BOARD_SIZE ||
            board[checkY][checkX] === 'W' ||
            board[checkY][checkX] === 'B' ||
            board[checkY][checkX] === 'BT' ||
            board[checkY][checkX] === 'T') {
            return false;
        }
    }
    return true;
}

function startGame() {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    selectedMonsters = getSelectedMonsters();
    if (selectedMonsters.length < 4) {
        // Jos valittuja monstereita on alle 4, lisätään puuttuvat satunnaisesti
        const allMonsters = ['horny', 'ghost', 'sleepy', 'alien', 'body', 'plague'];
        while (selectedMonsters.length < 4) {
            const randomMonster = allMonsters[Math.floor(Math.random() * allMonsters.length)];
            if (!selectedMonsters.includes(randomMonster)) {
                selectedMonsters.push(randomMonster);
            }
        }
    }
    monsterLevels = getMonsterLevels();

    // Tarkista, pitääkö nuolinäppäimet näyttää
    const showArrowControls = document.getElementById('show-arrow-controls').checked;
    document.querySelector('.left-controls').style.display = showArrowControls ? 'flex' : 'none';

    startNewGame();
}

function getSelectedMonsters() {
    const monsters = ['horny', 'ghost', 'sleepy', 'alien', 'body', 'plague'];
    return monsters.filter(monster => {
        const checkbox = document.getElementById(`${monster}-check`);
        return checkbox && checkbox.checked;
    });
}

function getMonsterLevels() {
    const levels = {};
    selectedMonsters.forEach(monster => {
        const levelSelect = document.getElementById(`${monster}-level`);
        if (levelSelect) {
            levels[monster] = parseInt(levelSelect.value);
        } else {
            levels[monster] = 3; // Oletustaso, jos valintaelementtiä ei löydy
        }
    });
    return levels;
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
    if (restartGameBtn) restartGameBtn.addEventListener('click', () => startNewGame(false));
    // if (restartGameBtn) restartGameBtn.addEventListener('click', startNewGame);
    if (backToIntroBtn) backToIntroBtn.addEventListener('click', showIntro);

    // Set up keyboard controls
    // document.addEventListener('keydown', handleKeyPress);

    // Set up on-screen control buttons
    ['up', 'left', 'down', 'right'].forEach(direction => {
        const button = document.getElementById(`${direction}-btn`);
        if (button) {
            button.addEventListener('click', () => handleDirectionButton(direction));
        }
    });
}

// function handleKeyPress(event) {
//     switch (event.key) {
//         case 'ArrowUp': movePlayer(0, -1); break;
//         case 'ArrowDown': movePlayer(0, 1); break;
//         case 'ArrowLeft': movePlayer(-1, 0); break;
//         case 'ArrowRight': movePlayer(1, 0); break;
//     }
// }

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
    // console.log("Starting to generate random board");
    const newBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(' '));

    // console.log("Setting up perimeter walls");
    // Set walls around the perimeter
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (y === 0 || y === BOARD_SIZE - 1 || x === 0 || x === BOARD_SIZE - 1) {
                newBoard[y][x] = 'W';
            }
        }
    }

    // console.log("Generating Tetris walls");
    generateTetrisWalls(newBoard);

    // console.log("Attempting to place Body");
    // let bodyPlaced = placeBody(newBoard);
    // console.log(`Body placed: ${bodyPlaced}`);

    // if (!bodyPlaced) {
    //     console.warn("Failed to place Body, continuing without it");
    // }

    // console.log("Placing Player");
    player = placeRandomItem(newBoard, 'P');

    // console.log("Placing other elements");
    // alien = placeRandomItem(newBoard, 'A');
    // setRandomAlienDirection();

    // horny = placeRandomItem(newBoard, 'H');

    // sleepy = placeRandomItem(newBoard, 'S');

    // initializeplague(newBoard);

    selectedMonsters.forEach(monster => {
        switch(monster) {
            case 'horny':
                horny = placeRandomItem(newBoard, 'H');
                break;
            case 'ghost':
                // Ghost ei tarvitse alustusta tässä
                break;
            case 'sleepy':
                sleepy = placeRandomItem(newBoard, 'S');
                break;
            case 'alien':
                alien = placeRandomItem(newBoard, 'A');
                setRandomAlienDirection();
                break;
            case 'body':
                bodyPlaced = placeBody(newBoard);
                break;
            case 'plague':
                initializeplague(newBoard);
                break;
        }
    });

    const numTargets = 3;
    targets = [];
    for (let i = 0; i < numTargets; i++) {
        let target = placeRandomItem(newBoard, 'T');
        targets.push(target);
    }

    for (let i = 0; i < numTargets; i++) {
        placeRandomBox(newBoard, 'B');
    }

    // console.log("Board generation complete");

    // Tallenna alkutila
    initialBoardState = JSON.parse(JSON.stringify(newBoard));

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
    // console.log("Drawing board");
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            switch (board[y][x]) {
                case 'W': cell.classList.add('wall'); break;
                case 'P': cell.classList.add('player'); break;
                case 'B': cell.classList.add('box'); break;
                case 'T': cell.classList.add('target'); break;
                case 'A': cell.classList.add('alien'); break;
                case 'H': cell.classList.add('horny'); break;
                case 'G': cell.classList.add('ghost'); break;
                case 'BT': cell.classList.add('box-on-target'); break;
                case 'S':
                    cell.classList.add('sleepy');
                    cell.style.backgroundImage = `url('${sleepyState === 'passive' ? 'images/sleepy_passive.png' : 'images/sleepy_active.png'}')`;
                    break;
                case 'O':
                    cell.classList.add('body');
                    cell.style.gridColumn = 'span 2';
                    cell.style.gridRow = 'span 2';
                    break;
                case 'O1':
                    continue; // Skip this cell as it's part of the body
                case 'PL':
                    cell.classList.add('plague');
                    break;
                case 'F':
                    cell.style.backgroundImage = "url('images/pawn_print.png')";
                    cell.style.backgroundSize = 'cover';
                    break;
            }
            gameBoard.appendChild(cell);
        }
    }
    // console.log("Board drawing complete");
}

function movePlayer(dx, dy) {
    const now = Date.now();
    if (now - lastMoveTime < 150) return;
    lastMoveTime = now;
    if (gameWon || gameLost) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (board[newY][newX] === 'W' || board[newY][newX] === 'T' || board[newY][newX] === 'BT' ) return;

    if (board[newY][newX] === 'B' || board[newY][newX] === 'BT') {
        const boxNewX = newX + dx;
        const boxNewY = newY + dy;

        if (board[boxNewY][boxNewX] === ' ' || board[boxNewY][boxNewX] === 'T' || board[boxNewY][boxNewX] === 'F' ) {
            board[boxNewY][boxNewX] = board[boxNewY][boxNewX] === 'T' ? 'BT' : 'B';
            board[newY][newX] = board[newY][newX] === 'BT' ? 'T' : ' ';
        } else {
            return;
        }
    }

    if (board[newY][newX] === 'O' || board[newY][newX] === 'O1') {
        gameLost = true;
        winMessage.textContent = 'You ran into the Body! Game over.';
        stopGame();
        return;
    }

    if (board[newY][newX] === 'A' || board[newY][newX] === 'H' || board[newY][newX] === 'PL') {
        gameLost = true;
        winMessage.textContent = 'You ran into a monster! Game over.';
        stopGame();
        return;
    }

    footprintCounter++;
    if (footprintCounter % 5 === 0 && board[player.y][player.x] !== 'F' && board[player.y][player.x] !== 'T') {
        board[player.y][player.x] = 'F';
    } else if (board[player.y][player.x] !== 'T') {
        board[player.y][player.x] = ' ';
    }

    player.x = newX;
    player.y = newY;
    board[player.y][player.x] = 'P';

    playerPath.push({x: newX, y: newY});

    if (!ghostSpawned && playerPath.length === 6) {
        spawnGhost();
    }

    movesCount++;
    movesCountDisplay.textContent = `Moves: ${movesCount}`;
    updateDisplays();

    if (checkWinCondition()) {
        winMessage.textContent = 'You won!';
        gameWon = true;
        stopGame();
    }

    drawBoard();
}

// Lisää tämä funktio
function removeFootprint(x, y) {
    if (board[y][x] === 'F') {
        board[y][x] = ' ';
    }
}

// spawn the ghost , monster that follows player's path
function spawnGhost() {
    if (playerPath.length > 0) {
        const startPos = playerPath[0];
        ghost = {x: startPos.x, y: startPos.y};
        board[ghost.y][ghost.x] = 'G';
        ghostSpawned = true;
        // ghostInterval = setInterval(moveGhost, 1500);
        // Move every 1.5 seconds
    }
}

// move the ghost
function moveGhost() {
    if (gameWon || gameLost || !ghost) return;

    if (playerPath.length > 0) {
        let nextPos;
        do {
            nextPos = playerPath.shift();
        } while (board[nextPos.y][nextPos.x] === 'B' || board[nextPos.y][nextPos.x] === 'BT');

        if (board[ghost.y][ghost.x] !== 'T') {
            board[ghost.y][ghost.x] = ' ';
        }

        ghost.x = nextPos.x;
        ghost.y = nextPos.y;

        if (board[ghost.y][ghost.x] === 'P') {
            gameLost = true;
            winMessage.textContent = 'Ghost got you! Game over.';
            stopGame();
            return;
        }

        if (board[ghost.y][ghost.x] === 'F') {
            // Kasvata Ghostin nopeutta
            monsterLevels['ghost'] = Math.min(monsterLevels['ghost'] + 0.5, 5);
        }

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
            stopGame();
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

function toggleSleepyState(currentTime) {
    if (!sleepy) return;

    if (currentTime - sleepyStateChangeTime >= 5000) { // 5 sekuntia
        sleepyState = sleepyState === 'passive' ? 'active' : 'passive';
        // console.log('Sleepy state changed to:', sleepyState);
        sleepyStateChangeTime = currentTime;

        drawBoard(); // Päivitä lauta näyttääksesi Sleepyn uuden tilan
    }

    if (sleepyState === 'active') {
        moveSleepy();
    }
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
        // clearInterval(alienInterval);
        // clearInterval(hornyInterval);
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
        // clearInterval(alienInterval);
        // clearInterval(hornyInterval);
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
        stopGame();
        return true;
    }
    return false;
}

function updateDisplays() {
    if (movesCountDisplay) {
        movesCountDisplay.textContent = `Moves: ${movesCount}`;
    }
    if (winMessage) {
        winMessage.textContent = '';
    }
    if (gamesPlayedDisplay) {
        gamesPlayedDisplay.textContent = `Games played: ${gamesPlayed}`;
    }
}

function startNewGame(isRandomGame = true) {
    console.log("Starting new game");
    console.log("Selected monsters:", selectedMonsters);

    gameRunning = false;
    monsterMoveTimers = {};
    // lastTime = 0;


    if (isRandomGame) {
        board = generateRandomBoard();
    } else {
        resetCurrentBoard();
    }
    movesCount = 0;
    gamesPlayed++;
    gameWon = false;
    gameLost = false;
    playerPath = [];
    ghost = null;
    ghostSpawned = false;
    // setupIntervals();

    // Poista vanhat intervallit jos niitä on
    stopGame();

    gameRunning = true;
    lastTime = 0;
    requestAnimationFrame(gameLoop);

    updateDisplays();


    drawBoard();
}

function stopGame() {
    gameRunning = false;

    // [alienInterval, hornyInterval, ghostInterval, sleepyInterval, sleepyStateInterval, bodyInterval, plagueInterval].forEach(interval => {
    //     clearInterval(interval);
    // });
    // alienInterval = null;
    // hornyInterval = null;
    // ghostInterval = null;
    // sleepyInterval = null;
    // sleepyStateInterval = null;
    // bodyInterval = null;
    // plagueInterval = null;
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

function resetCurrentBoard() {
    if (initialBoardState) {
        board = JSON.parse(JSON.stringify(initialBoardState));
        player = findPlayerPosition();
        alien = findEntityPosition('A');
        horny = findEntityPosition('H');
        sleepy = findEntityPosition('S');
        body = findBodyPosition();
        targets = findTargets();
        plague = findPlaguePositions();

        movesCount = 0;
        gameWon = false;
        gameLost = false;
        playerPath = [];
        ghost = null;
        ghostSpawned = false;

        stopGame();
        // setupIntervals();

        drawBoard();
        updateDisplays();
    } else {
        console.error("Initial board state not found. Starting a new random game instead.");
        startNewGame(true);
    }
}

function findPlaguePositions() {
    const positions = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 'PL') {
                positions.push({x, y});
            }
        }
    }
    return positions;
}

function findPlayerPosition() {
    return findEntityPosition('P');
}

function findEntityPosition(entity) {
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === entity) {
                return {x, y};
            }
        }
    }
    return null;
}

function findBodyPosition() {
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 'O') {
                return {x, y};
            }
        }
    }
    return null;
}

function findTargets() {
    const targets = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 'T') {
                targets.push({x, y});
            }
        }
    }
    return targets;
}

// function setupIntervals() {
//     stopGame();

//     setTimeout(() => {
//         selectedMonsters.forEach(monster => {
//             const baseInterval = 5000; // 1 sekunti
//             const level = monsterLevels[monster] || 3; // Käytä oletustasoa 3, jos tasoa ei ole määritelty
//             const interval = Math.max(baseInterval / level, 1000); // Vähintään 1 sekunti

//             switch(monster) {
//                 case 'horny':
//                     hornyInterval = setInterval(moveHorny, interval);
//                     break;
//                 case 'ghost':
//                     // Ghost käyttää omaa logiikkaansa
//                     break;
//                 case 'sleepy':
//                     sleepyStateInterval = setInterval(toggleSleepyState, 5000);
//                     break;
//                 case 'alien':
//                     alienInterval = setInterval(moveAlien, interval);
//                     break;
//                 case 'body':
//                     bodyInterval = setInterval(moveBody, interval * 2);
//                     break;
//                 case 'plague':
//                     plagueInterval = setInterval(movePlague, interval * 1.5);
//                     break;
//             }
//         });
//     }, 1000); // 1 sekunnin viive
// }



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

// Make sure to call startNewGame when the page loads
window.onload = function() {
    setupEventListeners();
    // The game will start when the "Start Game" button is clicked
};

function animateRandomMonster() {
    const monsters = document.querySelectorAll('.monster img');
    const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];

    randomMonster.classList.add('floating');

    setTimeout(() => {
        randomMonster.classList.remove('floating');
        setTimeout(animateRandomMonster, 500);
    }, 2000);
}

if (document.getElementById('intro-screen')) {
    animateRandomMonster();
}


