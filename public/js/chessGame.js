const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let currentTurn = 'w'; // Start with white's turn

// Render the chessboard
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", 
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.textContent = getPieceUnicode(square); // Add piece symbol

                pieceElement.setAttribute('draggable', true);

                pieceElement.addEventListener('dragstart', (e) => {
                    draggedPiece = pieceElement;
                    sourceSquare = squareElement.dataset.row + squareElement.dataset.col;
                });

                squareElement.appendChild(pieceElement);
            }
            
            boardElement.appendChild(squareElement);
        });
    });

    // Update turn display
    document.getElementById("turn-display").textContent = `It's ${currentTurn === 'w' ? "White's" : "Black's"} turn`;
};

// Get Unicode for the chess pieces
const getPieceUnicode = (square) => {
    const PIECES = {
        'k': { 'w': '♔', 'b': '♚' },
        'q': { 'w': '♕', 'b': '♛' },
        'r': { 'w': '♖', 'b': '♜' },
        'b': { 'w': '♗', 'b': '♝' },
        'n': { 'w': '♘', 'b': '♞' },
        'p': { 'w': '♙', 'b': '♟' }
    };
    return PIECES[square.type.toLowerCase()][square.color];
};

// Handle drag-and-drop logic for piece movement
const handleMove = (event) => {
    event.preventDefault();
    const targetSquare = event.target;
    
    if (draggedPiece && sourceSquare) {
        const move = {
            from: sourceSquare, // From square (e.g. "a2")
            to: targetSquare.dataset.row + targetSquare.dataset.col // To square (e.g. "a4")
        };

        if (chess.move(move)) {
            socket.emit('move', move); // Send move to the server
            currentTurn = currentTurn === 'w' ? 'b' : 'w'; // Toggle turn
            renderBoard();
        }

        draggedPiece = null;
        sourceSquare = null;
    }
};

// Add event listener for dropping pieces
boardElement.addEventListener('dragover', (e) => e.preventDefault());
boardElement.addEventListener('drop', handleMove);

// Listen for move events from other players
socket.on('move', (move) => {
    chess.move(move);
    currentTurn = currentTurn === 'w' ? 'b' : 'w'; // Toggle turn after move
    renderBoard();
});

// Listen for color assignment from the server
socket.on('color', (color) => {
    playerRole = color;
    console.log(`You are playing as ${color === 'w' ? "White" : "Black"}`);
});

// Listen for the initial game state from the server
socket.on('gameState', (fen) => {
    chess.load(fen);
    renderBoard();
});

document.head.insertAdjacentHTML('beforeend', `
<style>
    body {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background-color: #2f2f2f;
    }

    .chessboard {
        display: grid;
        grid-template-columns: repeat(8, 60px);
        grid-template-rows: repeat(8, 60px);
        gap: 0;
        border: 4px solid #333;
        border-radius: 8px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
    }

    .square {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 32px;
    }

    .light {
        background-color: #f0d9b5;
    }

    .dark {
        background-color: #b58863;
    }

    .piece {
        cursor: pointer;
    }
</style>
`);

// Add a display for the current turn
document.body.insertAdjacentHTML('beforeend', `
<div id="turn-display" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); font-size: 20px; color: white;">
    It's White's turn
</div>
`);

renderBoard();
