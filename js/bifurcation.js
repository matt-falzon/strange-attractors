// Bifurcation Diagram Generator
// Shows how attractor behavior changes as one parameter varies

class BifurcationDiagram {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.visible = false;
        this.generating = false;
        this.progress = 0;
        this.data = null;
    }

    // Generate bifurcation diagram for a given attractor and parameter
    generate(attractorKey, paramName, paramRange, options = {}) {
        const {
            burnIn = 1000,
            plotPoints = 500,
            steps = 400,
            h = 0.01,
            dimension = 'x' // which dimension to plot
        } = options;

        const attractor = ATTRACTORS[attractorKey];
        const [min, max] = paramRange;
        const step = (max - min) / steps;

        this.data = {
            key: attractorKey,
            param: paramName,
            range: paramRange,
            steps: steps,
            dimension: dimension,
            points: []
        };

        this.generating = true;
        this.progress = 0;

        // Generate asynchronously to not block UI
        let currentStep = 0;
        const batchSize = 10;

        const generateBatch = () => {
            const end = Math.min(currentStep + batchSize, steps);

            for (let i = currentStep; i < end; i++) {
                const paramValue = min + i * step;
                const params = { ...attractor.params, [paramName]: paramValue };

                // Start from attractor's initial conditions
                let [x, y, z] = [...attractor.init];

                // Burn-in phase - discard these points
                for (let j = 0; j < burnIn; j++) {
                    const newPos = attractor.step(x, y, z, h, params);
                    x = newPos[0];
                    y = newPos[1];
                    z = newPos[2];

                    // Check for divergence
                    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
                        break;
                    }
                }

                // Plot phase - collect these points
                const plotData = [];
                for (let j = 0; j < plotPoints; j++) {
                    const newPos = attractor.step(x, y, z, h, params);
                    x = newPos[0];
                    y = newPos[1];
                    z = newPos[2];

                    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
                        break;
                    }

                    const dimIndex = dimension === 'x' ? 0 : dimension === 'y' ? 1 : 2;
                    plotData.push({
                        param: paramValue,
                        value: [x, y, z][dimIndex]
                    });
                }

                this.data.points.push({
                    step: i,
                    param: paramValue,
                    values: plotData
                });
            }

            currentStep = end;
            this.progress = currentStep / steps;

            // Render progress
            if (this.visible) {
                this.render();
            }

            if (currentStep < steps) {
                requestAnimationFrame(generateBatch);
            } else {
                this.generating = false;
            }
        };

        requestAnimationFrame(generateBatch);
        return this.data;
    }

    render() {
        if (!this.data || !this.visible) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Find data bounds
        let minVal = Infinity;
        let maxVal = -Infinity;

        this.data.points.forEach(point => {
            point.values.forEach(v => {
                if (v.value < minVal) minVal = v.value;
                if (v.value > maxVal) maxVal = v.value;
            });
        });

        // Add padding
        const range = maxVal - minVal || 1;
        minVal -= range * 0.05;
        maxVal += range * 0.05;

        // Draw points
        ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';

        this.data.points.forEach(point => {
            const x = (point.param - this.data.range[0]) /
                     (this.data.range[1] - this.data.range[0]) * w;

            point.values.forEach(v => {
                const y = h - (v.value - minVal) / (maxVal - minVal) * h;
                ctx.fillRect(x, y, 1, 1);
            });
        });

        // Draw axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.fillText(this.data.param, w / 2 - 10, h - 5);

        // Draw progress bar
        if (this.generating) {
            ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
            ctx.fillRect(0, 0, w * this.progress, 2);
        }
    }

    toggle() {
        this.visible = !this.visible;
        return this.visible;
    }
}
