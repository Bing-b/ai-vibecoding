/**
 * Xiangqi Move Validation & Notation Logic
 */

class Rules {
  static getSide(piece) {
    if (!piece) return null;
    return piece[0];
  }

  static getType(piece) {
    if (!piece) return null;
    return piece[1];
  }

  static isValidPos(r, c) {
    return r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS;
  }

  static isPalace(side, r, c) {
    if (c < 3 || c > 5) return false;
    if (side === RED) return r >= 7 && r <= 9;
    if (side === BLACK) return r >= 0 && r <= 2;
    return false;
  }

  static findKing(board, side) {
    const target = side + KING;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (board[r][c] === target) {
          return { r, c };
        }
      }
    }
    return null;
  }

  /**
   * Check if Red King and Black King are facing each other in the same column with no pieces in between
   */
  static isFlyingGeneral(board) {
    const redKing = Rules.findKing(board, RED);
    const blackKing = Rules.findKing(board, BLACK);

    if (!redKing || !blackKing) return false;
    if (redKing.c !== blackKing.c) return false;

    const c = redKing.c;
    const minR = Math.min(redKing.r, blackKing.r);
    const maxR = Math.max(redKing.r, blackKing.r);

    for (let r = minR + 1; r < maxR; r++) {
      if (board[r][c] !== null) return false;
    }

    return true; // Facing each other directly!
  }

  /**
   * Generates pseudo-legal moves without check validation
   */
  static getPseudoMoves(board, r, c) {
    const piece = board[r][c];
    if (!piece) return [];

    const side = Rules.getSide(piece);
    const type = Rules.getType(piece);
    const moves = [];

    const addMove = (toR, toC) => {
      if (!Rules.isValidPos(toR, toC)) return false;
      const targetPiece = board[toR][toC];
      if (targetPiece) {
        if (Rules.getSide(targetPiece) === side) return false; // Own piece
        moves.push({ fromR: r, fromC: c, toR, toC, captured: targetPiece });
        return false; // Stop sliding if blocked by enemy
      }
      moves.push({ fromR: r, fromC: c, toR, toC, captured: null });
      return true; // Continue sliding
    };

    switch (type) {
      case KING: {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (Rules.isPalace(side, nr, nc)) {
            addMove(nr, nc);
          }
        }
        break;
      }

      case ADVISOR: {
        const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (Rules.isPalace(side, nr, nc)) {
            addMove(nr, nc);
          }
        }
        break;
      }

      case ELEPHANT: {
        const dirs = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          // Cannot cross river
          if (side === RED && nr < 5) continue;
          if (side === BLACK && nr > 4) continue;

          // Eye of elephant block
          const eyeR = r + dr / 2;
          const eyeC = c + dc / 2;
          if (board[eyeR][eyeC] === null) {
            addMove(nr, nc);
          }
        }
        break;
      }

      case HORSE: {
        const horseMoves = [
          { dr: -2, dc: -1, eyeR: -1, eyeC: 0 },
          { dr: -2, dc: 1,  eyeR: -1, eyeC: 0 },
          { dr: 2,  dc: -1, eyeR: 1,  eyeC: 0 },
          { dr: 2,  dc: 1,  eyeR: 1,  eyeC: 0 },
          { dr: -1, dc: -2, eyeR: 0,  eyeC: -1 },
          { dr: 1,  dc: -2, eyeR: 0,  eyeC: -1 },
          { dr: -1, dc: 2,  eyeR: 0,  eyeC: 1 },
          { dr: 1,  dc: 2,  eyeR: 0,  eyeC: 1 }
        ];

        for (const m of horseMoves) {
          const nr = r + m.dr, nc = c + m.dc;
          const legR = r + m.eyeR, legC = c + m.eyeC;

          if (Rules.isValidPos(legR, legC) && board[legR][legC] === null) {
            addMove(nr, nc);
          }
        }
        break;
      }

      case CHARIOT: {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          while (Rules.isValidPos(nr, nc)) {
            if (!addMove(nr, nc)) break;
            nr += dr;
            nc += dc;
          }
        }
        break;
      }

      case CANNON: {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          let screenFound = false;

          while (Rules.isValidPos(nr, nc)) {
            const target = board[nr][nc];
            if (!screenFound) {
              if (target === null) {
                moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captured: null });
              } else {
                screenFound = true; // Screen piece for cannon jump
              }
            } else {
              if (target !== null) {
                if (Rules.getSide(target) !== side) {
                  moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captured: target });
                }
                break; // Screen used, target hit (or blocked by own piece)
              }
            }
            nr += dr;
            nc += dc;
          }
        }
        break;
      }

      case PAWN: {
        const forwardDir = side === RED ? -1 : 1;
        // Forward move
        addMove(r + forwardDir, c);

        // Sideways moves if crossed river
        const crossedRiver = side === RED ? r <= 4 : r >= 5;
        if (crossedRiver) {
          addMove(r, c - 1);
          addMove(r, c + 1);
        }
        break;
      }
    }

    return moves;
  }

  /**
   * Clone board state
   */
  static cloneBoard(board) {
    return board.map(row => [...row]);
  }

  /**
   * Apply move on board clone
   */
  static makeMove(board, move) {
    const newBoard = Rules.cloneBoard(board);
    newBoard[move.toR][move.toC] = newBoard[move.fromR][move.fromC];
    newBoard[move.fromR][move.fromC] = null;
    return newBoard;
  }

  /**
   * Check if specified side is in check
   */
  static isKingInCheck(board, side) {
    if (Rules.isFlyingGeneral(board)) return true;

    const kingPos = Rules.findKing(board, side);
    if (!kingPos) return true; // King missing means captured/in check

    const enemySide = side === RED ? BLACK : RED;

    // Check all enemy pseudo moves to see if any can reach the king
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = board[r][c];
        if (piece && Rules.getSide(piece) === enemySide) {
          const pseudoMoves = Rules.getPseudoMoves(board, r, c);
          if (pseudoMoves.some(m => m.toR === kingPos.r && m.toC === kingPos.c)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Get all strictly legal moves for piece at (r, c)
   */
  static getLegalMoves(board, r, c) {
    const piece = board[r][c];
    if (!piece) return [];
    const side = Rules.getSide(piece);
    const pseudoMoves = Rules.getPseudoMoves(board, r, c);

    return pseudoMoves.filter(move => {
      const tempBoard = Rules.makeMove(board, move);
      return !Rules.isKingInCheck(tempBoard, side);
    });
  }

  /**
   * Get all strictly legal moves for a given side
   */
  static getAllLegalMoves(board, side) {
    const allMoves = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = board[r][c];
        if (piece && Rules.getSide(piece) === side) {
          const moves = Rules.getLegalMoves(board, r, c);
          allMoves.push(...moves);
        }
      }
    }
    return allMoves;
  }

  static isCheckmate(board, side) {
    const inCheck = Rules.isKingInCheck(board, side);
    const legalMoves = Rules.getAllLegalMoves(board, side);
    return inCheck && legalMoves.length === 0;
  }

  static isStalemate(board, side) {
    const inCheck = Rules.isKingInCheck(board, side);
    const legalMoves = Rules.getAllLegalMoves(board, side);
    return !inCheck && legalMoves.length === 0;
  }

  /**
   * Convert move to Xiangqi Chinese Notation (e.g. 炮二平五, 马8进7)
   */
  static generateNotation(board, move) {
    const piece = board[move.fromR][move.fromC];
    if (!piece) return '';

    const side = Rules.getSide(piece);
    const type = Rules.getType(piece);
    const pName = PIECE_NAMES[piece];

    const redCols = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
    const blackCols = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const numToChar = (col, isRed) => isRed ? redCols[col] : blackCols[col];

    const fromColChar = numToChar(move.fromC, side === RED);
    const toColChar = numToChar(move.toC, side === RED);

    let prefix = pName;

    // Check for column duplicate pieces (e.g. 前炮 / 后炮)
    const sameCols = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (board[r][move.fromC] === piece) {
        sameCols.push(r);
      }
    }

    if (sameCols.length > 1) {
      sameCols.sort((a, b) => a - b); // Row 0 (top) to Row 9 (bottom)
      const isFront = (side === RED) ? move.fromR === sameCols[0] : move.fromR === sameCols[sameCols.length - 1];
      prefix = (isFront ? '前' : '后') + pName;
    }

    const rowDiff = move.toR - move.fromR;
    let dirStr = '';
    let targetStr = '';

    const isStraightPiece = [CHARIOT, CANNON, PAWN, KING].includes(type);

    if (side === RED) {
      if (rowDiff < 0) {
        dirStr = '进';
        targetStr = isStraightPiece ? redCols[9 - Math.abs(rowDiff)] : toColChar;
      } else if (rowDiff > 0) {
        dirStr = '退';
        targetStr = isStraightPiece ? redCols[9 - Math.abs(rowDiff)] : toColChar;
      } else {
        dirStr = '平';
        targetStr = toColChar;
      }
    } else { // BLACK
      if (rowDiff > 0) {
        dirStr = '进';
        targetStr = isStraightPiece ? blackCols[Math.abs(rowDiff) - 1] : toColChar;
      } else if (rowDiff < 0) {
        dirStr = '退';
        targetStr = isStraightPiece ? blackCols[Math.abs(rowDiff) - 1] : toColChar;
      } else {
        dirStr = '平';
        targetStr = toColChar;
      }
    }

    if (sameCols.length > 1) {
      return `${prefix}${dirStr}${targetStr}`;
    }
    return `${prefix}${fromColChar}${dirStr}${targetStr}`;
  }
}
