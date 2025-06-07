/**
 * Stardust Blast - Simplified H5 match-3 framework
 * This file contains the core logic for board generation, interaction,
 * matching checks and simple animations using Canvas.
 * Many advanced visual effects can be added on top of this framework.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const COLS = 8;
const ROWS = 8;
const GEM_SIZE = canvas.width / COLS;

const GEM_TYPES = 6; // number of basic colors

// basic colors for placeholder gems
const COLORS = ['#ff5c5c', '#5c9aff', '#5cffc5', '#ffde5c', '#d75cff', '#5cfff1'];

// representation of a gem on the board
class Gem {
    constructor(type) {
        this.type = type; // 0-5 for normal gems
        this.special = null; // 'stripedH', 'stripedV', 'bomb', 'rainbow'
        this.remove = false; // mark for removal during matches
    }
}

// Board handles state and logic
class Board {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        // 2D array of gems
        this.grid = [];
        for (let x = 0; x < cols; x++) {
            this.grid[x] = [];
            for (let y = 0; y < rows; y++) {
                this.grid[x][y] = new Gem(randomGem());
            }
        }
        this.selected = null; // currently selected gem position
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
    }

    // swap two gems on the board
    swap(a, b) {
        const temp = this.grid[a.x][a.y];
        this.grid[a.x][a.y] = this.grid[b.x][b.y];
        this.grid[b.x][b.y] = temp;
    }

    // check for matches and mark gems for removal
    findMatches() {
        // reset removal flags
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                this.grid[x][y].remove = false;
            }
        }

        let matches = [];
        // horizontal check

for (let y = 0; y < this.rows; y++) {
    let runStart = 0;
    for (let x = 1; x <= this.cols; x++) {
        if (x < this.cols && this.grid[x][y].type === this.grid[runStart][y].type) {
            continue;
        }
        const runLength = x - runStart;
        if (runLength >= 3) {
            for (let i = runStart; i < x; i++) {
                this.grid[i][y].remove = true;
            }
            matches.push({ direction: 'H', y, start: runStart, length: runLength });
        }
        runStart = x;
    }
}
        // vertical check
        for (let x = 0; x < this.cols; x++) {
            let runStart = 0;
            for (let y = 1; y <= this.rows; y++) {
                if (y < this.rows && this.grid[x][y].type === this.grid[x][runStart].type) {
                    continue;
                }
                const runLength = y - runStart;
                if (runLength >= 3) {
                    for (let i = runStart; i < y; i++) {
                        this.grid[x][i].remove = true;
                    }
                    matches.push({ direction: 'V', x, start: runStart, length: runLength });
                }
                runStart = y;
            }
        }
        return matches;
    }

    // remove marked gems and collapse board; returns number of removed gems
    collapse() {
        let removed = 0;
        for (let x = 0; x < this.cols; x++) {
            let pointer = this.rows - 1;
            for (let y = this.rows - 1; y >= 0; y--) {
                if (!this.grid[x][y].remove) {
                    this.grid[x][pointer] = this.grid[x][y];
                    pointer--;
                } else {
                    removed++;
                }
            }
            for (let y = pointer; y >= 0; y--) {
                this.grid[x][y] = new Gem(randomGem());
            }
        }
        return removed;
    }
}

// return random gem type index
function randomGem() {
    return Math.floor(Math.random() * GEM_TYPES);
}

let board = new Board(COLS, ROWS);
let score = 0;
let moves = 20;

// draw the board and UI elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw gems
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            drawGem(x, y, board.grid[x][y]);
        }
    }

    requestAnimationFrame(draw);
}

function drawGem(x, y, gem) {
    const px = x * GEM_SIZE + GEM_SIZE / 2;
    const py = y * GEM_SIZE + GEM_SIZE / 2;
    ctx.fillStyle = COLORS[gem.type];
    ctx.beginPath();
    ctx.arc(px, py, GEM_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    if (board.selected && board.selected.x === x && board.selected.y === y) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// mouse input handling
canvas.addEventListener('mousedown', onMouseDown);

function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GEM_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GEM_SIZE);
    if (!board.inBounds(x, y)) return;

    if (!board.selected) {
        board.selected = { x, y };
    } else {
        const dx = Math.abs(board.selected.x - x);
        const dy = Math.abs(board.selected.y - y);
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            // attempt swap
            board.swap(board.selected, { x, y });
            const matches = board.findMatches();
            if (matches.length === 0) {
                // swap back if no match
                board.swap(board.selected, { x, y });
            } else {
                handleMatches(matches);
                moves--;
                document.getElementById('moves-value').textContent = moves;
            }
            board.selected = null;
        } else {
            board.selected = { x, y };
        }
    }
}

// process matches and cascades
function handleMatches(matches) {
    let removed = 0;
    do {
        removed = board.collapse();
        score += removed * 10;
        document.getElementById('score-value').textContent = score;
        matches = board.findMatches();
    } while (removed > 0 && matches.length > 0);
}

draw();
