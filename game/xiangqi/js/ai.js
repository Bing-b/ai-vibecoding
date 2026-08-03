/**
 * Xiangqi AI Engine - Minimax with Alpha-Beta Pruning & PST
 */

class XiangqiAI {
  constructor(difficulty = 'medium') {
    this.setDifficulty(difficulty);
  }

  setDifficulty(level) {
    this.difficulty = level;
    switch (level) {
      case 'easy':
        this.maxDepth = 1;
        break;
      case 'medium':
        this.maxDepth = 2;
        break;
      case 'hard':
        this.maxDepth = 3;
        break;
      default:
        this.maxDepth = 2;
    }
  }

  /**
   * Evaluate board position relative to Red (positive = Red advantage, negative = Black advantage)
   */
  evaluate(board) {
    let score = 0;

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const side = Rules.getSide(piece);
        const type = Rules.getType(piece);
        const sign = side === RED ? 1 : -1;

        // Base piece value
        let val = PIECE_VALUES[type] || 0;

        // Positional PST value
        let pstVal = 0;
        const pstRow = side === RED ? r : (9 - r); // Flip row for Black

        if (type === PAWN) {
          pstVal = PST_PAWN[pstRow][c];
        } else if (type === HORSE) {
          pstVal = PST_HORSE[pstRow][c];
        } else if (type === CHARIOT) {
          pstVal = PST_CHARIOT[pstRow][c];
        } else if (type === CANNON) {
          pstVal = PST_CANNON[pstRow][c];
        }

        score += sign * (val + pstVal);
      }
    }

    return score;
  }

  /**
   * Sort moves for better Alpha-Beta pruning performance (MVV-LVA & captures first)
   */
  orderMoves(board, moves) {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.captured) {
        const victimType = Rules.getType(a.captured);
        const attackerType = Rules.getType(board[a.fromR][a.fromC]);
        scoreA = 1000 + PIECE_VALUES[victimType] - PIECE_VALUES[attackerType];
      }
      if (b.captured) {
        const victimType = Rules.getType(b.captured);
        const attackerType = Rules.getType(board[b.fromR][b.fromC]);
        scoreB = 1000 + PIECE_VALUES[victimType] - PIECE_VALUES[attackerType];
      }

      return scoreB - scoreA;
    });
  }

  /**
   * Minimax algorithm with Alpha-Beta pruning
   */
  minimax(board, depth, alpha, beta, isMaximizing) {
    const currentSide = isMaximizing ? RED : BLACK;

    // Terminal state checks
    if (Rules.isKingInCheck(board, currentSide)) {
      if (Rules.isCheckmate(board, currentSide)) {
        return isMaximizing ? -100000 - depth : 100000 + depth;
      }
    } else if (Rules.isStalemate(board, currentSide)) {
      return 0;
    }

    if (depth === 0) {
      return this.evaluate(board);
    }

    let legalMoves = Rules.getAllLegalMoves(board, currentSide);
    if (legalMoves.length === 0) {
      return isMaximizing ? -100000 : 100000;
    }

    legalMoves = this.orderMoves(board, legalMoves);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        const nextBoard = Rules.makeMove(board, move);
        const evalVal = this.minimax(nextBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evalVal);
        alpha = Math.max(alpha, evalVal);
        if (beta <= alpha) break; // Beta cutoff
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        const nextBoard = Rules.makeMove(board, move);
        const evalVal = this.minimax(nextBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evalVal);
        beta = Math.min(beta, evalVal);
        if (beta <= alpha) break; // Alpha cutoff
      }
      return minEval;
    }
  }

  /**
   * Find best move for current turn asynchronously
   */
  async getBestMove(board, side) {
    return new Promise(resolve => {
      // Use setTimeout so UI thread stays responsive
      setTimeout(() => {
        const isMaximizing = (side === RED);
        let legalMoves = Rules.getAllLegalMoves(board, side);

        if (legalMoves.length === 0) {
          resolve(null);
          return;
        }

        legalMoves = this.orderMoves(board, legalMoves);

        // Easy mode: add random variance
        if (this.difficulty === 'easy' && Math.random() < 0.3) {
          const randomIndex = Math.floor(Math.random() * legalMoves.length);
          resolve(legalMoves[randomIndex]);
          return;
        }

        let bestMove = legalMoves[0];
        let bestEval = isMaximizing ? -Infinity : Infinity;

        let alpha = -Infinity;
        let beta = Infinity;

        for (const move of legalMoves) {
          const nextBoard = Rules.makeMove(board, move);
          const evalVal = this.minimax(nextBoard, this.maxDepth - 1, alpha, beta, !isMaximizing);

          if (isMaximizing) {
            if (evalVal > bestEval) {
              bestEval = evalVal;
              bestMove = move;
            }
            alpha = Math.max(alpha, evalVal);
          } else {
            if (evalVal < bestEval) {
              bestEval = evalVal;
              bestMove = move;
            }
            beta = Math.min(beta, evalVal);
          }
        }

        resolve(bestMove);
      }, 50);
    });
  }
}
