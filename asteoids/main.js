
class ShipModel {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.radius = 15;
        this.angle = 90 / 180 * Math.PI; 
        this.rotation = 0;               
        this.thrusting = false;          
        this.thrust = { x: 0, y: 0 };    
        this.friction = 0.98;            
    }

    update() {
        
        this.angle += this.rotation;

        // 2. Manejar Empuje (Traslación)
        if (this.thrusting) {
            this.thrust.x += 0.15 * Math.cos(this.angle);
            this.thrust.y -= 0.15 * Math.sin(this.angle);
        } else {
            
            this.thrust.x *= this.friction;
            this.thrust.y *= this.friction;
        }

        
        this.x += this.thrust.x;
        this.y += this.thrust.y;

        
        if (this.x < 0 - this.radius) this.x = this.width + this.radius;
        else if (this.x > this.width + this.radius) this.x = 0 - this.radius;
        
        if (this.y < 0 - this.radius) this.y = this.height + this.radius;
        else if (this.y > this.height + this.radius) this.y = 0 - this.radius;
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
}


class GameController {
    constructor() {
        this.view = new GameView("gameCanvas");
        this.model = new ShipModel(this.view.canvas.width, this.view.canvas.height);
        this.db = new PouchDB('asteroids_logs');
        
        this.initEventListeners();
        this.gameLoop();
    }

    initEventListeners() {
        document.addEventListener("keydown", (e) => this.handleKeys(e, true));
        document.addEventListener("keyup", (e) => this.handleKeys(e, false));
    }

    handleKeys(event, isPressed) {
        let action = "";
        switch(event.keyCode) {
            case 37: 
                this.model.rotation = isPressed ? 0.1 : 0;
                action = "ROTATE_LEFT";
                break;
            case 38: 
                this.model.thrusting = isPressed;
                action = "THRUST";
                break;
            case 39: 
                this.model.rotation = isPressed ? -0.1 : 0;
                action = "ROTATE_RIGHT";
                break;
        }
        
        
        if (isPressed && action !== "") this.logEvent(action);
    }

    async logEvent(type) {
        const entry = {
            _id: new Date().toJSON(),
            type: type,
            posX: this.model.x,
            posY: this.model.y,
            angle: this.model.angle
        };
        try {
            await this.db.put(entry);
        } catch (err) {
            console.error("Error en PouchDB:", err);
        }
    }

    gameLoop() {
        
        this.model.update();

       
        this.view.clear();
        this.view.drawShip(this.model);

        
        requestAnimationFrame(() => this.gameLoop());
    }
}


const app = new GameController();