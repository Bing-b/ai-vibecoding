/**
 * Xiangqi Game Controller
 */

class XiangqiGame {
  constructor() {
    this.board = new XiangqiBoard();
    this.ui = new XiangqiUI('game-board-container', (r, c) => this.handleCellClick(r, c));
    this.ai = new XiangqiAI('medium');

    this.mode = 'pvp'; // 'pvp' or 'pvai'
    this.playerSide = RED; // Human side in PvAI mode
    this.selectedSquare = null;
    this.validMoves = [];
    this.isAiThinking = false;
    this.gameActive = false;

    this.timer = null;
    this.redTime = 600; // 10 mins
    this.blackTime = 600;

    this.initEventListeners();
    this.startNewGame();
  }

  initEventListeners() {
    document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
    document.getElementById('btn-undo').addEventListener('click', () => this.undoMove());
    document.getElementById('btn-hint').addEventListener('click', () => this.showHint());
    document.getElementById('btn-sound').addEventListener('click', (e) => {
      const enabled = sounds.toggleSound();
      e.target.textContent = enabled ? '🔊 音效: 开' : '🔇 音效: 关';
    });

    document.getElementById('select-mode').addEventListener('change', (e) => {
      this.mode = e.target.value;
      const aiSettings = document.getElementById('ai-settings');
      if (aiSettings) {
        aiSettings.style.display = this.mode === 'pvai' ? 'flex' : 'none';
      }
      this.startNewGame();
    });

    document.getElementById('select-difficulty').addEventListener('change', (e) => {
      this.ai.setDifficulty(e.target.value);
    });

    document.getElementById('select-player-side').addEventListener('change', (e) => {
      this.playerSide = e.target.value;
      this.startNewGame();
    });

    document.getElementById('btn-restart-overlay')?.addEventListener('click', () => {
      this.hideGameOverOverlay();
      this.startNewGame();
    });
  }

  startNewGame() {
    this.board.reset();
    this.selectedSquare = null;
    this.validMoves = [];
    this.isAiThinking = false;
    this.gameActive = true;

    this.redTime = 600;
    this.blackTime = 600;
    this.stopTimer();
    this.startTimer();

    this.updateStatus();
    this.updateHistoryUI();
    this.ui.updateCapturedPieces([], []);
    this.ui.renderBoard(this.board, null, [], null);

    // If PvAI mode and AI plays Red (first move)
    if (this.mode === 'pvai' && this.playerSide === BLACK && this.board.turn === RED) {
      this.triggerAiTurn();
    }
  }

  handleCellClick(r, c) {
    if (!this.gameActive || this.isAiThinking) return;

    // In PvAI mode, ignore click during AI turn
    if (this.mode === 'pvai' && this.board.turn !== this.playerSide) {
      return;
    }

    const clickedPiece = this.board.getPiece(r, c);
    const clickedSide = Rules.getSide(clickedPiece);

    // If square already selected
    if (this.selectedSquare) {
      // Check if click target is a valid move destination
      const move = this.validMoves.find(m => m.toR === r && m.toC === c);

      if (move) {
        this.makeMove(move);
        this.selectedSquare = null;
        this.validMoves = [];
        return;
      }
    }

    // Select own piece
    if (clickedPiece && clickedSide === this.board.turn) {
      sounds.playSelect();
      this.selectedSquare = { r, c };
      this.validMoves = Rules.getLegalMoves(this.board.grid, r, c);
      this.ui.renderBoard(this.board, this.selectedSquare, this.validMoves, this.board.getLastMove());
    } else {
      // Deselect
      this.selectedSquare = null;
      this.validMoves = [];
      this.ui.renderBoard(this.board, null, [], this.board.getLastMove());
    }
  }

  async makeMove(move) {
    const isCapture = move.captured !== null;
    const record = this.board.executeMove(move);

    if (isCapture) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    this.ui.renderBoard(this.board, null, [], move);
    this.ui.updateCapturedPieces(this.board.capturedRed, this.board.capturedBlack);
    this.addHistoryRecord(record.notation);

    // Check game state (Check, Checkmate, Stalemate)
    const currentTurn = this.board.turn;
    const inCheck = Rules.isKingInCheck(this.board.grid, currentSide => currentSide === currentTurn ? currentTurn : (currentTurn === RED ? BLACK : RED));

    if (Rules.isKingInCheck(this.board.grid, currentTurn)) {
      if (Rules.isCheckmate(this.board.grid, currentTurn)) {
        const winner = currentTurn === RED ? BLACK : RED;
        this.endGame(winner, '将死 (Checkmate)');
        return;
      } else {
        sounds.playCheck();
        this.ui.showCheckBanner(currentTurn);
      }
    } else if (Rules.isStalemate(this.board.grid, currentTurn)) {
      this.endGame(null, '困毙和棋 (Stalemate)');
      return;
    }

    this.updateStatus();

    // Trigger AI turn if needed
    if (this.gameActive && this.mode === 'pvai' && this.board.turn !== this.playerSide) {
      await this.triggerAiTurn();
    }
  }

  async triggerAiTurn() {
    this.isAiThinking = true;
    this.updateStatus('AI 思考中...');

    const aiMove = await this.ai.getBestMove(this.board.grid, this.board.turn);

    this.isAiThinking = false;
    if (aiMove && this.gameActive) {
      await this.makeMove(aiMove);
    }
  }

  async showHint() {
    if (!this.gameActive || this.isAiThinking) return;

    this.updateStatus('求解最佳招法...');
    const bestMove = await this.ai.getBestMove(this.board.grid, this.board.turn);

    if (bestMove) {
      this.selectedSquare = { r: bestMove.fromR, c: bestMove.fromC };
      this.validMoves = [bestMove];
      this.ui.renderBoard(this.board, this.selectedSquare, this.validMoves, this.board.getLastMove());
      sounds.playSelect();
    }

    this.updateStatus();
  }

  undoMove() {
    if (!this.gameActive || this.isAiThinking) return;

    // In PvAI mode, undo two moves (Player & AI)
    let steps = this.mode === 'pvai' ? 2 : 1;

    for (let i = 0; i < steps; i++) {
      if (this.board.moveHistory.length > 0) {
        this.board.undoMove();
        this.popHistoryRecord();
      }
    }

    this.selectedSquare = null;
    this.validMoves = [];
    this.ui.renderBoard(this.board, null, [], this.board.getLastMove());
    this.ui.updateCapturedPieces(this.board.capturedRed, this.board.capturedBlack);
    this.updateStatus();
    sounds.playMove();
  }

  endGame(winner, reason) {
    this.gameActive = false;
    this.stopTimer();

    sounds.playWin();

    const overlay = document.getElementById('game-over-overlay');
    const title = document.getElementById('overlay-title');
    const desc = document.getElementById('overlay-desc');

    if (winner) {
      const winnerText = winner === RED ? '红方' : '黑方';
      title.textContent = `🏆 ${winnerText} 获胜！`;
      desc.textContent = `结束原因: ${reason}`;
    } else {
      title.textContent = '🤝 双方和棋！';
      desc.textContent = `结束原因: ${reason}`;
    }

    if (overlay) overlay.classList.add('active');
  }

  hideGameOverOverlay() {
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  updateStatus(customMsg) {
    const statusElem = document.getElementById('turn-status');
    if (!statusElem) return;

    if (customMsg) {
      statusElem.textContent = customMsg;
      return;
    }

    const currentName = this.board.turn === RED ? '红方 (先手)' : '黑方 (后手)';
    statusElem.textContent = `${currentName} 行棋`;
    statusElem.className = `status-badge ${this.board.turn === RED ? 'status-red' : 'status-black'}`;
  }

  addHistoryRecord(notation) {
    const historyList = document.getElementById('move-history-list');
    if (!historyList) return;

    const moveIndex = Math.ceil(this.board.moveHistory.length / 2);
    const isRed = this.board.turn === BLACK; // record was just played

    if (isRed) {
      const row = document.createElement('div');
      row.className = 'history-row';
      row.innerHTML = `<span class="step-num">${moveIndex}.</span><span class="red-move">${notation}</span><span class="black-move"></span>`;
      historyList.appendChild(row);
    } else {
      const lastRow = historyList.lastElementChild;
      if (lastRow) {
        const blackSpan = lastRow.querySelector('.black-move');
        if (blackSpan) blackSpan.textContent = notation;
      }
    }

    historyList.scrollTop = historyList.scrollHeight;
  }

  popHistoryRecord() {
    const historyList = document.getElementById('move-history-list');
    if (!historyList || historyList.children.length === 0) return;

    const lastRow = historyList.lastElementChild;
    const blackSpan = lastRow.querySelector('.black-move');

    if (blackSpan && blackSpan.textContent !== '') {
      blackSpan.textContent = '';
    } else {
      historyList.removeChild(lastRow);
    }
  }

  updateHistoryUI() {
    const historyList = document.getElementById('move-history-list');
    if (historyList) historyList.innerHTML = '';
  }

  startTimer() {
    this.timer = setInterval(() => {
      if (!this.gameActive || this.isAiThinking) return;

      if (this.board.turn === RED) {
        this.redTime--;
        if (this.redTime <= 0) this.endGame(BLACK, '红方超时');
      } else {
        this.blackTime--;
        if (this.blackTime <= 0) this.endGame(RED, '黑方超时');
      }

      this.renderTimer();
    }, 1000);
  }

  stopTimer() {
    if (this.timer) clearInterval(this.timer);
  }

  renderTimer() {
    const format = s => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const redTimerElem = document.getElementById('red-timer');
    const blackTimerElem = document.getElementById('black-timer');

    if (redTimerElem) redTimerElem.textContent = format(this.redTime);
    if (blackTimerElem) blackTimerElem.textContent = format(this.blackTime);
  }
}

// Global instance launcher
window.addEventListener('DOMContentLoaded', () => {
  window.xiangqiApp = new XiangqiGame();
});
