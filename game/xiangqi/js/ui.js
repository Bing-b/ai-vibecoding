/**
 * Xiangqi UI Renderer & User Interaction
 */

class XiangqiUI {
  constructor(containerId, onCellClick) {
    this.container = document.getElementById(containerId);
    this.onCellClick = onCellClick;

    this.selectedSquare = null;
    this.validMoves = [];
    this.lastMove = null;

    this.boardElement = null;
    this.cellsGrid = []; // 10x9 2D array of cell DOM nodes

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'board-wrapper';

    // SVG background for board lines (River, Palace, Grid)
    const svgBoard = this.createBoardSVG();
    wrapper.appendChild(svgBoard);

    // Interactive piece layer (HTML grid overlay)
    const pieceLayer = document.createElement('div');
    pieceLayer.className = 'piece-layer';

    for (let r = 0; r < BOARD_ROWS; r++) {
      this.cellsGrid[r] = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.style.gridRow = r + 1;
        cell.style.gridColumn = c + 1;

        cell.addEventListener('click', () => {
          if (this.onCellClick) {
            this.onCellClick(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
          }
        });

        pieceLayer.appendChild(cell);
        this.cellsGrid[r][c] = cell;
      }
    }

    wrapper.appendChild(pieceLayer);
    this.container.appendChild(wrapper);
    this.boardElement = wrapper;
  }

  createBoardSVG() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 900 1000");
    svg.setAttribute("class", "board-svg");

    // Board background texture rect
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", "900");
    bg.setAttribute("height", "1000");
    bg.setAttribute("fill", "url(#woodTexture)");
    bg.setAttribute("rx", "16");
    svg.appendChild(bg);

    // Definitions (gradients, filters)
    const defs = document.createElementNS(svgNS, "defs");
    defs.innerHTML = `
      <linearGradient id="woodTexture" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e8c39e" />
        <stop offset="50%" stop-color="#d4a373" />
        <stop offset="100%" stop-color="#bc8a5f" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.3"/>
      </filter>
    `;
    svg.appendChild(defs);

    // Grid coordinates mapping (50px border, 100px per grid block)
    // col 0..8 => x: 50 + c * 100
    // row 0..9 => y: 50 + r * 100
    const getX = c => 50 + c * 100;
    const getY = r => 50 + r * 100;

    // Outer border frame
    const outerFrame = document.createElementNS(svgNS, "rect");
    outerFrame.setAttribute("x", "35");
    outerFrame.setAttribute("y", "35");
    outerFrame.setAttribute("width", "830");
    outerFrame.setAttribute("height", "930");
    outerFrame.setAttribute("fill", "none");
    outerFrame.setAttribute("stroke", "#5c3d2e");
    outerFrame.setAttribute("stroke-width", "6");
    svg.appendChild(outerFrame);

    const innerFrame = document.createElementNS(svgNS, "rect");
    innerFrame.setAttribute("x", "45");
    innerFrame.setAttribute("y", "45");
    innerFrame.setAttribute("width", "810");
    innerFrame.setAttribute("height", "910");
    innerFrame.setAttribute("fill", "none");
    innerFrame.setAttribute("stroke", "#3d2314");
    innerFrame.setAttribute("stroke-width", "3");
    svg.appendChild(innerFrame);

    // Grid lines group
    const gLines = document.createElementNS(svgNS, "g");
    gLines.setAttribute("stroke", "#3d2314");
    gLines.setAttribute("stroke-width", "2.5");

    // Horizontal lines (10 lines)
    for (let r = 0; r < 10; r++) {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", getX(0));
      line.setAttribute("y1", getY(r));
      line.setAttribute("x2", getX(8));
      line.setAttribute("y2", getY(r));
      gLines.appendChild(line);
    }

    // Vertical lines (9 lines) - split across river for middle 7 columns
    for (let c = 0; c < 9; c++) {
      if (c === 0 || c === 8) {
        // Outer vertical boundary lines run straight through
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", getX(c));
        line.setAttribute("y1", getY(0));
        line.setAttribute("x2", getX(c));
        line.setAttribute("y2", getY(9));
        gLines.appendChild(line);
      } else {
        // Top half (Row 0 to 4)
        const lineTop = document.createElementNS(svgNS, "line");
        lineTop.setAttribute("x1", getX(c));
        lineTop.setAttribute("y1", getY(0));
        lineTop.setAttribute("x2", getX(c));
        lineTop.setAttribute("y2", getY(4));
        gLines.appendChild(lineTop);

        // Bottom half (Row 5 to 9)
        const lineBot = document.createElementNS(svgNS, "line");
        lineBot.setAttribute("x1", getX(c));
        lineBot.setAttribute("y1", getY(5));
        lineBot.setAttribute("x2", getX(c));
        lineBot.setAttribute("y2", getY(9));
        gLines.appendChild(lineBot);
      }
    }

    // Palace diagonal lines
    // Black Palace (cols 3..5, rows 0..2)
    const bp1 = document.createElementNS(svgNS, "line");
    bp1.setAttribute("x1", getX(3)); bp1.setAttribute("y1", getY(0));
    bp1.setAttribute("x2", getX(5)); bp1.setAttribute("y2", getY(2));
    gLines.appendChild(bp1);

    const bp2 = document.createElementNS(svgNS, "line");
    bp2.setAttribute("x1", getX(5)); bp2.setAttribute("y1", getY(0));
    bp2.setAttribute("x2", getX(3)); bp2.setAttribute("y2", getY(2));
    gLines.appendChild(bp2);

    // Red Palace (cols 3..5, rows 7..9)
    const rp1 = document.createElementNS(svgNS, "line");
    rp1.setAttribute("x1", getX(3)); rp1.setAttribute("y1", getY(7));
    rp1.setAttribute("x2", getX(5)); rp1.setAttribute("y2", getY(9));
    gLines.appendChild(rp1);

    const rp2 = document.createElementNS(svgNS, "line");
    rp2.setAttribute("x1", getX(5)); rp2.setAttribute("y1", getY(7));
    rp2.setAttribute("x2", getX(3)); rp2.setAttribute("y2", getY(9));
    gLines.appendChild(rp2);

    svg.appendChild(gLines);

    // River Text ("楚 河"  "漢 界")
    const text1 = document.createElementNS(svgNS, "text");
    text1.setAttribute("x", getX(1.8));
    text1.setAttribute("y", getY(4.65));
    text1.setAttribute("font-family", "'Ma Shan Zheng', 'Kaiti', 'STKaiti', serif");
    text1.setAttribute("font-size", "52");
    text1.setAttribute("font-weight", "bold");
    text1.setAttribute("fill", "#5c2c16");
    text1.textContent = "楚  河";
    svg.appendChild(text1);

    const text2 = document.createElementNS(svgNS, "text");
    text2.setAttribute("x", getX(5.8));
    text2.setAttribute("y", getY(4.65));
    text2.setAttribute("font-family", "'Ma Shan Zheng', 'Kaiti', 'STKaiti', serif");
    text2.setAttribute("font-size", "52");
    text2.setAttribute("font-weight", "bold");
    text2.setAttribute("fill", "#5c2c16");
    text2.textContent = "漢  界";
    svg.appendChild(text2);

    // Position mark crosshairs for Cannon and Pawn starting points
    const starCoords = [
      [2, 1], [2, 7], // Cannons Black
      [7, 1], [7, 7], // Cannons Red
      [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], // Pawns Black
      [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]  // Pawns Red
    ];

    const gStars = document.createElementNS(svgNS, "g");
    gStars.setAttribute("stroke", "#3d2314");
    gStars.setAttribute("stroke-width", "2");

    starCoords.forEach(([r, c]) => {
      const cx = getX(c);
      const cy = getY(r);
      const d = 6, l = 16;

      // Top-Left corner
      if (c > 0) {
        let p = document.createElementNS(svgNS, "path");
        p.setAttribute("d", `M ${cx-d-l} ${cy-d} L ${cx-d} ${cy-d} L ${cx-d} ${cy-d-l}`);
        gStars.appendChild(p);
      }
      // Top-Right corner
      if (c < 8) {
        let p = document.createElementNS(svgNS, "path");
        p.setAttribute("d", `M ${cx+d+l} ${cy-d} L ${cx+d} ${cy-d} L ${cx+d} ${cy-d-l}`);
        gStars.appendChild(p);
      }
      // Bottom-Left corner
      if (c > 0) {
        let p = document.createElementNS(svgNS, "path");
        p.setAttribute("d", `M ${cx-d-l} ${cy+d} L ${cx-d} ${cy+d} L ${cx-d} ${cy+d+l}`);
        gStars.appendChild(p);
      }
      // Bottom-Right corner
      if (c < 8) {
        let p = document.createElementNS(svgNS, "path");
        p.setAttribute("d", `M ${cx+d+l} ${cy+d} L ${cx+d} ${cy+d} L ${cx+d} ${cy+d+l}`);
        gStars.appendChild(p);
      }
    });

    svg.appendChild(gStars);
    return svg;
  }

  renderBoard(boardState, selectedSquare, validMoves, lastMove) {
    this.selectedSquare = selectedSquare;
    this.validMoves = validMoves || [];
    this.lastMove = lastMove;

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const cell = this.cellsGrid[r][c];
        cell.className = 'board-cell'; // reset classes

        const piece = boardState.getPiece(r, c);

        // Highlight selection
        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
          cell.classList.add('selected');
        }

        // Highlight last move
        if (lastMove && ((lastMove.fromR === r && lastMove.fromC === c) || (lastMove.toR === r && lastMove.toC === c))) {
          cell.classList.add('last-move');
        }

        // Highlight valid target moves
        const isValidTarget = this.validMoves.some(m => m.toR === r && m.toC === c);
        if (isValidTarget) {
          if (piece) {
            cell.classList.add('valid-capture');
          } else {
            cell.classList.add('valid-move');
          }
        }

        // Piece badge rendering
        cell.innerHTML = '';
        if (piece) {
          const pieceNode = this.createPieceElement(piece);
          cell.appendChild(pieceNode);
        }
      }
    }
  }

  createPieceElement(pieceCode) {
    const side = Rules.getSide(pieceCode);
    const pieceName = PIECE_NAMES[pieceCode];

    const elem = document.createElement('div');
    elem.className = `piece ${side === RED ? 'piece-red' : 'piece-black'}`;

    const inner = document.createElement('div');
    inner.className = 'piece-inner';
    inner.textContent = pieceName;

    elem.appendChild(inner);
    return elem;
  }

  updateCapturedPieces(redList, blackList) {
    const redGraveyard = document.getElementById('captured-red');
    const blackGraveyard = document.getElementById('captured-black');

    if (redGraveyard) {
      redGraveyard.innerHTML = '';
      redList.forEach(code => {
        const p = this.createPieceElement(code);
        p.classList.add('piece-small');
        redGraveyard.appendChild(p);
      });
    }

    if (blackGraveyard) {
      blackGraveyard.innerHTML = '';
      blackList.forEach(code => {
        const p = this.createPieceElement(code);
        p.classList.add('piece-small');
        blackGraveyard.appendChild(p);
      });
    }
  }

  showCheckBanner(side) {
    const banner = document.getElementById('check-banner');
    if (!banner) return;

    const sideName = side === RED ? '红方' : '黑方';
    banner.textContent = `⚡ 将军！${sideName}被照将！`;
    banner.classList.add('active');

    setTimeout(() => {
      banner.classList.remove('active');
    }, 2000);
  }
}
