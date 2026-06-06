// WebGL shader source strings for PointCloudRenderer

const SHADERS = {
    pointVertex: `
        attribute vec3 aPosition;
        attribute float aAlpha;
        attribute float aColorIndex;
        uniform mat4 uProjection;
        uniform mat4 uView;
        uniform float uPointSize;
        uniform float uColorMode;
        varying float vAlpha;
        varying float vColorIndex;
        varying vec3 vPosition;

        void main() {
            gl_Position = uProjection * uView * vec4(aPosition, 1.0);
            gl_PointSize = uPointSize;
            vAlpha = aAlpha;
            vColorIndex = aColorIndex;
            vPosition = aPosition;
        }
    `,

    pointFragment: `
        precision mediump float;
        varying float vAlpha;
        varying float vColorIndex;
        uniform float uColorMode;

        vec3 palette(float t, int idx) {
            vec3 a, b, c;
            if (idx == 0) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(1,0.5,0.5); }
            else if (idx == 1) { a = vec3(0.28,0.31,0.55); b = vec3(0.86,0.89,0.96); c = vec3(0.59,0.61,0.95); }
            else if (idx == 2) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(0.7,0.8,1.0); }
            else if (idx == 3) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(1.0,0.85,0.6); }
            else if (idx == 4) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(0.8,0.2,1.0); }
            else if (idx == 5) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(0.1,0.5,0.3); }
            else { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(0.7,0.6,1.0); }
            return a + b * cos(6.28318 * (c * t + vec3(0.0, 0.33, 0.67)));
        }

        void main() {
            float colorT = vColorIndex;
            int palIdx = int(uColorMode + 0.5);
            vec3 color = palette(colorT, palIdx);

            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            if (dist > 0.5) discard;
            float glow = 1.0 - dist * 2.0;
            glow = pow(glow, 1.5);

            gl_FragColor = vec4(color * 1.5, vAlpha * glow);
        }
    `,

    lineVertex: `
        attribute vec3 aPosition;
        attribute float aColorIndex;
        uniform mat4 uProjection;
        uniform mat4 uView;
        uniform float uColorMode;
        uniform float uTrailAlpha;
        varying float vColorIndex;
        varying float vAlpha;

        void main() {
            gl_Position = uProjection * uView * vec4(aPosition, 1.0);
            vColorIndex = aColorIndex;
            vAlpha = uTrailAlpha;
        }
    `,

    lineFragment: `
        precision mediump float;
        varying float vColorIndex;
        varying float vAlpha;
        uniform float uColorMode;

        vec3 palette(float t, int idx) {
            vec3 a, b, c;
            if (idx == 0) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(1,0.5,0.5); }
            else if (idx == 1) { a = vec3(0.28,0.31,0.55); b = vec3(0.86,0.89,0.96); c = vec3(0.59,0.61,0.95); }
            else if (idx == 2) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(0.7,0.8,1.0); }
            else if (idx == 3) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(1.0,0.85,0.6); }
            else if (idx == 4) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(0.8,0.2,1.0); }
            else if (idx == 5) { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(0.1,0.5,0.3); }
            else { a = vec3(0.5,0.5,0.5); b = vec3(0.5,0.5,0.5); c = vec3(0.7,0.6,1.0); }
            return a + b * cos(6.28318 * (c * t + vec3(0.0, 0.33, 0.67)));
        }

        void main() {
            int palIdx = int(uColorMode + 0.5);
            vec3 color = palette(vColorIndex, palIdx);
            gl_FragColor = vec4(color * 1.2, vAlpha);
        }
    `
};
