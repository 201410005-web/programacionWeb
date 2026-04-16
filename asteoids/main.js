
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

    update(width, height) {
        this.x += this.velX;
        this.y += this.velY;
        if (this.x < -this.radius) this.x = width + this.radius;
        else if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        else if (this.y > height + this.radius) this.y = -this.radius;
    }
}


class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speed = 8;
        this.radius = 2; // Necesario para colisión
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
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.reset();
        this.projectiles = [];
        this.asteroids = [];
    }

    reset() {
        this.x = this.width / 2;
        this.y = this.height / 2;
        this.radius = 12;
        this.angle = Math.PI / 2;
        this.rotation = 0;
        this.thrusting = false;
        this.thrust = { x: 0, y: 0 };
        this.friction = 0.98;
    }

    shoot() {
        const pX = this.x + this.radius * Math.cos(this.angle);
        const pY = this.y - this.radius * Math.sin(this.angle);
        this.projectiles.push(new Projectile(pX, pY, this.angle));
    }

    generateAsteroids(count) {
        for (let i = 0; i < count; i++) {
            this.asteroids.push(new Asteroid());
        }
    }

    update() {
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

        if (this.x < -this.radius) this.x = this.width + this.radius;
        else if (this.x > this.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = this.height + this.radius;
        else if (this.y > this.height + this.radius) this.y = -this.radius;

        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => p.lifeSpan > 0);
        this.asteroids.forEach(a => a.update(this.width, this.height));
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
        this.drawShip(model);
        this.drawProjectiles(model.projectiles);
        this.drawAsteroids(model.asteroids);
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
        this.ctx.fillStyle = "#FF4444";
        projectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawAsteroids(asteroids) {
        this.ctx.strokeStyle = "#AAAAAA";
        this.ctx.lineWidth = 1.5;
        asteroids.forEach(a => {
            this.ctx.beginPath();
            for (let i = 0; i < a.vertices; i++) {
                const angle = i * (Math.PI * 2) / a.vertices;
                const r = a.offset[i];
                const x = a.x + r * Math.cos(angle);
                const y = a.y + r * Math.sin(angle);
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        });
    }
}


class GameController {
    constructor() {
        this.view = new GameView("gameCanvas");
        this.model = new ShipModel(this.view.canvas.width, this.view.canvas.height);
        this.db = new PouchDB('asteroids_game_data');
        this.init();
    }

    async init() {
        this.initEvents();
        this.model.generateAsteroids(6);
        this.loop();
    }

    initEvents() {
        document.addEventListener("keydown", (e) => {
            if (e.code === "ArrowLeft") this.model.rotation = 0.08;
            if (e.code === "ArrowRight") this.model.rotation = -0.08;
            if (e.code === "ArrowUp") this.model.thrusting = true;
            if (e.code === "Space") this.model.shoot();
        });
        document.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "ArrowRight") this.model.rotation = 0;
            if (e.code === "ArrowUp") this.model.thrusting = false;
        });
    }

    // Lógica de detección de colisiones (Círculo vs Círculo)
    distBetweenPoints(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    handleCollisions() {
        const { asteroids, projectiles } = this.model;

       //Proyectiles vs Asteroides
        for (let i = projectiles.length - 1; i >= 0; i--) {
            for (let j = asteroids.length - 1; j >= 0; j--) {
                if (this.distBetweenPoints(projectiles[i].x, projectiles[i].y, asteroids[j].x, asteroids[j].y) < asteroids[j].radius) {
                    this.logEvent("COLLISION_BULLET", { asteroid_id: j });
                    asteroids.splice(j, 1);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }

      
        for (let i = 0; i < asteroids.length; i++) {
            if (this.distBetweenPoints(this.model.x, this.model.y, asteroids[i].x, asteroids[i].y) < this.model.radius + asteroids[i].radius) {
                this.logEvent("COLLISION_SHIP", { pos: { x: this.model.x, y: this.model.y } });
                this.model.reset(); // Reiniciar nave
                break;
            }
        }
    }

    async logEvent(type, detail) {
        const doc = { _id: `col_${Date.now()}`, type, detail, timestamp: new Date().toISOString() };
        try { await this.db.put(doc); } catch (e) {}
    }

    loop() {
        this.model.update();
        this.handleCollisions(); // Ejecutar motor de colisiones
        this.view.render(this.model);
        requestAnimationFrame(() => this.loop());
    }
}

const game = new GameController();