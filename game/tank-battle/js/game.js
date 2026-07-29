class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI Elements
        this.scoreEl = document.getElementById('score');
        this.livesEl = document.getElementById('lives');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.victoryScreen = document.getElementById('victory-screen');
        
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());
        document.getElementById('next-btn').addEventListener('click', () => this.start());

        this.reset();
    }

    reset() {
        this.map = new MapManager(this.ctx, this.canvas.width, this.canvas.height);
        this.player = new PlayerTank(this.ctx, 280, 560, this.map); // Near base
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'menu'; // menu, playing, gameover, victory
        this.enemySpawnTimer = 0;
        this.enemiesKilled = 0;
        this.maxEnemies = 10;
        
        this.updateUI();
    }

    start() {
        this.reset();
        this.gameState = 'playing';
        this.startScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        this.victoryScreen.classList.remove('active');
        this.loop();
    }

    spawnEnemy() {
        if (this.enemies.length < 4 && (this.enemies.length + this.enemiesKilled) < this.maxEnemies) {
            // Spawn points (top left, top middle, top right)
            const spawnPoints = [
                {x: 0, y: 0},
                {x: 360, y: 0},
                {x: 760, y: 0}
            ];
            let pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.enemies.push(new EnemyTank(this.ctx, pt.x, pt.y, this.map));
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Enemy spawn logic
        this.enemySpawnTimer--;
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy();
            this.enemySpawnTimer = 180; // ~3 seconds at 60fps
        }

        // Update player
        if (this.player.active) {
            this.player.update(this.bullets);
        }

        // Update enemies
        this.enemies.forEach(enemy => enemy.update(this.bullets));

        // Update bullets
        this.bullets.forEach(bullet => bullet.update());

        // Collision logic
        this.checkCollisions();

        // Check Win/Loss conditions
        if (!this.map.baseAlive || this.lives <= 0) {
            this.gameOver();
        } else if (this.enemiesKilled >= this.maxEnemies && this.enemies.filter(e => e.active).length === 0) {
            this.victory();
        }

        // Cleanup inactive entities
        this.bullets = this.bullets.filter(b => b.active);
        this.enemies = this.enemies.filter(e => e.active);
    }

    checkCollisions() {
        for (let i = 0; i < this.bullets.length; i++) {
            let bullet = this.bullets[i];
            if (!bullet.active) continue;
            let bRect = bullet.getRect();

            // 1. Bullet vs Map
            let mapRects = this.map.getCollisionRects();
            for (let r of mapRects) {
                if (checkAABB(bRect, r)) {
                    bullet.active = false;
                    this.map.destroyBlock(r.r, r.c);
                    break;
                }
            }

            if (!bullet.active) continue;

            // 2. Bullet vs Tanks
            if (bullet.isPlayer) {
                // Check enemies
                for (let j = 0; j < this.enemies.length; j++) {
                    let enemy = this.enemies[j];
                    if (enemy.active && checkAABB(bRect, enemy.getRect())) {
                        bullet.active = false;
                        enemy.active = false; // Kill enemy
                        this.score += 100;
                        this.enemiesKilled++;
                        this.updateUI();
                        break;
                    }
                }
            } else {
                // Check player
                if (this.player.active && checkAABB(bRect, this.player.getRect())) {
                    bullet.active = false;
                    this.player.active = false;
                    this.lives--;
                    this.updateUI();
                    
                    if (this.lives > 0) {
                        // Respawn player
                        setTimeout(() => {
                            if (this.gameState === 'playing') {
                                this.player.x = 280;
                                this.player.y = 560;
                                this.player.active = true;
                                // Invulnerability could be added here
                            }
                        }, 1000);
                    }
                }
            }
        }
        
        // Check Tank vs Tank collisions (Optional enhancement: prevent overlapping)
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Map
        this.map.draw();

        // Draw Entities
        this.enemies.forEach(enemy => enemy.draw());
        if (this.player.active) {
            this.player.draw();
        }
        this.bullets.forEach(bullet => bullet.draw());
    }

    loop() {
        if (this.gameState === 'playing') {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.loop());
        }
    }

    updateUI() {
        this.scoreEl.innerText = this.score;
        this.livesEl.innerText = this.lives;
    }

    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('final-score').innerText = this.score;
        this.gameOverScreen.classList.add('active');
    }

    victory() {
        this.gameState = 'victory';
        document.getElementById('victory-score').innerText = this.score;
        this.victoryScreen.classList.add('active');
    }
}

// Initialize when window loads
window.onload = () => {
    const game = new Game();
};
