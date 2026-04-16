
class Asteroid {
    constructor(x, y, radius, level, forceOutside = false) {
        this.canvasW = 800;
        this.canvasH = 600;
        this.radius = radius || 40;
        this.level = level || 3; 

        if (forceOutside) {
            if (Math.random() < 0.5) {
                this.x = Math.random() < 0.5 ? -this.radius : this.canvasW + this.radius;
                this.y = Math.random() * this.canvasH;
            } else {
                this.x = Math.random() * this.canvasW;
                this.y = Math.random() < 0.5 ? -this.radius : this.canvasH + this.radius;
            }
        } else {
            this.x = x;
            this.y = y;
        }

        
        const speedMultiplier = this.level * 0.5; 
        this.velX = (Math.random() * 2 - 1) * speedMultiplier;
        this.velY = (Math.random() * 2 - 1) * speedMultiplier;

        this.vertices = Math.floor(Math.random() * 7 + 8);
        this.offset = [];
        for (let i = 0; i < this.vertices; i++) {
            this.offset.push(Math.random() * (this.radius * 0.4) + (this.radius * 0.6));
        }
    }

    update(w, h) {
        this.x += this.velX;
        this.y += this.velY;
        if (this.x < -this.radius) this.x = w + this.radius;
        else if (this.x > w + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = h + this.radius;
        else if (this.y > h + this.radius) this.y = -this.radius;
    }
}


class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speed = 8;
        this.radius = 2;
        this.velocity = { x: Math.cos(angle) * this.speed, y: -Math.sin(angle) * this.speed };
        this.lifeSpan = 60;
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.lifeSpan--;
    }
}


class ShipModel {
    constructor(w, h) {
        this.canvasW = w;
        this.canvasH = h;
        this.initGame();
    }

    initGame() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.asteroids = [];
        this.projectiles = [];
        this.resetShip();
        this.spawnAsteroids(5, true); 
    }

    resetShip() {
        this.x = this.canvasW / 2;
        this.y = this.canvasH / 2;
        this.radius = 12;
        this.angle = Math.PI / 2;
        this.rotation = 0;
        this.thrusting = false;
        this.thrust = { x: 0, y: 0 };
        this.friction = 0.98;
    }

    spawnAsteroids(count, forceOutside = false) {
        for (let i = 0; i < count; i++) {
            this.asteroids.push(new Asteroid(0, 0, 40, 3, forceOutside));
        }
    }

    // Nueva función para dividir asteroides
    splitAsteroid(parent) {
        if (parent.level > 1) {
            const newLevel = parent.level - 1;
            const newRadius = parent.radius / 1.5;
            
            for (let i = 0; i < 2; i++) {
                const child = new Asteroid(parent.x, parent.y, newRadius, newLevel, false);
                
                child.velX = (Math.random() * 2 - 1) * (newLevel * 0.6);
                child.velY = (Math.random() * 2 - 1) * (newLevel * 0.6);
                this.asteroids.push(child);
            }
        }
    }

    shoot() {
        if (this.gameOver) return;
        const pX = this.x + this.radius * Math.cos(this.angle);
        const pY = this.y - this.radius * Math.sin(this.angle);
        this.projectiles.push(new Projectile(pX, pY, this.angle));
    }

    update() {
        if (this.gameOver) return;
        this.angle += this.rotation;
        if (this.thrusting) {
            this.thrust.x += 0.15 * Math.cos(this.angle);
            this.thrust.y -= 0.15 * Math.sin(this.angle);
        } else {
            this.thrust.x *= this.friction;
            this.thrust.y *= this.friction;
        }
        this.x += this.thrust.x;
        this.y += this.thrust.y;

        if (this.x < -this.radius) this.x = this.canvasW + this.radius;
        else if (this.x > this.canvasW + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = this.canvasH + this.radius;
        else if (this.y > this.canvasH + this.radius) this.y = -this.radius;

        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => p.lifeSpan > 0);
        this.asteroids.forEach(a => a.update(this.canvasW, this.canvasH));

        if (this.asteroids.length < 3) this.spawnAsteroids(2, true);
    }
}


class Starfield {
    constructor(w, h, count) {
        this.stars = [];
        for(let i=0; i<count; i++) {
            this.stars.push({ x: Math.random()*w, y: Math.random()*h, size: Math.random()*2, opacity: Math.random()*0.7+0.3 });
        }
    }
    draw(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,800,600);
        this.stars.forEach(s => {
            ctx.fillStyle = `rgba(255, 182, 193, ${s.opacity})`; 
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        });
    }
}


class GameView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.starfield = new Starfield(this.canvas.width, this.canvas.height, 100);
    }

    render(model) {
        this.starfield.draw(this.ctx);
        if (!model.gameOver) this.drawShip(model);
        else this.drawGameOver();
        this.drawProjectiles(model.projectiles);
        this.drawAsteroids(model.asteroids);
        this.drawUI(model.score, model.lives);
    }

    drawUI(score, lives) {
        this.ctx.fillStyle = "rgba(255, 182, 193, 0.9)"; 
        this.ctx.font = "20px Courier New";
        this.ctx.fillText(`SCORE: ${score}`, 20, 30);
        this.ctx.fillText(`LIVES: ${lives}`, 20, 60);
    }

    drawShip(ship) {
        this.ctx.strokeStyle = "white"; this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(ship.x + ship.radius * Math.cos(ship.angle), ship.y - ship.radius * Math.sin(ship.angle));
        this.ctx.lineTo(ship.x - ship.radius * (Math.cos(ship.angle) + Math.sin(ship.angle)), ship.y + ship.radius * (Math.sin(ship.angle) - Math.cos(ship.angle)));
        this.ctx.lineTo(ship.x - ship.radius * (Math.cos(ship.angle) - Math.sin(ship.angle)), ship.y + ship.radius * (Math.sin(ship.angle) + Math.cos(ship.angle)));
        this.ctx.closePath(); this.ctx.stroke();
    }

    drawProjectiles(projectiles) {
        this.ctx.fillStyle = "#FF0000"; 
        projectiles.forEach(p => {
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); this.ctx.fill();
        });
    }

    drawAsteroids(asteroids) {
        this.ctx.strokeStyle = "#CCCCCC"; this.ctx.lineWidth = 1.5;
        asteroids.forEach(a => {
            this.ctx.beginPath();
            for (let i = 0; i < a.vertices; i++) {
                let ang = i * (Math.PI * 2) / a.vertices;
                this.ctx.lineTo(a.x + a.offset[i] * Math.cos(ang), a.y + a.offset[i] * Math.sin(ang));
            }
            this.ctx.closePath(); this.ctx.stroke();
        });
    }

    drawGameOver() {
        this.ctx.fillStyle = "white"; this.ctx.textAlign = "center";
        this.ctx.font = "40px Courier New"; this.ctx.fillText("GAME OVER", 400, 300);
        this.ctx.font = "20px Courier New"; this.ctx.fillText("Press 'R' to Restart", 400, 340);
        this.ctx.textAlign = "left";
    }
}

class GameController {
    constructor() {
        this.view = new GameView("gameCanvas");
        this.model = new ShipModel(this.view.canvas.width, this.view.canvas.height);
        this.db = new PouchDB('asteroids_stats_db');
        this.init();
    }

    init() {
        window.addEventListener("keydown", (e) => {
            if (this.model.gameOver && e.code === "KeyR") return this.model.initGame();
            switch(e.code) {
                case "ArrowLeft":  this.model.rotation = 0.1; break;
                case "ArrowRight": this.model.rotation = -0.1; break;
                case "ArrowUp":    this.model.thrusting = true; break;
                case "Space":      e.preventDefault(); this.model.shoot(); break;
            }
        });
        window.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "ArrowRight") this.model.rotation = 0;
            if (e.code === "ArrowUp") this.model.thrusting = false;
        });
        this.loop();
    }

    handleCollisions() {
        if (this.model.gameOver) return;
        const { projectiles, asteroids } = this.model;

        for (let i = projectiles.length - 1; i >= 0; i--) {
            for (let j = asteroids.length - 1; j >= 0; j--) {
                if (Math.hypot(projectiles[i].x - asteroids[j].x, projectiles[i].y - asteroids[j].y) < asteroids[j].radius) {
                    this.model.score += (4 - asteroids[j].level) * 50;
                    this.model.splitAsteroid(asteroids[j]); 
                    projectiles.splice(i, 1);
                    asteroids.splice(j, 1);
                    break;
                }
            }
        }

        for (let a of asteroids) {
            if (Math.hypot(this.model.x - a.x, this.model.y - a.y) < this.model.radius + a.radius) {
                this.model.lives--;
                if (this.model.lives <= 0) this.model.gameOver = true;
                else this.model.resetShip();
                break;
            }
        }
    }

    loop() {
        this.model.update();
        this.handleCollisions();
        this.view.render(this.model);
        requestAnimationFrame(() => this.loop());
    }
}

new GameController();