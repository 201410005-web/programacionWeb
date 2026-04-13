
class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speed = 7;
        this.velocity = {
            x: Math.cos(angle) * this.speed,
            y: -Math.sin(angle) * this.speed
        };
        this.lifeSpan = 120; 
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
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.radius = 15;
        this.angle = Math.PI / 2;
        this.rotation = 0;
        this.thrusting = false;
        this.thrust = { x: 0, y: 0 };
        this.friction = 0.98;
        this.projectiles = []; 
    }

    shoot() {
        
        const pX = this.x + this.radius * Math.cos(this.angle);
        const pY = this.y - this.radius * Math.sin(this.angle);
        this.projectiles.push(new Projectile(pX, pY, this.angle));
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
    }
}

class GameView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
    }

    clear() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(model) {
        this.clear();
        this.drawShip(model);
        this.drawProjectiles(model.projectiles);
    }

    drawShip(ship) {
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(
            ship.x + ship.radius * Math.cos(ship.angle),
            ship.y - ship.radius * Math.sin(ship.angle)
        );
        this.ctx.lineTo(
            ship.x - ship.radius * (Math.cos(ship.angle) + Math.sin(ship.angle)),
            ship.y + ship.radius * (Math.sin(ship.angle) - Math.cos(ship.angle))
        );
        this.ctx.lineTo(
            ship.x - ship.radius * (Math.cos(ship.angle) - Math.sin(ship.angle)),
            ship.y + ship.radius * (Math.sin(ship.angle) + Math.cos(ship.angle))
        );
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawProjectiles(projectiles) {
        this.ctx.fillStyle = "red";
        projectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}


class GameController {
    constructor() {
        this.view = new GameView("gameCanvas");
        this.model = new ShipModel(this.view.canvas.width, this.view.canvas.height);
        this.db = new PouchDB('asteroids_game_data');
        this.initEvents();
        this.loop();
    }

    initEvents() {
        document.addEventListener("keydown", (e) => {
            if (e.code === "ArrowLeft") this.model.rotation = 0.1;
            if (e.code === "ArrowRight") this.model.rotation = -0.1;
            if (e.code === "ArrowUp") this.model.thrusting = true;
            if (e.code === "Space") {
                this.model.shoot();
                this.logToDB("SHOOT");
            }
        });

        document.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "ArrowRight") this.model.rotation = 0;
            if (e.code === "ArrowUp") this.model.thrusting = false;
        });
    }

    async logToDB(actionType) {
        const doc = {
            _id: "event_" + new Date().getTime(),
            action: actionType,
            shipPos: { x: this.model.x, y: this.model.y },
            timestamp: new Date().toISOString()
        };
        try { await this.db.put(doc); } catch (err) { console.error(err); }
    }

    loop() {
        this.model.update();
        this.view.render(this.model);
        requestAnimationFrame(() => this.loop());
    }
}

const game = new GameController();