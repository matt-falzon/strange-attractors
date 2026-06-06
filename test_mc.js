import { MarchingCubes } from './js/marching-cubes.js';

const mc = new MarchingCubes(16);
const bounds = [-10, 10, -10, 10, -10, 10];
const points = [[0,0,0], [1,1,1], [0.5, 0.5, 0.5]];
mc.generateField(points, bounds);

console.log("Field generated. Grid size:", mc.grid.length);
let sum = 0;
for(let i=0; i<mc.grid.length; i++) sum += mc.grid[i];
console.log("Sum of density:", sum);
