class MapManager {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.tileSize = 40;
        this.cols = width / this.tileSize; // 800 / 40 = 20
        this.rows = height / this.tileSize; // 600 / 40 = 15
        this.grid = [];
        this.basePos = { x: 9, y: 14 }; // Base at bottom center
        this.baseAlive = true;
        this.initMap();
    }

    initMap() {
        // 0: empty, 1: brick, 2: steel, 3: base
        // Simple map layout
        const layout = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0],
            [0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,0],
            [0,1,1,0,1,1,2,2,2,0,2,2,2,1,1,0,1,1,0,0],
            [0,1,1,0,1,1,0,0,0,0,0,0,0,1,1,0,1,1,0,0],
            [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
            [0,1,1,0,2,2,0,1,1,1,1,0,2,2,0,1,1,0,0,0],
            [0,1,1,0,2,2,0,0,0,0,0,0,2,2,0,1,1,0,0,0],
            [0,1,1,0,1,1,1,1,0,0,1,1,1,1,0,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,1,0,0,0],
            [0,1,1,0,1,1,0,1,1,1,1,0,1,1,0,1,1,0,0,0],
            [0,1,1,0,1,1,0,1,3,3,1,0,1,1,0,1,1,0,0,0]
        ];

        this.grid = layout;
    }

    draw() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let val = this.grid[r][c];
                let x = c * this.tileSize;
                let y = r * this.tileSize;

                if (val === 1) { // Brick
                    this.ctx.fillStyle = '#b34700'; // Brown orange
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#662200';
                    this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                    
                    // Brick pattern
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y + 20);
                    this.ctx.lineTo(x + 40, y + 20);
                    this.ctx.moveTo(x + 20, y);
                    this.ctx.lineTo(x + 20, y + 20);
                    this.ctx.moveTo(x + 10, y + 20);
                    this.ctx.lineTo(x + 10, y + 40);
                    this.ctx.moveTo(x + 30, y + 20);
                    this.ctx.lineTo(x + 30, y + 40);
                    this.ctx.stroke();

                } else if (val === 2) { // Steel
                    this.ctx.fillStyle = '#a6a6a6';
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(x + 5, y + 5, 10, 10); // Reflection
                    this.ctx.strokeStyle = '#4d4d4d';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                    this.ctx.lineWidth = 1;
                } else if (val === 3) { // Base
                    if (this.baseAlive) {
                        this.ctx.fillStyle = '#00ffcc'; // Neon Cyan Base
                        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                        this.ctx.fillStyle = '#00997a';
                        this.ctx.beginPath();
                        this.ctx.arc(x + 20, y + 20, 10, 0, Math.PI * 2);
                        this.ctx.fill();
                    } else {
                        // Destroyed base
                        this.ctx.fillStyle = '#333';
                        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                        this.ctx.strokeStyle = '#ff0000';
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, y);
                        this.ctx.lineTo(x + 40, y + 40);
                        this.ctx.moveTo(x + 40, y);
                        this.ctx.lineTo(x, y + 40);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    getCollisionRects() {
        let rects = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let val = this.grid[r][c];
                if (val === 1 || val === 2 || val === 3) {
                    rects.push({
                        x: c * this.tileSize,
                        y: r * this.tileSize,
                        width: this.tileSize,
                        height: this.tileSize,
                        type: val,
                        r: r,
                        c: c
                    });
                }
            }
        }
        return rects;
    }

    destroyBlock(r, c) {
        if (this.grid[r][c] === 1) { // Only bricks break
            this.grid[r][c] = 0;
            return true;
        } else if (this.grid[r][c] === 3) { // Base destroyed
            this.baseAlive = false;
            return true;
        }
        return false;
    }
}
