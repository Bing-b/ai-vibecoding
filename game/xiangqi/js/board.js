/**
 * Xiangqi Board Manager
 */

class XiangqiBoard {
  constructor() {
    this.grid = this.getInitialGrid();
    this.turn = RED;
    this.moveHistory = [];
    this.capturedRed = [];
    this.capturedBlack = [];
  }

  getInitialGrid() {
    return INITIAL_BOARD.map(row => [...row]);
  }

  reset() {
    this.grid = this.getInitialGrid();
    this.turn = RED;
    this.moveHistory = [];
    this.capturedRed = [];
    this.capturedBlack = [];
  }

  getPiece(r, c) {
    if (!Rules.isValidPos(r, c)) return null;
    return this.grid[r][c];
  }

  executeMove(move) {
    const notation = Rules.generateNotation(this.grid, move);
    const piece = this.grid[move.fromR][move.fromC];
    const captured = this.grid[move.toR][move.toC];

    // Apply move
    this.grid[move.toR][move.toC] = piece;
    this.grid[move.fromR][move.fromC] = null;

    if (captured) {
      if (captured[0] === RED) {
        this.capturedRed.push(captured);
      } else {
        this.capturedBlack.push(captured);
      }
    }

    const moveRecord = {
      move,
      piece,
      captured,
      notation,
      turn: this.turn
    };

    this.moveHistory.push(moveRecord);

    // Switch turn
    this.turn = this.turn === RED ? BLACK : RED;

    return moveRecord;
  }

  undoMove() {
    if (this.moveHistory.length === 0) return null;

    const record = this.moveHistory.pop();
    const { move, piece, captured, turn } = record;

    this.grid[move.fromR][move.fromC] = piece;
    this.grid[move.toR][move.toC] = captured;

    if (captured) {
      if (captured[0] === RED) {
        this.capturedRed.pop();
      } else {
        this.capturedBlack.pop();
      }
    }

    this.turn = turn;
    return record;
  }

  getLastMove() {
    if (this.moveHistory.length === 0) return null;
    return this.moveHistory[this.moveHistory.length - 1].move;
  }
}
