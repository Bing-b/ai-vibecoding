class Tank {
    constructor(ctx, x, y, mapManager) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.width = 36; // Slightly smaller than tile
        this.height = 36;
        this.speed = 3;
        this.dir = 0; // 0: up, 1: right, 2: down, 3: left
        this.isMoving = false;
        this.mapManager = mapManager;
        this.lastShot = 0;
        this.shootDelay = 500; // ms
        this.active = true;
    }

    getRect(newX = this.x, newY = this.y) {
        return {
            x: newX,
            y: newY,
            width: this.width,
            height: this.height
        };
    }

    canMove(newX, newY) {
        // Boundary check
        if (newX < 0 || newX + this.width > 800 || newY < 0 || newY + this.height > 600) {
            return false;
        }

        // Map collision
        let rect = this.getRect(newX, newY);
        let mapRects = this.mapManager.getCollisionRects();
        
        for (let r of mapRects) {
            if (checkAABB(rect, r)) {
                return false; // Hit a wall or base
            }
        }
        
        return true;
    }

    drawBase(color, glowColor) {
        if (!this.active) return;
        
        this.ctx.save();
        this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Rotate based on direction
        this.ctx.rotate((this.dir * 90) * Math.PI / 180);
        
        // Draw Tank Body
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = glowColor;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Draw Tracks
        this.ctx.fillStyle = '#333';
        this.ctx.shadowBlur = 0;
        this.ctx.fillRect(-this.width / 2 - 2, -this.height / 2, 4, this.height);
        this.ctx.fillRect(this.width / 2 - 2, -this.height / 2, 4, this.height);

        // Draw Turret
        this.ctx.fillStyle = '#222';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw Gun
        this.ctx.fillStyle = glowColor;
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(-2, -this.height / 2 - 5, 4, 15);
        
        this.ctx.restore();
    }
}

class PlayerTank extends Tank {
    constructor(ctx, x, y, mapManager) {
        super(ctx, x, y, mapManager);
        this.color = '#005566';
        this.glowColor = '#00f3ff'; // Neon blue
    }

    update(bullets) {
        if (!this.active) return;

        this.isMoving = false;
        let newX = this.x;
        let newY = this.y;

        if (Input.isDown('KeyW') || Input.isDown('ArrowUp')) {
            this.dir = 0;
            newY -= this.speed;
            this.isMoving = true;
        } else if (Input.isDown('KeyS') || Input.isDown('ArrowDown')) {
            this.dir = 2;
            newY += this.speed;
            this.isMoving = true;
        } else if (Input.isDown('KeyA') || Input.isDown('ArrowLeft')) {
            this.dir = 3;
            newX -= this.speed;
            this.isMoving = true;
        } else if (Input.isDown('KeyD') || Input.isDown('ArrowRight')) {
            this.dir = 1;
            newX += this.speed;
            this.isMoving = true;
        }

        if (this.isMoving && this.canMove(newX, newY)) {
            // Check collision with enemy tanks (done in game logic, but for simple self-contained we just rely on map for now)
            this.x = newX;
            this.y = newY;
        }

        if (Input.isDown('Space')) {
            this.shoot(bullets);
        }
    }

    shoot(bullets) {
        let now = Date.now();
        if (now - this.lastShot > this.shootDelay) {
            this.lastShot = now;
            let bx = this.x + this.width / 2;
            let by = this.y + this.height / 2;
            bullets.push(new Bullet(this.ctx, bx, by, this.dir, true));
        }
    }

    draw() {
        this.drawBase(this.color, this.glowColor);
    }
}

class EnemyTank extends Tank {
    constructor(ctx, x, y, mapManager) {
        super(ctx, x, y, mapManager);
        this.color = '#660033';
        this.glowColor = '#ff00ea'; // Neon pink
        this.speed = 2; // Slower than player
        this.moveTimer = 0;
        this.shootDelay = 1500 + Math.random() * 1000;
    }

    update(bullets) {
        if (!this.active) return;

        // Simple AI
        this.moveTimer--;
        if (this.moveTimer <= 0) {
            this.dir = Math.floor(Math.random() * 4); // Random direction
            this.moveTimer = 30 + Math.random() * 60; // Random duration
        }

        let newX = this.x;
        let newY = this.y;

        if (this.dir === 0) newY -= this.speed;
        if (this.dir === 1) newX += this.speed;
        if (this.dir === 2) newY += this.speed;
        if (this.dir === 3) newX -= this.speed;

        if (this.canMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Hit a wall, turn around
            this.dir = (this.dir + Math.floor(Math.random() * 3 + 1)) % 4;
        }

        // Random shooting
        let now = Date.now();
        if (now - this.lastShot > this.shootDelay) {
            this.lastShot = now;
            let bx = this.x + this.width / 2;
            let by = this.y + this.height / 2;
            bullets.push(new Bullet(this.ctx, bx, by, this.dir, false, 5));
        }
    }

    draw() {
        this.drawBase(this.color, this.glowColor);
    }
}
