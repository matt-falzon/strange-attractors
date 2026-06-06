// Marching Cubes implementation for strange attractors
export class MarchingCubes {
    constructor(gridSize = 32) {
        this.gridSize = gridSize;
        this.grid = new Float32Array(gridSize * gridSize * gridSize);
    }

    // Generate a density field from point cloud
    // This is essentially a kernel density estimation or a simpler distance field
    generateField(points, bounds) {
        this.grid.fill(0);
        const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;
        const xStep = (xMax - xMin) / this.gridSize;
        const yStep = (yMax - yMin) / this.gridSize;
        const zStep = (zMax - zMin) / this.gridSize;

        for (const p of points) {
            const gx = Math.floor((p[0] - xMin) / xStep);
            const gy = Math.floor((p[1] - yMin) / yStep);
            const gz = Math.floor((p[2] - zMin) / zStep);

            if (gx >= 0 && gx < this.gridSize &&
                gy >= 0 && gy < this.gridSize &&
                gz >= 0 && gz < this.gridSize) {
                this.grid[gx + gy * this.gridSize + gz * this.gridSize * this.gridSize] += 1.0;
            }
        }
        // Apply smoothing kernel
        this.smoothField();
    }

    smoothField() {
        // Simple 3D box blur for density values
        const buffer = new Float32Array(this.grid);
        for(let x=1; x<this.gridSize-1; x++) {
            for(let y=1; y<this.gridSize-1; y++) {
                for(let z=1; z<this.gridSize-1; z++) {
                    let sum = 0;
                    for(let dx=-1; dx<=1; dx++) {
                        for(let dy=-1; dy<=1; dy++) {
                           for(let dz=-1; dz<=1; dz++) {
                               sum += buffer[(x+dx) + (y+dy)*this.gridSize + (z+dz)*this.gridSize*this.gridSize];
                           }
                        }
                    }
                    this.grid[x + y*this.gridSize + z*this.gridSize*this.gridSize] = sum / 27;
                }
            }
        }
    }
}
