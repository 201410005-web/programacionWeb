
class Asteroid {
    constructor(x, y, radius, forceOutside = false) {
        this.canvasW = 800;
        this.canvasH = 600;
        
        
        if (forceOutside) {
            
            if (Math.random() < 0.5) {
                this.x = Math.random() < 0.5 ? -radius : this.canvasW + radius;
                this.y = Math.random() * this.canvasH;
            } else {
                this.x = Math.random() * this.canvasW;
                this.y = Math.random() < 0.5 ? -radius : this.canvasH + radius;
            }
        } else {
            
            this.x = x || Math.random() * this.canvasW;
            this.y = y || Math.random() * this.canvasH;
        }

        this.radius = radius || 40;
        
        
        this.velX = (Math.random() * 2 - 1) * 1.5;
        this.velY = (Math.random() * 2 - 1) * 1.5;
        
        
        if (forceOutside) {
            if (this.x < 0) this.velX = Math.abs(this.velX);
            if (this.x > this.canvasW) this.velX = -Math.abs(this.velX);
            if (this.y < 0) this.velY = Math.abs(this.velY);
            if (this.y > this.canvasH) this.velY = -Math.abs(this.velY);
        }

        
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
        
        
        this.spawnAsteroids(8, true); 
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
            
            if (!forceOutside) {
                let astX, astY;
                do {
                    astX = Math.random() * this.canvasW;
                    astY = Math.random() * this.canvasH;
                } while (Math.hypot(astX - this.x, astY - this.y) < 150);
                this.asteroids.push(new Asteroid(astX, astY, 40, false));
            } else {
                this.asteroids.push(new Asteroid(0, 0, 40, true));
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

        
        if (this.x < -this.radius) this.x = this.canvasW + this.radius;
        else if (this.x > this.canvasW + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = this.canvasH + this.radius;
        else if (this.y > this.canvasH + this.radius) this.y = -this.radius;

        
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => p.lifeSpan > 0);
        this.asteroids.forEach(a => a.update(this.canvasW, this.canvasH));
        
        
        if (this.asteroids.length < 4) {
            this.spawnAsteroids(2, true); 
        }
    }
}


class Starfield {
    constructor(w, h, count) {
        this.stars = [];
        for(let i=0; i<count; i++) {
            this.stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 2,
                opacity: Math.random() * 0.7 + 0.3
            });
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,800,600);
        
        this.stars.forEach(s => {
            // Color Rosado Pastel: rgba(255, 182, 193, alpha)
            ctx.fillStyle = `rgba(255, 182, 193, ${s.opacity})`; 
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
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
        // UI en Rosado Pastel para combinar
        this.ctx.fillStyle = "rgba(255, 182, 193, 0.9)"; 
        this.ctx.font = "20px Courier New";
        this.ctx.fillText(`SCORE: ${score}`, 20, 30);
        this.ctx.fillText(`LIVES: ${lives}`, 20, 60);
    }

    drawShip(ship) {
        
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
        // Disparos Rojos solicitados
        this.ctx.fillStyle = "#FF0000"; 
        projectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawAsteroids(asteroids) {
        // Color gris claro para asteroides
        this.ctx.strokeStyle = "#CCCCCC";
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
        this.ctx.textAlign = "left"; // Reset para UI
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
            if (this.model.gameOver && e.code === "KeyR") {
                this.model.initGame();
                return;
            }

            switch(e.code) {
                case "ArrowLeft":  this.model.rotation = 0.1; break;
                case "ArrowRight": this.model.rotation = -0.1; break;
                case "ArrowUp":    this.model.thrusting = true; break;
                case "Space":      
                    e.preventDefault(); // Evitar scroll
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

        const { projectiles, asteroids } = this.model;

        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            for (let j = asteroids.length - 1; j >= 0; j--) {
                let p = projectiles[i];
                let a = asteroids[j];
                // Detección por radio (distancia euclidiana)
                if (Math.hypot(p.x - a.x, p.y - a.y) < a.radius) {
                    this.model.score += 100;
                    projectiles.splice(i, 1);
                    asteroids.splice(j, 1);
                    
                    break;
                }
            }
        }

        
        
        for (let a of asteroids) {
            let dist = Math.hypot(this.model.x - a.x, this.model.y - a.y);
            
            if (dist < this.model.radius + a.radius) {
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

    loop() {
        this.model.update();
        this.handleCollisions();
        this.view.render(this.model);
        requestAnimationFrame(() => this.loop());
    }
}


new GameController();