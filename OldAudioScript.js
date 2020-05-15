//Increasing factor, requires a larger sound to replace the previous
//Increasing shrink, requires a larger period of time to replace the previous


var binGroup = 1 //Default at 1
var numBins = Math.round(64 / binGroup); //The number of bins/buckets in the visualization
var reverseLimit = 400; //ms between reverses
var melFactor = 4;
var bassFactor = 4;
var totalFactor = 2;
var melShrink = 0.90; //Rate the max recorded value shrinks
var bassShrink = 0.69; //Nice
var totalShrink = 0.69; //NICE


window.onload = function () {

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    let audio = [];

    const listener = arr => {
        audio = arr;
    };

    var melMax = 0;
    var bassMax = 0;
    var iMax = 8;
    var flip = true;
    var lastFlipped = Date.now();
    var intensity = 0;

    class Particle {
        constructor(x, y, radian) {
            this.x = x;
            this.y = y;
            this.radius = window.innerHeight / 32;
            this.arcRadius = 0;
            this.color = 'rgb(0,128,128)';
            this.radians = radian;
            this.velocity = 0.01;

            this.update = (iMax, intensity) => {
                const lastPoint = { x: this.x, y: this.y };
                this.arcRadius = window.innerHeight / 512 + Math.round((7 * this.arcRadius + iMax * window.innerHeight / 128) / 8);
                this.velocity = flip ? 0.01 + Math.sqrt(intensity) / 48 : -(0.01 + Math.sqrt(intensity) / 48);
                this.radians += this.velocity;
                this.x = x + this.arcRadius * Math.cos(this.radians);
                this.y = y + this.arcRadius * Math.sin(this.radians);
                this.draw(lastPoint);
            };
            this.draw = lastPoint => {
                context.beginPath();
                context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                context.fillStyle = this.color;
                context.fill();
                context.strokeStyle = this.color;
                context.lineWidth = this.radius
                context.moveTo(lastPoint.x, lastPoint.y);
                context.lineTo(this.x, this.y);
                context.stroke();
                context.closePath();
            };
        }
    }

    var particle1 = new Particle(window.innerWidth / 2, window.innerHeight / 2, Math.PI * 0.5);
    var particle2 = new Particle(window.innerWidth / 2, window.innerHeight / 2, Math.PI * 1.5);

    const draw = _ => {
        //There are a total of 128 entries in audio, 0-63 are left, 64-127 are right
        // context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        context.fillStyle = 'rgb(240,244,244,0.05)';
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        getIMax();
        if (melMax < 0.00000001 && intensity < 0.00000001) {
            //If melMax and intensity is practically 0;
            iMax = 42;
        }
        particle1.update(iMax, intensity);
        particle2.update(iMax, intensity);

        window.requestAnimationFrame(draw);
    }

    const getIMax = _ => {
        var currIntensity = 0;
        var bassIntensity = 0;

        for (var i = 0; i < audio.length / 2; ++i) {

            var currTotal = audio[i] + audio[i + audio.length / 2];
            if (i >= numBins / 3 && currTotal >= melMax * this.melFactor) {
                iMax = i;
                melMax = currTotal;
            } else if (i < numBins / 4) {
                bassIntensity += currTotal;
            }
            currIntensity += currTotal;
        }
        if (this.Date.now() - lastFlipped >= this.reverseLimit
            && bassIntensity > bassMax * 1.3
            && bassIntensity > numBins / 32) {
            if (currIntensity > intensity * this.totalFactor) {
                flip = !flip;
                lastFlipped = this.Date.now();
                bassMax = bassIntensity;
                intensity = currIntensity;
            } else if (currIntensity >= intensity) {
                intensity = currIntensity;
            }
        } else if (bassIntensity >= bassMax && bassIntensity <= bassMax * 1.3) {
            bassMax = bassIntensity;
        }

        melMax *= this.melShrink;
        bassMax *= this.bassShrink;
        if (currIntensity < intensity) {
            intensity *= this.totalShrink;
        }
        iMax = Math.floor(iMax / this.binGroup);
    }

    window.wallpaperRegisterAudioListener(listener);
    draw();
};