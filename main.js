
class Asteroid {
    constructor(x, y, radius) {
        this.x = x || Math.random() * 800;
        this.y = y || Math.random() * 600;
        this.radius = radius || 40;
        this.velX = (Math.random() * 2 - 1) * 2;
        this.velY = (Math.random() * 2 - 1) * 2;
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
        this.velocity = { 
            x: Math.cos(angle) * this.speed, 
            y: -Math.sin(angle) * this.speed 
        };
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
        this.spawnAsteroids(6);
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
        this.invulnerableTime = 120; 
    }

    spawnAsteroids(count) {
        for (let i = 0; i < count; i++) {
            this.asteroids.push(new Asteroid());
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

        // Rotación y Empuje
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

        // Screen Wrap
        if (this.x < -this.radius) this.x = this.canvasW + this.radius;
        else if (this.x > this.canvasW + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = this.canvasH + this.radius;
        else if (this.y > this.canvasH + this.radius) this.y = -this.radius;

        if (this.invulnerableTime > 0) this.invulnerableTime--;

        // Actualizar listas de objetos
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => p.lifeSpan > 0);
        this.asteroids.forEach(a => a.update(this.canvasW, this.canvasH));
    }
}


class GameView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
    }

    render(model) {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!model.gameOver) {
            this.drawShip(model);
        } else {
            this.drawGameOver();
        }

        this.drawProjectiles(model.projectiles);
        this.drawAsteroids(model.asteroids);
        this.drawUI(model.score, model.lives);
    }

    drawUI(score, lives) {
        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Courier New";
        this.ctx.fillText(`SCORE: ${score}`, 20, 30);
        this.ctx.fillText(`LIVES: ${lives}`, 20, 60);
    }

    drawShip(ship) {
        if (ship.invulnerableTime % 10 > 5) return; // Efecto parpadeo

        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(ship.x + ship.radius * Math.cos(ship.angle), ship.y - ship.radius * Math.sin(ship.angle));
        this.ctx.lineTo(ship.x - ship.radius * (Math.cos(ship.angle) + Math.sin(ship.angle)), ship.y + ship.radius * (Math.sin(ship.angle) - Math.cos(ship.angle)));
        this.ctx.lineTo(ship.x - ship.radius * (Math.cos(ship.angle) - Math.sin(ship.angle)), ship.y + ship.radius * (Math.sin(ship.angle) + Math.cos(ship.angle)));
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawProjectiles(projectiles) {
        this.ctx.fillStyle = "yellow";
        projectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawAsteroids(asteroids) {
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 1.5;
        asteroids.forEach(a => {
            this.ctx.beginPath();
            for (let i = 0; i < a.vertices; i++) {
                let ang = i * (Math.PI * 2) / a.vertices;
                this.ctx.lineTo(a.x + a.offset[i] * Math.cos(ang), a.y + a.offset[i] * Math.sin(ang));
            }
            this.ctx.closePath();
            this.ctx.stroke();
        });
    }

    drawGameOver() {
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.font = "40px Courier New";
        this.ctx.fillText("GAME OVER", this.canvas.width/2, this.canvas.height/2);
        this.ctx.font = "20px Courier New";
        this.ctx.fillText("Press 'R' to Restart", this.canvas.width/2, this.canvas.height/2 + 40);
        this.ctx.textAlign = "left";
    }
}


class GameController {
    constructor() {
        this.view = new GameView("gameCanvas");
        this.model = new ShipModel(this.view.canvas.width, this.view.canvas.height);
        this.db = new PouchDB('asteroids_pouch_db');
        this.init();
    }

    init() {
        window.addEventListener("keydown", (e) => {
            if (this.model.gameOver && e.code === "KeyR") {
                this.model.initGame();
                return;
            }

            switch(e.code) {
                case "ArrowLeft":  this.model.rotation = 0.1; break;
                case "ArrowRight": this.model.rotation = -0.1; break;
                case "ArrowUp":    this.model.thrusting = true; break;
                case "Space":      
                    e.preventDefault(); 
                    this.model.shoot(); 
                    this.logToDB("SHOT_FIRED");
                    break;
            }
        });

        window.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "ArrowRight") this.model.rotation = 0;
            if (e.code === "ArrowUp") this.model.thrusting = false;
        });

        this.loop();
    }

    async logToDB(type) {
        try {
            await this.db.put({ _id: `event_${Date.now()}`, type, score: this.model.score });
        } catch(e) {}
    }

    handleCollisions() {
        if (this.model.gameOver) return;

        //Balas vs Asteroides
        for (let i = this.model.projectiles.length - 1; i >= 0; i--) {
            for (let j = this.model.asteroids.length - 1; j >= 0; j--) {
                let p = this.model.projectiles[i];
                let a = this.model.asteroids[j];
                if (Math.hypot(p.x - a.x, p.y - a.y) < a.radius) {
                    this.model.score += 100;
                    this.model.projectiles.splice(i, 1);
                    this.model.asteroids.splice(j, 1);
                    break;
                }
            }
        }

        //Nave vs Asteroides
        if (this.model.invulnerableTime <= 0) {
            for (let a of this.model.asteroids) {
                if (Math.hypot(this.model.x - a.x, this.model.y - a.y) < this.model.radius + a.radius) {
                    this.model.lives--;
                    if (this.model.lives <= 0) {
                        this.model.gameOver = true;
                        this.logToDB("GAME_OVER_FINAL");
                    } else {
                        this.model.resetShip();
                        this.logToDB("LIFE_LOST");
                    }
                    break;
                }
            }
        }

        if (this.model.asteroids.length === 0) this.model.spawnAsteroids(6);
    }

    loop() {
        this.model.update();
        this.handleCollisions();
        this.view.render(this.model);
        requestAnimationFrame(() => this.loop());
    }
}

// Arrancar el juego
new GameController();