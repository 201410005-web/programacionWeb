//clase asteroide
 
class Asteroid {
    constructor(x, y, radius, level, forceOutside = false) {

        //Dimensiones del área de juego
        this.canvasW = 800;
        this.canvasH = 600;

        // Tamaño del asteroide (si no se pasa valor usa 40)
        this.radius = radius || 40;
  
        // Nivel → determina tamaño y dificultad
        this.level = level || 3; 

        /**
         * POSICIONAMIENTO INICIAL
         * Si forceOutside = true, el asteroide aparece fuera de pantalla
         * Esto crea un efecto natural de entrada
         */

        if (forceOutside) {
            if (Math.random() < 0.5) {

                // Aparece por izquierda o derecha
                this.x = Math.random() < 0.5 ? -this.radius : this.canvasW + this.radius;
                this.y = Math.random() * this.canvasH;

            } else {

                // Aparece por arriba o abajo
                this.x = Math.random() * this.canvasW;
                this.y = Math.random() < 0.5 ? -this.radius : this.canvasH + this.radius;
            }
        } else {
            
            // Si no, usa posición dada
            this.x = x;
            this.y = y;
        }

        //VELOCIDAD
        const speedMultiplier = this.level * 0.5; 

        // Movimiento aleatorio en X
        this.velX = (Math.random() * 2 - 1) * speedMultiplier;

        // Movimiento aleatorio en Y
        this.velY = (Math.random() * 2 - 1) * speedMultiplier;

       
        /**
         * FORMA IRREGULAR
         * Se generan vértices aleatorios
         */ 

        this.vertices = Math.floor(Math.random() * 7 + 8);
        this.offset = [];  

        // Genera variación en cada vértice
        for (let i = 0; i < this.vertices; i++) {
            this.offset.push(Math.random() * (this.radius * 0.4) + (this.radius * 0.6));
        }
    }

  
        //ACTUALIZACIÓN DE POSICIÓN
     
    update(w, h) {


        // Movimiento basado en velocidad acumulada
        this.x += this.velX;
        this.y += this.velY;


        //Si sale por un lado, entra por el opuesto
        if (this.x < -this.radius) this.x = w + this.radius;
        else if (this.x > w + this.radius) this.x = -this.radius;

        if (this.y < -this.radius) this.y = h + this.radius;
        else if (this.y > h + this.radius) this.y = -this.radius;
    }
}

//CLASE 2: PROYECTIL

class Projectile {
    constructor(x, y, angle) {

        this.x = x;// posición inicial X
        this.y = y;// posición inicial Y

        this.speed = 8;// velocidad constante
        this.radius = 2;// tamaño del disparo


       
        //DIRECCIÓN DEL DISPARO Uso trigonometría (coseno y seno)
         
        this.velocity = { x: Math.cos(angle) * this.speed, y: -Math.sin(angle) * this.speed };

        // Tiempo de vida → evita saturación
        this.lifeSpan = 60;
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.lifeSpan--;// reduce vida cada frame
    }
}

//MODELO

class ShipModel {
    constructor(w, h) {
        this.canvasW = w;
        this.canvasH = h;
        this.initGame();
    }

    
    //inicializa el juego

    initGame() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;


         // Uso arrays porque necesito manejar múltiples objetos dinámicamente

        this.asteroids = [];
        this.projectiles = [];


        this.resetShip();
        this.spawnAsteroids(5, true); 
    }

    //reinicia la nave

    resetShip() {

        // Inicio en el centro → mejor control para el jugador
        this.x = this.canvasW / 2;
        this.y = this.canvasH / 2;

        this.radius = 15; 


        // Ángulo en radianes
        this.angle = Math.PI / 2;

        this.rotation = 0;
        this.thrusting = false;

        this.thrust = { x: 0, y: 0 };
        this.friction = 0.98;// simulación de inercia
    }

    spawnAsteroids(count, forceOutside = false) {
        for (let i = 0; i < count; i++) {
            this.asteroids.push(new Asteroid(0, 0, 40, 3, forceOutside));
        }
    }

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
        const pX = this.x + (this.radius + 5) * Math.cos(this.angle);
        const pY = this.y - (this.radius + 5) * Math.sin(this.angle);
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

//CLASE ESTRELLAS

class Starfield {
    constructor(w, h, count) {
        this.stars = [];

        // Genera estrellas aleatorias
        for(let i=0; i<count; i++) {
            this.stars.push({ x: Math.random()*w, y: Math.random()*h, size: Math.random()*2, opacity: Math.random()*0.7+0.3 });
        }
    }
    draw(ctx) {

        // Fondo negro
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,800,600);

        // Dibuja estrellas
        this.stars.forEach(s => {
            ctx.fillStyle = `rgba(255, 182, 193, ${s.opacity})`; 
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        });
    }
}

//CLASE 4: VISTA (GAMEVIEW)

class GameView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);

        // Contexto de dibujo 2D → necesario para usar canvas
        this.ctx = this.canvas.getContext("2d");

        // Crea fondo de estrellas
        this.starfield = new Starfield(this.canvas.width, this.canvas.height, 100);
    }

  
    //RENDER PRINCIPAL

    render(model) {

        // Dibuja el fondo primero
        this.starfield.draw(this.ctx);

        // Si el juego no terminó, dibuja la nave
        if (!model.gameOver) this.drawShip(model);

        // Si terminó, muestra Game Over
        else this.drawGameOver();

        // Dibuja disparos
        this.drawProjectiles(model.projectiles);

        // Dibuja asteroides
        this.drawAsteroids(model.asteroids);

        // Dibuja interfaz (puntaje y vidas)
        this.drawUI(model.score, model.lives);
    }

    drawUI(score, lives) {

        // Color pastel
        this.ctx.fillStyle = "rgba(255, 182, 193, 0.9)"; 

        // Fuente tipo consola
        this.ctx.font = "20px Courier New";

        // Muestra puntaje
        this.ctx.fillText(`SCORE: ${score}`, 20, 30);

        // Muestra vidas
        this.ctx.fillText(`LIVES: ${lives}`, 20, 60);
    }

    drawShip(ship) {
        const { x, y, radius, angle, thrusting } = ship;

        // Guarda estado actual del canvas
        this.ctx.save();

        // Mueve el origen al centro de la nave
        this.ctx.translate(x, y);

        // Rota según dirección
        this.ctx.rotate(-angle + Math.PI / 2); // Ajuste de ángulo para sistema de coordenadas de canvas


        //DIBUJO DE PROPULSORES (FUEGO)

        if (thrusting) {
            this.ctx.fillStyle = "rgba(255, 100, 0, 0.8)";
            this.ctx.beginPath();

            // Llama izquierda
            this.ctx.moveTo(-7, 10);
            this.ctx.lineTo(0, 25 + Math.random() * 10);
            this.ctx.lineTo(7, 10);
            this.ctx.fill();

            // Centro más caliente
            this.ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
            this.ctx.beginPath();
            this.ctx.moveTo(-4, 10);
            this.ctx.lineTo(0, 18 + Math.random() * 5);
            this.ctx.lineTo(4, 10);
            this.ctx.fill();
        }

        //CUERPO DE LA NAVE

        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = "black";
        
        this.ctx.beginPath();

        // Punta de la nave
        this.ctx.moveTo(0, -radius);

        // Ala derecha
        this.ctx.lineTo(radius, radius);

        // Hendidura del motor derecha
        this.ctx.lineTo(radius * 0.5, radius * 0.7);

        // Hendidura del motor izquierda
        this.ctx.lineTo(-radius * 0.5, radius * 0.7);

        // Ala izquierda
        this.ctx.lineTo(-radius, radius);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        //CABINA
        this.ctx.strokeStyle = "rgba(255, 182, 193, 1)"; // Color pastel
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
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

//CONTROLADOR (GAMECONTROLLER)

class GameController {
    constructor() {
        this.view = new GameView("gameCanvas");
        this.model = new ShipModel(this.view.canvas.width, this.view.canvas.height);
        
        this.init();
    }


    //EVENTOS DE TECLADO

    init() {
        window.addEventListener("keydown", (e) => {

      
            // Reinicio
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