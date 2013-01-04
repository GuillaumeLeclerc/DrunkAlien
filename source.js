
window.requestAnimFrame =
    (function () {
        return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function ( callback, element) {
            window.setTimeout(callback, 1000 / 60);
        };
    }
    )();

var Game = function (iCanvas, iNom) {
    var me = this;
    this.gameOver = false;
    this.Run = function () {
        if (!me.CheckResources()) {
            setTimeout(me.Run, 200);
        }
        else {
            me.Run = function () {
                var time = new Date().getMilliseconds();
                me.DoInputs();
                me.Animate();
                me.GenBlocs();
                if (me.Data.GLS > 40) {
                    me.Data.Frames++;
                    me.CLR();
                    me.Render();
                }
                if (me.gameOver == true) {
                    me.Canvas.Context.fillStyle = "rgba(0,0,0,0.8)";
                    me.Canvas.Context.fillRect(0, 0, 800, 600);
                    me.Canvas.Context.drawImage(me.Resources.Images[7].base, 235, 100);
                    me.DrawScore();
                    me.AJAX();
                }
                else {
                    me.Data.Score++;
                    me.Data.Loops++;
                    window.setTimeout(me.Run, 1000 / 60);
                }
            }
            me.Run();
        }
    };
    this.Nom = iNom;
    this.Canvas ={
        Base : iCanvas,
        Context : iCanvas.getContext("2d")
    };
    this.BGCanvas = new PRCanvas(800, 600);
    this.BGCanvas.Context.fillStyle = "rgba(0,0,0,0.2)";
    this.Canvas.Base.style.setProperty("image-rendering", "optimizeSpeed", null);
    this.Data = {
        UserBoule : new Boule(me),
        Blocs: new Array(),
        Particles: new Array(),
        Gravite: 1,
        LastBloc: 999,
        Level: 90,
        Score: 0,
        Shield: 100,
        GlobalSpeed: 5,
        StartTime: new Date().getTime(),
        Frames: 0,
        FPS: 60,
        GLS: 0,
        MaxStars:50,
        NBStars: 0,
        nbAdd: 0,
        Loops: 0      
    };
    this.Resources = {
        Images : new Array()
    };
    this.Resources.Images.push(new ImageProvider("bgo.png"));//0
    this.Resources.Images.push(new ImageProvider("bgv.png"));//1
    this.Resources.Images.push(new ImageProvider("vrh.png"));//2
    this.Resources.Images.push(new ImageProvider("vrb.png"));//3
    this.Resources.Images.push(new ImageProvider("vrd.png"));//4
    this.Resources.Images.push(new ImageProvider("vrg.png"));//5
    this.Resources.Images.push(new ImageProvider("score.png"));//6
    this.Resources.Images.push(new ImageProvider("go.png"));//7
    this.Data.UserBoule.Couleur = "#009cff";
    this.Data.UserBoule.Position.x = 300;
    this.Data.UserBoule.Position.y = 300;
    this.Data.UserBoule.Vitesse.x = -3;
    this.Data.UserBoule.Vitesse.y = -3;
    this.Data.UserBoule.Frottements = new Point(0.005, 0.005);
    this.Inputs={
        kUp:false,
        kDown:false,
        KLeft:false,
        kRight:false
    };
    this.EndGame =function (){
        me.gameOver=true;
    };
    this.DownInputs = function (event) {
        if (event.keyCode == 13) {
            restart();
        }
        if (event.keyCode == 37) {
            me.Inputs.kLeft = true;
        }
        if (event.keyCode == 38) {
            me.Inputs.kUp = true;
        }
        if (event.keyCode == 39) {
            me.Inputs.kRight = true;
        }
        if (event.keyCode == 40) {
            me.Inputs.kDown = true;
        }
    };
    this.UpInputs = function (event) {
        if (event.keyCode == 37) {
            me.Inputs.kLeft = false;
        }
        if (event.keyCode == 38) {
            me.Inputs.kUp = false;
        }
        if (event.keyCode == 39) {
            me.Inputs.kRight = false;
        }
        if (event.keyCode == 40) {
            me.Inputs.kDown = false;
        }
    };
    this.ChangeOrientation = function () {
        alert("orientation changee ");

    }

    this.BindInputs = function () {
        window.onkeydown = me.DownInputs;
        window.onkeyup = me.UpInputs;
    };
    this.DoInputs = function () {
        var force = new Point(0, 0);
        if (me.Inputs.kDown) {
            force.y ++;
        }
        if (me.Inputs.kUp) {
            force.y --;
        }
        if (me.Inputs.kLeft) {
            force.x --;
        }
        if (me.Inputs.kRight) {
            force.x ++;
        }
        me.Data.UserBoule.Pousse(force);
    };
    this.Animate = function () {
        var now = new Date().getTime() - me.Data.StartTime;
        me.Data.FPS = me.Data.Frames / now * 1000;
        me.Data.Frames = 0;
        me.Data.GLS = me.Data.Loops / now * 1000;
        me.Data.Loops = 0;
        me.Data.StartTime = new Date().getTime();
        
        me.Data.Shield += 0.01;
        if (me.Data.Shield > 100)
            me.Data.Shield = 100;
        if (me.Data.Shield < 0) {
            me.Data.Shield = 0;
            this.EndGame();
        }

        if (me.Data.FPS < 50 && me.Data.Score>100 && me.Data.Score%20==2) {
            me.Data.MaxStars -= 20;
        }
        if (me.Data.FPS > 55 && me.Data.Score%20==1) {
            me.Data.MaxStars += 10;
        }

        for (var i = 0; i < me.Data.Particles.length; i++) {
            me.Data.Particles[i].Animate();
            if (me.Data.Particles[i].Data.MustDie()) {
                if (me.Data.Particles[i].Type == "Star")
                    me.Data.NBStars--;
                me.Data.Particles.splice(i, 1);
                
            }
        }

        me.Data.nbAdd = me.Data.NBStars - me.Data.MaxStars;

        while(me.Data.NBStars<me.Data.MaxStars){
            var color = new RGBColor();
            me.Data.Particles.push(new Star(Math.random() * 1000, Math.random() * 800 - 100, -me.Data.GlobalSpeed + Math.random(), -1 + 2 * Math.random(), 0.1 + 5 * Math.random(), color));
            me.Data.NBStars++;
        }


        
        me.Data.UserBoule.Avance(me.Canvas.Context);
        for (var i = 0; i < me.Data.Blocs.length; i++) {
            if (me.Data.Blocs[i].Center.x < -100)
                me.Data.Blocs.splice(i,1);
            else 
                me.Data.Blocs[i].Animate();
        }
        me.Collisions();

    };
    this.Render = function () {
        var ctx = me.Canvas.Context;

        me.BGCanvas.Context.fillRect(0, 0, 800, 600);
        
        for (var i = 0; i < me.Data.Particles.length; i++) {
            me.Data.Particles[i].Trace(me);
        }

        ctx.drawImage(me.BGCanvas.Canvas, 0, 0);
        
        for (var i = 0; i < me.Data.Blocs.length; i++) {
            me.Data.Blocs[i].Trace(this);
        }
        me.Data.UserBoule.Trace(me);

        me.DrawScore();

    };
    this.CheckResources = function () {
        var ready = true;
        for (var i = 0 ; i < this.Resources.Images.length;i++) {
            if (!this.Resources.Images[i].Loaded) {
                ready = false;
            }
        }
        return ready;
    };
    this.Collisions = function () {
        var coin;
        for (var i = 0; i < me.Data.Blocs.length; i++) {
            var cBloc = me.Data.Blocs[i];
            var boule = this.Data.UserBoule;
            var pb = 0;
            if(boule.Position.y+boule.Rayon>cBloc.Center.y)
                pb++;
            if(boule.Position.y-boule.Rayon<cBloc.Center.y+cBloc.Size.y)
                pb++;
            if(boule.Position.x+boule.Rayon>cBloc.Center.x)
                pb++;
            if(boule.Position.x-boule.Rayon<cBloc.Center.x+cBloc.Size.x)
                pb++;

            if(pb>3)
                this.EndGame();

        }
    }
    this.CLR = function () {
        var ctx = me.Canvas.Context;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, me.Canvas.Base.width, me.Canvas.Base.height);
    }

    this.AJAX = function () {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "Score.php?val="+this.Data.Score, false);
        xhr.send("null");
        if (xhr.responseText.charAt(0) == "1") {
            var login = window.prompt("HighScore \nDonnez Votre Pseudo :");
            xhr = new XMLHttpRequest();
            xhr.open("GET", "Score.php?val=" + this.Data.Score + "&login=" + login, false);
            xhr.send(null);
        }
        me.Canvas.Context.font = "20pt Arial";
        me.Canvas.Context.fillStyle = "White";
        var texte = xhr.responseText.substring(0, xhr.responseText.length).split("\n");
        for (var i = 0 ; i < texte.length; i++)
            me.Canvas.Context.fillText(texte[i], 200, 300 + 25 * i);
        me.Canvas.Context.fillText("Press Enter to restart", 200, 490);

        me.Canvas.Context.font = "10pt Arial";
        me.Canvas.Context.fillText("© Guillaume Leclerc 2012 - Tout Droits Réservés", 10, 595);

    }
    this.GenBlocs = function () {
        if (this.Data.LastBloc < this.Data.Level)
            this.Data.LastBloc++;
        else {
            this.Data.LastBloc = 0;
            var size = Math.random() * 200+50;
            var top = (650 - size) * Math.random() - 25;
            this.Data.Blocs.push(new Bloc(900, top, 30, size , -me.Data.GlobalSpeed));
        }
    }

    this.DrawScore = function () {
        var ctx = me.Canvas.Context;
        ctx.drawImage(me.Resources.Images[6].base, 0, 0);

        var degrade = ctx.createLinearGradient(0, 3, 0, 17);
        degrade.addColorStop(0, "#0093d8");
        degrade.addColorStop(0.5, "#006290");
        degrade.addColorStop(1, "#0093d8");

        ctx.fillStyle = degrade;
        ctx.fillRect(102, 3, me.Data.Shield / 100 * 80, 14);

        ctx.fillStyle = "Black";
        ctx.font = "12pt Arial";
        ctx.fillText(this.Data.Score, 5, 16);
    }
}

var Boule = function (Game) {
    this.Parent = Game;
    this.Position = new Point(0, 0);
    this.Poussee = new Point(0, 0);
    this.Vitesse= new  Point(0, 0);
    this.Acceleration = new Point(0, 0);
    this.sGravite = new Point(0, 0.25);
    this.Frottements = new Point(0, 0);
    this.Couleur= "red";
    this.Rayon = 40;
    this.toString = function () {
        return Math.round(this.Position.x) + "-" + Math.round(this.Position.y);
    };
    this.Trace = function (Game) {
        var ctx = Game.Canvas.Context;
        var radgrad3 = ctx.createRadialGradient(this.Position.x, this.Position.y, 0, this.Position.x, this.Position.y, 45);
        radgrad3.addColorStop(0.7, 'rgba(0,181,226,0)');
        radgrad3.addColorStop(0.8, 'rgba(0,181,226,1)');
        radgrad3.addColorStop(1, 'rgba(0,201,255,0)');
        ctx.globalAlpha =0.5+ Game.Data.Shield / 200 + (0.5 - Game.Data.Shield / 200) * Math.sin(2 * Math.PI * Game.Data.Score / 50);
        ctx.fillStyle = radgrad3;
        ctx.fillRect(0, 0, 800, 600);
        ctx.globalAlpha = 1;

        ctx.save();

        ctx.translate(Math.round(this.Position.x), Math.round(this.Position.y));
        ctx.rotate(Math.PI/10*Math.sin(2*Math.PI*Game.Data.Score/50));
        ctx.translate(-this.Rayon, -this.Rayon);
        ctx.drawImage(Game.Resources.Images[1].base, 0,0);
        if (this.Poussee.y == 1) {
            ctx.drawImage(Game.Resources.Images[2].base, 0,0);
        }
        else if (this.Poussee.y ==- 1)
            ctx.drawImage(Game.Resources.Images[3].base, 0,0);
        else if (this.Poussee.x == -1)
            ctx.drawImage(Game.Resources.Images[4].base, 0,0);
        else if (this.Poussee.x == 1)
            ctx.drawImage(Game.Resources.Images[5].base, 0,0);
        ctx.restore();

    };
    this.Pousse= function(force){
        this.Poussee.x=force.x;
        this.Poussee.y= force.y;
    };
    this.Avance = function (ctx) {

        this.Acceleration.x = -this.sGravite.x*this.Parent.Data.Gravite + 1*this.Poussee.x-this.Vitesse.x*this.Frottements.x;
        this.Acceleration.y = +this.sGravite.y * this.Parent.Data.Gravite + 1 * this.Poussee.y - this.Vitesse.y * this.Frottements.y;

        this.Vitesse.x += this.Acceleration.x;
        this.Vitesse.y += this.Acceleration.y;

        this.Position.x += this.Vitesse.x;
        this.Position.y += this.Vitesse.y;

        if (this.Position.y - this.Rayon < 0 || this.Position.y + this.Rayon > 600) {
            this.Vitesse.y *= -1;
            Game.Data.Shield -= Math.abs(this.Vitesse.y);
        }
        if (this.Position.x - this.Rayon < 0 || this.Position.x + this.Rayon > 800) {
            this.Vitesse.x *= -1;
            Game.Data.Shield -= Math.abs(this.Vitesse.x);
        }
        if (this.Position.y - this.Rayon < 0) {
            this.Position.y = this.Rayon;
        }
        if (this.Position.y + this.Rayon >600) {
            this.Position.y = 600 - this.Rayon;
        }

        if (this.Position.x - this.Rayon < 0) {
            this.Position.x = this.Rayon;
        }
        if (this.Position.x + this.Rayon > 800) {
            this.Position.x = 800 - this.Rayon;
        }
    }
};

function Point(iX, iY) {
    this.x = iX;
    this.y = iY;
    this.toString = function () {
        return Math.round(this.x) + "-" + Math.round(this.y);
    };
};

function ImageProvider(iUrl) {
    var me = this;
    this.Url = iUrl;
    this.Loaded = false;
    this.base = new Image();
    this.base.onload = function () {
        me.Loaded = true;
    }
    this.base.src = iUrl;
}

function Bloc(PosX, PosY, SizeX, SizeY,iSpeed) {
    var me = this;
    this.Speed = new Point(iSpeed,0);
    this.Variation = {
        Periode: new Point (150,100),
        Amplitude: new Point(3, 5),
        Dephasage: new Point(Math.random() * 1000, Math.random() * 1000)
    };
    this.Life = 0;
    this.Center = new Point(PosX, PosY);
    this.Size = new Point(SizeX, SizeY);
    this.BGColor = "Red";
    this.BorderColor = "black";
    this.Trace = function (Game) {
        var ctx = Game.Canvas.Context;
        ctx.save();
        ctx.translate(me.Center.x, me.Center.y);
        var pattern = ctx.createPattern(Game.Resources.Images[0].base, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0,0, me.Size.x, me.Size.y);
        ctx.restore();
    }
    this.Animate = function () {
        this.Life++;
        this.Center.x += this.Speed.x + this.Variation.Amplitude.x * Math.cos(Math.PI * 2 / this.Variation.Periode.x * this.Life+this.Variation.Dephasage.x);
        this.Center.y += this.Speed.y + this.Variation.Amplitude.y * Math.cos(Math.PI * 2 / this.Variation.Periode.y * this.Life + this.Variation.Dephasage.y);
    }
}


function Particule(iX, iY) {
    var me = this;
    this.Position = new Point(iX, iY);
    this.Vitesse = new Point(0, 0);
    this.Acceleration = new Point(0, 0);
    this.Life = 0;
    this.LifeTime = 0; //Means Infinite
    this.size = 10;
    this.MustDie = function () {
        if (me.LifeTime == 0)
            return false;
        else if (me.Life > me.LifeTime ||me.Position.x<-50) {
            return true;
        }
        return false;       
    }
}

function Star(iX, iY,sX,sY,distance,color) { //partial class Particule
    var me = this;
    this.Data = new Particule(iX, iY);
    this.Type = "Star";
    this.Data.LifeTime = 1000 * distance;
    this.Data.Vitesse.x =sX/distance/5;
    this.Data.Vitesse.y = sY/distance/5;
    this.Data.size = 5 / distance;
    this.Prerendered = document.createElement("canvas");
    this.Prerendered.width = 2*this.Data.size+1;
    this.Prerendered.height = 2*this.Data.size+1;
    var ctx = this.Prerendered.getContext("2d");
    ctx.translate(Math.round(this.Data.size), Math.round(this.Data.size));
    var degrade = ctx.createRadialGradient(0, 0, 0, 0, 0, this.Data.size);
    degrade.addColorStop(0, "rgba(255,255,255,1)");
    degrade.addColorStop(0.5, "rgba(" + color.R + "," + color.G + "," + color.B + ",0)");
    ctx.beginPath();

    for (var i = 0; i < 2; i += 0.25) {
        ctx.moveTo(0, 0);
        ctx.lineTo(this.Data.size * Math.cos(i * Math.PI), this.Data.size * Math.sin(i * Math.PI));
    }
    ctx.closePath();
    ctx.strokeStyle = degrade;
    ctx.stroke();


    this.Trace = function (Game) {
        var ctx = Game.BGCanvas.Context
        ctx.globalAlpha = Math.sin(Math.PI * this.Data.Life / this.Data.LifeTime);
        ctx.drawImage(this.Prerendered, this.Data.Position.x, this.Data.Position.y);
        ctx.globalAlpha = 1;
    };
    this.Animate = function () {
        this.Data.Position.x += this.Data.Vitesse.x;
        this.Data.Position.y += this.Data.Vitesse.y;
        this.Data.Life++;
    }
}

function PRCanvas(sX,sY) {
    this.Canvas = document.createElement("canvas");
    this.Canvas.width = sX;
    this.Canvas.height = sY;
    this.Context = this.Canvas.getContext("2d");
}

function RGBColor(ir,ig,ib)
{
    this.R = ir || Math.random() * 255>>0;
    this.G = ig || Math.random() * 255>>0;
    this.B = ib || Math.random() * 255>>0;
    
}