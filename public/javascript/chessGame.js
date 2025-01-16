const socket = io();
const chess = new Chess();
chess.reset(); 
const boardElement = document.querySelector(".chessboard")

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

function getPieceUnicode(square) {
    const pieceMap = {
        'p': { w: '♙', b: '♟' },
        'r': { w: '♖', b: '♜' },
        'n': { w: '♘', b: '♞' },
        'b': { w: '♗', b: '♝' },
        'q': { w: '♕', b: '♛' },
        'k': { w: '♔', b: '♚' }
    };
    return pieceMap[square.type]?.[square.color] || '';
}

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowindex + squareindex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);

                // Update draggable based on playerRole and piece color
                pieceElement.draggable = playerRole === square.color;

                // Add dragstart and dragend event listeners
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                        console.log(`Dragging ${pieceElement.innerText} from ${sourceSquare.row},${sourceSquare.col}`);
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            // Allow drop on squares
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    console.log(`Dropped on ${targetSquare.row},${targetSquare.col}`);
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if(playerRole === "b"){
        boardElement.classList.add("flipped")
    }else{
        boardElement.classList.remove("flipped")
    }
};



renderBoard();

const handleMove = (source,target) => {
const   move ={
    from: `${String.fromCharCode(97+source.col)}${8-source.row}`,
    to:`${String.fromCharCode(97+target.col)}${8-target.row}` ,
    promotion:"q"
}
const result = chess.move(move);
if (!result) {
    console.error(`Invalid move from ${move.from} to ${move.to}`);
    return; // Exit early if the move is invalid
}
socket.emit("move",move);
};

socket.on("playerRole", function(role){
    playerRole = role;
    renderBoard();
})


socket.on("broadState", function(fen){
    chess.load(fen);
    renderBoard();
})

socket.on("move", function(move){
    chess.move(move);
    renderBoard();
})