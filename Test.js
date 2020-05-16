//Self-Executing Anonymous Function for closure
(function() {
    const binGroup = 1 //Default at 1
    const numBins = Math.round(64 / binGroup); //The number of bins/buckets in the visualization
    const reverseLimit = 400; //ms between reverses
    const melFactor = 4;
    const bassFactor = 4;
    const totalFactor = 2;
    const melShrink = 0.69; //nice
    const bassShrink = 0.69; //Nice
    const totalShrink = 0.69; //NICE

    const colors = ["#C43957", "#FF96AD", "#FF4A71", "#BF576E", "#CC3B5B"];
    var length = 16;
    var numParticles = 2;

    var melMax = 0;
    var bassMax = 0;
    var iMax = 8;
    var flip = true;
    var lastFlipped = Date.now();
    var intensity = 0;

    let audio = [];
    const listener = arr => {
        audio = arr;
    };

    window.wallpaperPropertyListener = {
        applyUserProperties: function (properties) {
            if (properties.background_image) document.body.style.backgroundImage = `url("file:///${properties.background_image.value}")`;
            if (properties.repeat_background) document.body.style.backgroundRepeat = properties.repeat_background.value ? "repeat" : "no-repeat";
            if (properties.background_image_size) document.body.style.backgroundSize = properties.background_image_size.value;
            if (properties.background_color) document.body.style.backgroundColor = getRGB(properties.background_color.value);

            if (properties.center_image) document.getElementById("center").src = `file:///${properties.center_image.value}`;

            if (properties.trail_count) numParticles = properties.trail_count.value;

            if (properties.trail_color_1) colors[0] = getHex(properties.trail_color_1.value);
            if (properties.trail_color_2) colors[1] = getHex(properties.trail_color_2.value);
            if (properties.trail_color_3) colors[2] = getHex(properties.trail_color_3.value);
            if (properties.trail_color_4) colors[3] = getHex(properties.trail_color_4.value);
            if (properties.trail_color_5) colors[4] = getHex(properties.trail_color_5.value);

            //Removes the current canvas and then redraws with new parameters
            var node = document.getElementById("canvas");
            node.removeChild(node.firstChild);
            drawCanvas();
        }
    }

    // Code built with the help of https://tympanus.net/codrops/2019/09/24/crafting-stylised-mouse-trails-with-ogl/
    // Code required to draw
    window.onload = drawCanvas();

    async function drawCanvas() {
        let {
            Polyline,
            Renderer,
            Transform,
            Geometry,
            Program,
            Mesh,
            Vec3,
            Vec2,
            Color
        } = await import("https://cdn.jsdelivr.net/npm/ogl@0.0.32/dist/ogl.mjs")


        //By help, I mean mostly this part that I don't completely understand, something something vector calculus
        const vertex = `
                attribute vec3 position;
    attribute vec3 next;
    attribute vec3 prev;
    attribute vec2 uv;
    attribute float side;

    uniform vec2 uResolution;
    uniform float uDPR;
    uniform float uThickness;

    vec4 getPosition() {
        vec2 aspect = vec2(uResolution.x / uResolution.y, 1);
        vec2 nextScreen = next.xy * aspect;
        vec2 prevScreen = prev.xy * aspect;

        vec2 tangent = normalize(nextScreen - prevScreen);
        vec2 normal = vec2(-tangent.y, tangent.x);
        normal /= aspect;
        normal *= 1.0 - pow(abs(uv.y - 0.5) * 2.0, 2.0);

        float pixelWidth = 1.0 / (uResolution.y / uDPR);
        normal *= pixelWidth * uThickness;

        // When the points are on top of each other, shrink the line to avoid artifacts.
        float dist = length(nextScreen - prevScreen);
        normal *= smoothstep(0.0, 0.02, dist);

        vec4 current = vec4(position, 1);
        current.xy -= normal * side;
        return current;
    }

    void main() {
        gl_Position = getPosition();
    }
`;

        {
            const renderer = new Renderer({
                dpr: 2, transparent: true, alpha: true,
                premultiplyAlpha: false
            });
            const gl = renderer.gl;
            document.getElementById("canvas").appendChild(gl.canvas);

            const scene = new Transform();

            // Just a helper function to make the code neater
            function random(a, b) {
                const alpha = Math.random();
                return a * (1.0 - alpha) + b * alpha;
            }

            // We're going to make a number of different coloured lines for fun.

            // Call initial resize after creating the polylines

            class Particle {
                constructor(x, y, radian, colors) {
                    this.x = x;
                    this.y = y;
                    this.arcRadius = window.innerHeight / 256;
                    this.radians = radian;
                    this.velocity = 0.05;
                    this.particle = new Vec3();
                    this.tmp = new Vec3();
                    this.lines = [];
                    this.colors = colors;

                    this.update = (iMax, intensity) => {
                        this.arcRadius = window.innerHeight / 256 + Math.round((7 * this.arcRadius + iMax * window.innerHeight / 128) / 8);
                        this.velocity = flip ? 0.01 + Math.sqrt(intensity) / 48 : -(0.01 + Math.sqrt(intensity) / 48);
                        this.radians += this.velocity;
                        this.x = x + this.arcRadius * Math.cos(this.radians);
                        this.y = y + this.arcRadius * Math.sin(this.radians);
                        this.particle.set(
                            (this.x / gl.renderer.width) * 2 - 1,
                            (this.y / gl.renderer.height) * -2 + 1,
                            0
                        );
                        this.draw();
                    };
                    this.draw = _ => {
                        this.lines.forEach(line => {
                            // Update polyline input points
                            for (let i = line.points.length - 1; i >= 0; i--) {
                                if (!i) {
                                    // For the first point, spring ease it to the mouse position
                                    this.tmp
                                        .copy(this.particle)
                                        .add(line.currOffset)
                                        .sub(line.points[i])
                                        .multiply(line.spring);
                                    line.currVelocity.add(this.tmp).multiply(line.friction);
                                    line.points[i].add(line.currVelocity);
                                } else {
                                    // The rest of the points ease to the point in front of them, making a line
                                    line.points[i].lerp(line.points[i - 1], 0.9);
                                }
                            }
                            line.polyline.updateGeometry();
                        });
                    };

                    this.initLines = (springs, frictions) => {
                        //Shuffle the springs and frictions
                        shuffleArray(springs);
                        shuffleArray(frictions);
                        //Init a line for each color
                        this.colors.forEach(
                            (color, i) => {
                                // Store a few values for each lines' randomised spring movement
                                const line = {
                                    spring: springs[i],
                                    friction: frictions[i],
                                    currVelocity: new Vec3(),
                                    currOffset: new Vec3(random(0, 0.08) * 0.005, random(0, 0.08) * 0.005, 0)
                                };

                                // Create an array of Vec3s (eg [[0, 0, 0], ...])
                                const points = (line.points = []);
                                for (let i = 0; i < length; i++) points.push(new Vec3());

                                line.polyline = new Polyline(gl, {
                                    points,
                                    vertex,
                                    uniforms: {
                                        uColor: { value: new Color(color) },
                                        uThickness: { value: random(window.innerHeight / 30, window.innerHeight / 20) }
                                    }
                                });

                                line.polyline.mesh.setParent(scene);

                                this.lines.push(line);
                            }
                        );
                    }

                    this.resizeLine = _ => {
                        renderer.setSize(window.innerWidth, window.innerHeight);

                        // We call resize on the polylines to update their resolution uniforms
                        this.lines.forEach(line => line.polyline.resize());
                    }
                }
            }

            //Init everything
            //Init a bunch of random springs and frictions to be shared with the
            const springs = [];
            const frictions = [];
            for (var i = 0; i < colors.length; i++) {
                springs.push(random(0.05, 0.08));
                frictions.push(random(0.8, 0.95));
            }

            const particles = [];
            const radIncrement = 2 / numParticles;
            for (var i = 0; i < numParticles; i++) {
                var newParticle = new Particle(window.innerWidth / 2, window.innerHeight / 2, Math.PI * i * radIncrement, colors);
                newParticle.initLines(springs, frictions);
                newParticle.resizeLine();
                window.addEventListener("resize", newParticle.resizeLine(), false);
                particles.push(newParticle);
            }

            requestAnimationFrame(updateLines);
            function updateLines(t) {
                requestAnimationFrame(updateLines);

                getIMax();

                if (melMax < 0.00000001 && intensity < 0.00000001) {
                    //If melMax and intensity is practically 0;
                    iMax = 0;
                }

                particles.forEach(particle => {
                    particle.update(iMax, intensity);
                })
                renderer.render({ scene });
                // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            }
        }
        window.wallpaperRegisterAudioListener(listener);

        //Code to determine the melody and when to flip
        const getIMax = _ => {
            var currIntensity = 0;
            var bassIntensity = 0;

            for (var i = 0; i < audio.length / 2; ++i) {

                var currTotal = audio[i] + audio[i + audio.length / 2];
                if (i >= numBins / 3 && currTotal >= melMax * melFactor) {
                    iMax = i;
                    melMax = currTotal;
                } else if (i < numBins / 4) {
                    bassIntensity += currTotal;
                }
                currIntensity += currTotal;
            }
            if (this.Date.now() - lastFlipped >= reverseLimit
                && bassIntensity > bassMax * 1.3
                && bassIntensity > numBins / 32) {
                if (currIntensity > intensity * totalFactor) {
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

            melMax *= melShrink;
            bassMax *= bassShrink;
            if (currIntensity < intensity) {
                intensity *= totalShrink;
            }
            iMax = Math.floor(iMax / binGroup);
        }
    }



    //Help shuffle the array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    //Converts property to an rgb value
    function getRGB(color) {
        let c = color.split(" "),
            r = Math.floor(c[0] * 255),
            g = Math.floor(c[1] * 255),
            b = Math.floor(c[2] * 255);
        return `rgb(${r}, ${g}, ${b})`
    }

    function getHex(color) {
        let c = color.split(" "),
            r = Math.floor(c[0] * 255),
            g = Math.floor(c[1] * 255),
            b = Math.floor(c[2] * 255);
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
})();