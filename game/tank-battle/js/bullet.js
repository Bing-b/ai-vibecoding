class Bullet {
    constructor(ctx, x, y, dir, isPlayer, speed = 8) {
        this.ctx = ctx;
        this.width = 6;
        this.height = 6;
        // Center bullet based on tank center
        this.x = x - this.width / 2;
        this.y = y - this.height / 2;
        this.dir = dir; // 0: up, 1: right, 2: down, 3: left
        this.isPlayer = isPlayer;
        this.speed = speed;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        
        if (this.dir === 0) this.y -= this.speed;
        if (this.dir === 1) this.x += this.speed;
        if (this.dir === 2) this.y += this.speed;
        if (this.dir === 3) this.x -= this.speed;

        // Map boundary check
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;
        this.ctx.fillStyle = this.isPlayer ? '#00f3ff' : '#ff00ea'; // Neon colors
        
        // Glowing effect
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.ctx.fillStyle;
        
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
