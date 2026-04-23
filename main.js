///////////// EVENT BUS ///////////////////////
class EventBus {
    constructor(){ this.events = {}; }
    on(e,cb){ (this.events[e] ||= []).push(cb); }
    emit(e,data){ (this.events[e]||[]).forEach(cb=>cb(data)); }
}

/////////////// GAME STATE /////////////
class GameState {
    constructor(){
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
    }
}

///////////////STARFIELD /////////////
class Starfield {
    constructor(w,h,count){
        this.stars=[];
        for(let i=0;i<count;i++){
            this.stars.push({
                x:Math.random()*w,
                y:Math.random()*h,
                size:Math.random()*2,
                opacity:Math.random()*0.7+0.3
            });
        }
    }
    draw(ctx){
        ctx.fillStyle="black";
        ctx.fillRect(0,0,800,600);

        this.stars.forEach(s=>{
            ctx.fillStyle=`rgba(255,182,193,${s.opacity})`;
            ctx.beginPath();
            ctx.arc(s.x,s.y,s.size,0,Math.PI*2);
            ctx.fill();
        });
    }
}

///////////////SHIP SYSTEM/////////////
class ShipSystem {
    constructor(bus){
        this.bus = bus;
        this.reset();

        window.addEventListener("keydown",(e)=>{
            if(e.code==="ArrowLeft") this.rotation=0.1;
            if(e.code==="ArrowRight") this.rotation=-0.1;
            if(e.code==="ArrowUp") this.thrusting=true;
            if(e.code==="Space") this.shoot();
        });

        window.addEventListener("keyup",(e)=>{
            if(e.code==="ArrowLeft"||e.code==="ArrowRight") this.rotation=0;
            if(e.code==="ArrowUp") this.thrusting=false;
        });
    }

    reset(){
        this.x=400; this.y=300;
        this.angle=Math.PI/2;
        this.rotation=0;
        this.thrusting=false;
        this.radius=15;
        this.vel={x:0,y:0};
        this.friction=0.98;
    }

    shoot(){
        this.bus.emit("shoot",{x:this.x,y:this.y,angle:this.angle});
    }

    update(){
        this.angle+=this.rotation;

        if(this.thrusting){
            this.vel.x += Math.cos(this.angle)*0.15;
            this.vel.y -= Math.sin(this.angle)*0.15;
        } else {
            this.vel.x *= this.friction;
            this.vel.y *= this.friction;
        }

        this.x+=this.vel.x;
        this.y+=this.vel.y;

        this.bus.emit("ship:update",this);
    }
}

///////////////PROJECTILES/////////////
class ProjectileSystem {
    constructor(bus){
        this.bus=bus;
        this.projectiles=[];

        bus.on("shoot",(d)=>{
            this.projectiles.push({
                x:d.x + Math.cos(d.angle)*20,
                y:d.y - Math.sin(d.angle)*20,
                vx:Math.cos(d.angle)*8,
                vy:-Math.sin(d.angle)*8,
                life:60
            });
        });
    }

    update(){
        this.projectiles.forEach(p=>{
            p.x+=p.vx;
            p.y+=p.vy;
            p.life--;
        });

        this.projectiles=this.projectiles.filter(p=>p.life>0);

        this.bus.emit("projectiles:update",this.projectiles);
    }
}

///////////////ASTEROIDES/////////////
class AsteroidSystem {
    constructor(bus){
        this.bus=bus;
        this.asteroids=[];
        this.spawn(5);
    }

    create(x,y,r,level,forceOutside=true){
        let ax=x, ay=y;

        if(forceOutside){
            if(Math.random()<0.5){
                ax = Math.random()<0.5 ? -r : 800+r;
                ay = Math.random()*600;
            } else {
                ax = Math.random()*800;
                ay = Math.random()<0.5 ? -r : 600+r;
            }
        }

        let a={
            x:ax,y:ay,
            r:r,
            level:level,
            vx:(Math.random()*2-1)*(level*0.5),
            vy:(Math.random()*2-1)*(level*0.5),
            vertices:Math.floor(Math.random()*7+8),
            offset:[]
        };

        for(let i=0;i<a.vertices;i++){
            a.offset.push(Math.random()*(r*0.4)+(r*0.6));
        }

        return a;
    }

    spawn(n){
        for(let i=0;i<n;i++){
            this.asteroids.push(this.create(0,0,40,3,true));
        }
    }

    split(a){
        if(a.level>1){
            for(let i=0;i<2;i++){
                this.asteroids.push(this.create(a.x,a.y,a.r/1.5,a.level-1,false));
            }
        }
    }

    update(){
        this.asteroids.forEach(a=>{
            a.x+=a.vx;
            a.y+=a.vy;

            if(a.x<-a.r) a.x=800+a.r;
            if(a.x>800+a.r) a.x=-a.r;
            if(a.y<-a.r) a.y=600+a.r;
            if(a.y>600+a.r) a.y=-a.r;
        });

        if(this.asteroids.length<3){
            this.spawn(2);
        }

        this.bus.emit("asteroids:update",this.asteroids);
    }
}

///////////////COLLISION/////////////
class CollisionSystem {
    constructor(bus,state,asteroids){
        this.bus=bus;
        this.state=state;
        this.asteroidsSystem=asteroids;

        this.projectiles=[];
        this.asteroids=[];
        this.ship=null;

        bus.on("projectiles:update",p=>this.projectiles=p);
        bus.on("asteroids:update",a=>this.asteroids=a);
        bus.on("ship:update",s=>this.ship=s);
    }

    update(){
        for(let i=this.projectiles.length-1;i>=0;i--){
            for(let j=this.asteroids.length-1;j>=0;j--){
                let p=this.projectiles[i];
                let a=this.asteroids[j];

                let d=Math.hypot(p.x-a.x,p.y-a.y);

                if(d<a.r){
                    this.state.score += (4-a.level)*50;
                    this.asteroidsSystem.split(a);
                    this.projectiles.splice(i,1);
                    this.asteroids.splice(j,1);
                    break;
                }
            }
        }

        if(this.ship){
            this.asteroids.forEach(a=>{
                let d=Math.hypot(this.ship.x-a.x,this.ship.y-a.y);
                if(d<this.ship.radius+a.r){
                    this.state.lives--;
                    this.ship.reset();
                    if(this.state.lives<=0) this.state.gameOver=true;
                }
            });
        }
    }
}

///////////////VIEW/////////////
class GameView {
    constructor(){
        this.canvas=document.getElementById("gameCanvas");
        this.ctx=this.canvas.getContext("2d");
        this.starfield=new Starfield(800,600,100);
    }

    render(ship,asteroids,projectiles,state){
        this.starfield.draw(this.ctx);

        this.drawShip(ship);
        this.drawAsteroids(asteroids);
        this.drawProjectiles(projectiles);
        this.drawUI(state);
    }

    drawUI(state){
        this.ctx.fillStyle="rgba(255,182,193,0.9)";
        this.ctx.font="20px Courier New";
        this.ctx.fillText("SCORE: "+state.score,20,30);
        this.ctx.fillText("LIVES: "+state.lives,20,60);
    }

    drawShip(s){
        if(!s) return;

        const ctx=this.ctx;
        ctx.save();
        ctx.translate(s.x,s.y);
        ctx.rotate(-s.angle+Math.PI/2);

        if(s.thrusting){
            ctx.fillStyle="orange";
            ctx.beginPath();
            ctx.moveTo(-7,10);
            ctx.lineTo(0,25+Math.random()*10);
            ctx.lineTo(7,10);
            ctx.fill();
        }

        ctx.strokeStyle="white";
        ctx.beginPath();
        ctx.moveTo(0,-s.radius);
        ctx.lineTo(s.radius,s.radius);
        ctx.lineTo(-s.radius,s.radius);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    drawAsteroids(arr){
        const ctx=this.ctx;
        ctx.strokeStyle="#ccc";

        arr.forEach(a=>{
            ctx.beginPath();
            for(let i=0;i<a.vertices;i++){
                let ang=i*(Math.PI*2)/a.vertices;
                ctx.lineTo(
                    a.x + a.offset[i]*Math.cos(ang),
                    a.y + a.offset[i]*Math.sin(ang)
                );
            }
            ctx.closePath();
            ctx.stroke();
        });
    }

    drawProjectiles(arr){
        arr.forEach(p=>{
            this.ctx.beginPath();
            this.ctx.arc(p.x,p.y,3,0,Math.PI*2);
            this.ctx.fillStyle="red";
            this.ctx.fill();
        });
    }
}

///////////////GAME/////////////
class Game {
    constructor(){
        this.bus=new EventBus();
        this.state=new GameState();

        this.ship=new ShipSystem(this.bus);
        this.projectiles=new ProjectileSystem(this.bus);
        this.asteroids=new AsteroidSystem(this.bus);
        this.collision=new CollisionSystem(this.bus,this.state,this.asteroids);

        this.view=new GameView();

        this.loop();
    }

    loop(){
        if(!this.state.gameOver){
            this.ship.update();
            this.projectiles.update();
            this.asteroids.update();
            this.collision.update();
        }

        this.view.render(
            this.ship,
            this.asteroids.asteroids,
            this.projectiles.projectiles,
            this.state
        );

        requestAnimationFrame(()=>this.loop());
    }
}

new Game();