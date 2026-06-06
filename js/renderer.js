// WebGL 3D Point Cloud + Trail Renderer with Orbit Controls
// Shader source is in shaders.js (SHADERS constant)

class PointCloudRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
        this.points = [];
        this.pointSize = 2.0;

        if (!this.gl) {
            console.error('WebGL context not available');
        }
        this.camera = { theta: 0.5, phi: 1.0, radius: 50, target: [0, 0, 0] };
        this.symmetryOrder = 0;
        this.showVelocity = false;
        this.dragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this.keys = {};
        this.bounds = [-30, 30, -30, 30, 0, 60];
        this.autoRotate = true;
        this.autoRotateSpeed = 0.003;
        this.colorMode = 0;
        this.showTrails = false;
        this.trailAlpha = 0.15;

        this.setupShaders();
        this.setupBuffers();
        this.setupEvents();
        this.resize();
    }

    setupShaders() {
        const gl = this.gl;

        const compileShader = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(s));
            }
            return s;
        };

        const linkProgram = (vs, fs) => {
            const p = gl.createProgram();
            gl.attachShader(p, vs);
            gl.attachShader(p, fs);
            gl.linkProgram(p);
            if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(p));
            }
            return p;
        };

        this.pointProgram = linkProgram(
            compileShader(gl.VERTEX_SHADER, SHADERS.pointVertex),
            compileShader(gl.FRAGMENT_SHADER, SHADERS.pointFragment)
        );
        gl.useProgram(this.pointProgram);

        this.pointLocations = {
            aPosition:   gl.getAttribLocation(this.pointProgram, 'aPosition'),
            aAlpha:      gl.getAttribLocation(this.pointProgram, 'aAlpha'),
            aColorIndex: gl.getAttribLocation(this.pointProgram, 'aColorIndex'),
            uProjection: gl.getUniformLocation(this.pointProgram, 'uProjection'),
            uView:       gl.getUniformLocation(this.pointProgram, 'uView'),
            uPointSize:  gl.getUniformLocation(this.pointProgram, 'uPointSize'),
            uColorMode:  gl.getUniformLocation(this.pointProgram, 'uColorMode'),
        };

        this.lineProgram = linkProgram(
            compileShader(gl.VERTEX_SHADER, SHADERS.lineVertex),
            compileShader(gl.FRAGMENT_SHADER, SHADERS.lineFragment)
        );

        this.lineLocations = {
            aPosition:   gl.getAttribLocation(this.lineProgram, 'aPosition'),
            aColorIndex: gl.getAttribLocation(this.lineProgram, 'aColorIndex'),
            uProjection: gl.getUniformLocation(this.lineProgram, 'uProjection'),
            uView:       gl.getUniformLocation(this.lineProgram, 'uView'),
            uColorMode:  gl.getUniformLocation(this.lineProgram, 'uColorMode'),
            uTrailAlpha: gl.getUniformLocation(this.lineProgram, 'uTrailAlpha'),
        };
    }

    setupBuffers() {
        this.positionBuffer  = this.gl.createBuffer();
        this.alphaBuffer     = this.gl.createBuffer();
        this.colorIndexBuffer = this.gl.createBuffer();
        this.trailBuffer     = this.gl.createBuffer();
        this.trailColorBuffer = this.gl.createBuffer();

        this.gl.clearColor(0.04, 0.04, 0.06, 1.0);
    }

    setupEvents() {
        const c = this.canvas;
        c.addEventListener('mousedown', (e) => {
            this.dragging = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            this.autoRotate = false;
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.dragging) return;
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;
            this.camera.theta -= dx * 0.005;
            this.camera.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.camera.phi + dy * 0.005));
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });
        window.addEventListener('mouseup', () => { this.dragging = false; });
        c.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.radius = Math.max(5, Math.min(200, this.camera.radius + e.deltaY * 0.05));
        }, { passive: false });
        c.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.dragging = true;
                this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                this.autoRotate = false;
            }
        });
        c.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && this.dragging) {
                const dx = e.touches[0].clientX - this.lastMouse.x;
                const dy = e.touches[0].clientY - this.lastMouse.y;
                this.camera.theta -= dx * 0.005;
                this.camera.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.camera.phi + dy * 0.005));
                this.lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }, { passive: false });
        c.addEventListener('touchend', () => { this.dragging = false; });
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
        window.addEventListener('keyup',   (e) => { this.keys[e.key.toLowerCase()] = false; });
    }

    updateCameraTarget() {
        const speed = 0.5;
        const t = this.camera.theta;
        const fwdX = Math.cos(t), fwdZ = Math.sin(t);
        const rightX = -Math.sin(t), rightZ = Math.cos(t);

        if (this.keys['w']) { this.camera.target[0] += fwdX * speed;   this.camera.target[2] += fwdZ * speed; }
        if (this.keys['s']) { this.camera.target[0] -= fwdX * speed;   this.camera.target[2] -= fwdZ * speed; }
        if (this.keys['a']) { this.camera.target[0] += rightX * speed; this.camera.target[2] += rightZ * speed; }
        if (this.keys['d']) { this.camera.target[0] -= rightX * speed; this.camera.target[2] -= rightZ * speed; }
        if (this.keys['q']) { this.camera.target[1] += speed; }
        if (this.keys['e']) { this.camera.target[1] -= speed; }
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width  = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ]);
    }

    lookAt(eye, center, up) {
        const zx = eye[0]-center[0], zy = eye[1]-center[1], zz = eye[2]-center[2];
        let len = 1 / Math.sqrt(zx*zx + zy*zy + zz*zz);
        const z = [zx*len, zy*len, zz*len];
        const xx = up[1]*z[2]-up[2]*z[1], xy = up[2]*z[0]-up[0]*z[2], xz = up[0]*z[1]-up[1]*z[0];
        len = 1 / Math.sqrt(xx*xx + xy*xy + xz*xz);
        const x = [xx*len, xy*len, xz*len];
        const y = [z[1]*x[2]-z[2]*x[1], z[2]*x[0]-z[0]*x[2], z[0]*x[1]-z[1]*x[0]];
        return new Float32Array([
            x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
            -(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),
            -(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),
            -(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]), 1
        ]);
    }

    getViewMatrix() {
        const r = this.camera.radius, t = this.camera.theta, p = this.camera.phi;
        const target = this.camera.target;
        const eye = [
            target[0] + r*Math.sin(p)*Math.cos(t),
            target[1] + r*Math.cos(p),
            target[2] + r*Math.sin(p)*Math.sin(t)
        ];
        return this.lookAt(eye, target, [0, 1, 0]);
    }

    updatePoints(points) {
        this.points = points;
    }

    render(phi, theta) {
        const gl = this.gl;
        if (!this.points || this.points.length === 0) return;
        const n = this.points.length;

        this.updateCameraTarget();

        if (this.autoRotate) {
            this.camera.theta += this.autoRotateSpeed;
        }

        const aspect = this.canvas.width / this.canvas.height;
        const proj = this.perspective(Math.PI / 4, aspect, 0.1, 1000);
        const view = this.getViewMatrix();

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);

        if (this.showTrails && n > 1) {
            const trailCount = Math.min(n - 1, 8000);
            const trailPositions = new Float32Array(trailCount * 6);
            const trailColors    = new Float32Array(trailCount * 2);

            for (let i = 0; i < trailCount; i++) {
                const p1 = this.points[i], p2 = this.points[i + 1];
                const idx = i * 6;
                trailPositions[idx]   = p1[0]; trailPositions[idx+1] = p1[1]; trailPositions[idx+2] = p1[2];
                trailPositions[idx+3] = p2[0]; trailPositions[idx+4] = p2[1]; trailPositions[idx+5] = p2[2];
                trailColors[i*2]   = i / n;
                trailColors[i*2+1] = (i+1) / n;
            }

            gl.useProgram(this.lineProgram);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.trailBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, trailPositions, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.lineLocations.aPosition);
            gl.vertexAttribPointer(this.lineLocations.aPosition, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.trailColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, trailColors, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.lineLocations.aColorIndex);
            gl.vertexAttribPointer(this.lineLocations.aColorIndex, 1, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix4fv(this.lineLocations.uProjection, false, proj);
            gl.uniformMatrix4fv(this.lineLocations.uView, false, view);
            gl.uniform1f(this.lineLocations.uColorMode, this.colorMode);
            gl.uniform1f(this.lineLocations.uTrailAlpha, this.trailAlpha);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.drawArrays(gl.LINES, 0, trailCount * 2);
        }

        const positions    = new Float32Array(n * 3);
        const alphas       = new Float32Array(n);
        const colorIndices = new Float32Array(n);

        for (let i = 0; i < n; i++) {
            const p = this.points[i];
            positions[i*3] = p[0]; positions[i*3+1] = p[1]; positions[i*3+2] = p[2];

            if (this.showVelocity && i > 0) {
                const prev = this.points[i - 1];
                const vel = Math.sqrt((p[0]-prev[0])**2 + (p[1]-prev[1])**2 + (p[2]-prev[2])**2);
                const normVel = Math.min(vel / 0.5, 1.0);
                alphas[i] = 0.4 + 0.6 * normVel;
                colorIndices[i] = normVel;
            } else {
                alphas[i] = 0.6 + 0.4 * (i / n);
                colorIndices[i] = i / n;
            }
        }

        let finalPositions = positions;
        let finalCount = n;
        if (this.symmetryOrder > 0) {
            const symPoints = this.applySymmetry(positions, n);
            finalPositions = new Float32Array(symPoints);
            finalCount = symPoints.length / 3;
        }

        gl.useProgram(this.pointProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, finalPositions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.pointLocations.aPosition);
        gl.vertexAttribPointer(this.pointLocations.aPosition, 3, gl.FLOAT, false, 0, 0);

        const symAlphas = new Float32Array(finalCount);
        const symColors = new Float32Array(finalCount);
        for (let i = 0; i < finalCount; i++) {
            symAlphas[i] = alphas[i % n];
            symColors[i] = colorIndices[i % n];
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, symAlphas, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.pointLocations.aAlpha);
        gl.vertexAttribPointer(this.pointLocations.aAlpha, 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorIndexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, symColors, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.pointLocations.aColorIndex);
        gl.vertexAttribPointer(this.pointLocations.aColorIndex, 1, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.pointLocations.uProjection, false, proj);
        gl.uniformMatrix4fv(this.pointLocations.uView, false, view);
        gl.uniform1f(this.pointLocations.uPointSize, this.pointSize * (this.canvas.height / 600));
        gl.uniform1f(this.pointLocations.uColorMode, this.colorMode);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.drawArrays(gl.POINTS, 0, finalCount);
    }

    setColorPalette(index)  { this.colorMode = index; }
    setSymmetryMode(order)  { this.symmetryOrder = order; }
    toggleVelocityColor()   { this.showVelocity = !this.showVelocity; }

    renderVectorField(simulation, phi, theta) {
        const nGrid = 15;
        const vectors = [];
        const n = [
            Math.sin(theta) * Math.cos(phi),
            Math.sin(theta) * Math.sin(phi),
            Math.cos(theta)
        ];

        let tangent1 = [0, 1, 0];
        if (Math.abs(n[1]) > 0.9) tangent1 = [1, 0, 0];
        const tangent2 = [
            n[1]*tangent1[2] - n[2]*tangent1[1],
            n[2]*tangent1[0] - n[0]*tangent1[2],
            n[0]*tangent1[1] - n[1]*tangent1[0]
        ];
        tangent1 = [
            n[1]*tangent2[2] - n[2]*tangent2[1],
            n[2]*tangent2[0] - n[0]*tangent2[2],
            n[0]*tangent2[1] - n[1]*tangent2[0]
        ];

        for (let i = -nGrid; i <= nGrid; i++) {
            for (let j = -nGrid; j <= nGrid; j++) {
                const u = i * 2, v = j * 2;
                const pos = [
                    u*tangent1[0] + v*tangent2[0],
                    u*tangent1[1] + v*tangent2[1],
                    u*tangent1[2] + v*tangent2[2]
                ];
                const vel = simulation.getVelocity(pos[0], pos[1], pos[2]);
                const dot = vel[0]*n[0] + vel[1]*n[1] + vel[2]*n[2];
                const projVel = [vel[0]-dot*n[0], vel[1]-dot*n[1], vel[2]-dot*n[2]];
                const mag = Math.sqrt(projVel[0]**2 + projVel[1]**2 + projVel[2]**2);
                if (mag > 0.001) {
                    vectors.push(pos[0], pos[1], pos[2]);
                    vectors.push(pos[0]+projVel[0]/mag*1.5, pos[1]+projVel[1]/mag*1.5, pos[2]+projVel[2]/mag*1.5);
                }
            }
        }
        console.log(`Generated ${vectors.length / 6} vectors for field`);
    }

    applySymmetry(positions, n) {
        if (this.symmetryOrder === 0) return positions;
        const result = Array.from(positions);
        const order = this.symmetryOrder;
        const angle = (2 * Math.PI) / order;
        for (let k = 1; k < order; k++) {
            const cosA = Math.cos(k * angle);
            const sinA = Math.sin(k * angle);
            for (let i = 0; i < n; i++) {
                const x = positions[i*3], y = positions[i*3+1], z = positions[i*3+2];
                result.push(x*cosA - y*sinA, x*sinA + y*cosA, z);
            }
        }
        return result;
    }

    setBounds(bounds) {
        this.bounds = bounds;
        const maxRange = Math.max(bounds[1]-bounds[0], bounds[3]-bounds[2], bounds[5]-bounds[4]);
        this.camera.radius = maxRange * 0.7;
    }

    resetCamera() {
        this.camera.target = [0, 0, 0];
        this.camera.theta  = 0.5;
        this.camera.phi    = 1.0;
        this.camera.radius = 50;
    }
}
