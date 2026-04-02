//Configuración del fondo
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//Estado inicial o posicion de la nave
const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30, // Tamano de la nave
    angle: 90 / 180 * Math.PI // Apuntando hacia arriba
};

//Función principal de dibujo
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(
        ship.x + ship.size * Math.cos(ship.angle),
        ship.y - ship.size * Math.sin(ship.angle)
    );
    ctx.lineTo(
        ship.x - ship.size * (Math.cos(ship.angle) + Math.sin(ship.angle)),
        ship.y + ship.size * (Math.sin(ship.angle) - Math.cos(ship.angle))
    );
    ctx.lineTo(
        ship.x - ship.size * (Math.cos(ship.angle) - Math.sin(ship.angle)),
        ship.y + ship.size * (Math.sin(ship.angle) + Math.cos(ship.angle))
    );
    ctx.closePath(); 
    ctx.stroke();
}

// Ejecutar el dibujo
draw();