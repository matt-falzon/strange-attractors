// Strange Attractors - Simulation Engine

class PoincareSection {
    constructor() {
        this.points = [];
        this.lastSign = 0;
        this.maxPoints = 5000;
    }

    reset() {
        this.points = [];
        this.lastSign = 0;
    }

    checkIntersection(prevZ, currZ, x, y) {
        if (this.lastSign === 0) {
            this.lastSign = Math.sign(currZ);
            return;
        }

        const currSign = Math.sign(currZ);
        if (currSign !== this.lastSign && currSign >= 0) {
            const t = prevZ / (prevZ - currZ);
            this.points.push([
                x + t * (x - x),
                y + t * (y - y),
                0
            ]);
            if (this.points.length > this.maxPoints) {
                this.points.shift();
            }
        }
        this.lastSign = currSign;
    }
}

class AttractorSimulation {
    constructor(attractorKey) {
        this.key = attractorKey;
        this.attractor = ATTRACTORS[attractorKey];

        if (!this.attractor) {
            console.error(`Attractor "${attractorKey}" not found in ATTRACTORS`);
            this.points = [];
            this.position = [0, 0, 0];
            this.params = {};
            return;
        }

        this.params = { ...this.attractor.params };
        this.position = [...this.attractor.init];
        this.points = [];
        this.maxPoints = 20000;
        this.h = 0.005;
        this.burnIn = 0;

        // Time reversal buffer
        this.trajectoryHistory = [];
        this.maxHistory = 300; // ~5 seconds at 60fps, 10 steps/frame
        this.reverseIndex = -1;
        this.isReversing = false;
    }

    step() {
        if (!this.attractor || !this.attractor.step) return;

        const oldPos = [...this.position];
        const newPos = this.attractor.step(
            this.position[0], this.position[1], this.position[2],
            this.h, this.params
        );

        if (!newPos || !isFinite(newPos[0]) || !isFinite(newPos[1]) || !isFinite(newPos[2])) {
            this.position = [...this.attractor.init];
            return;
        }

        this.position = newPos;
        this.points.push([...this.position]);
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }

        // Record trajectory for time reversal
        if (!this.isReversing) {
            this.trajectoryHistory.push(oldPos);
            if (this.trajectoryHistory.length > this.maxHistory) {
                this.trajectoryHistory.shift();
            }
        }
    }

    stepReverse() {
        if (this.trajectoryHistory.length === 0) return false;

        this.isReversing = true;
        const prevPos = this.trajectoryHistory.pop();
        if (!prevPos) {
            this.isReversing = false;
            return false;
        }

        this.position = prevPos;

        // Remove newest point from trail, insert historical position at end
        // This makes the trail "unwind" as we trace backwards
        if (this.points.length > 1) {
            this.points.pop();
        }
        this.points.push([...this.position]);

        if (this.trajectoryHistory.length === 0) {
            this.isReversing = false;
        }

        return true;
    }

    getVelocity(x, y, z) {
        if (!this.attractor || !this.attractor.velocity) {
            return {dx: 0, dy: 0, dz: 0};
        }
        return this.attractor.velocity(x, y, z, this.params);
    }

    reset() {
        this.position = [...this.attractor.init];
        this.points = [];
        this.burnIn = 0;
        this.lyapunovSum = 0;
        this.lyapunovCount = 0;
        this.perturbation = [1e-10, 1e-10, 1e-10];
        this.trajectoryHistory = [];
        this.reverseIndex = -1;
        this.isReversing = false;
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        this.reset();
    }

    runBurnIn(iterations = 5000) {
        this.reset();
        for (let i = 0; i < iterations; i++) {
            this.step();
        }
        this.burnIn = iterations;
    }

    stepLyapunov() {
        this.step();

        const perturbedPos = [
            this.position[0] + this.perturbation[0],
            this.position[1] + this.perturbation[1],
            this.position[2] + this.perturbation[2]
        ];

        const newPerturbedPos = this.attractor.step(
            perturbedPos[0], perturbedPos[1], perturbedPos[2],
            this.h, this.params
        );

        if (!isFinite(newPerturbedPos[0]) || !isFinite(newPerturbedPos[1]) || !isFinite(newPerturbedPos[2])) {
            this.perturbation = [1e-10, 1e-10, 1e-10];
            return;
        }

        this.perturbation = [
            newPerturbedPos[0] - this.position[0],
            newPerturbedPos[1] - this.position[1],
            newPerturbedPos[2] - this.position[2]
        ];

        const divergence = Math.sqrt(
            this.perturbation[0] ** 2 +
            this.perturbation[1] ** 2 +
            this.perturbation[2] ** 2
        );

        const targetDist = 1e-10;

        if (divergence > 1e-15 && divergence < 1e5) {
            this.lyapunovSum += Math.log(divergence / targetDist);
            this.lyapunovCount++;

            const scale = targetDist / divergence;
            this.perturbation[0] *= scale;
            this.perturbation[1] *= scale;
            this.perturbation[2] *= scale;
        }
    }

    getMaxLyapunovExponent() {
        if (this.lyapunovCount === 0) return 0;
        const totalTime = this.lyapunovCount * this.h;
        return this.lyapunovSum / totalTime;
    }
}
