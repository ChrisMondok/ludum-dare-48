declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

const NOISE = new SimplexNoise('floor');

addEventListener('load', () => {
  const canvas = document.querySelector('canvas')!;

  const level = new Level(canvas);

  function main() {
    level.tick();
    level.draw();
    requestAnimationFrame(main);
  }

  requestAnimationFrame(main);
});


function getCaveGeometry(out: CaveGeometry, xStart: number, xEnd: number): void {
  for(let i = 0; i < xEnd - xStart; i++) {
    const x = i + xStart;
    const ceiling = out.ceiling[i] = 100 * NOISE.noise2D(x / 100, 0) + 100;
    out.floor[i] = ceiling + 300 + 100  * NOISE.noise2D(x / 100, 1);
  }
}

interface CaveGeometry {
  ceiling: number[];
  floor: number[];
}

class Level {
  readonly cave: CaveGeometry = {ceiling: [], floor: []};
  readonly ctx = this.canvas.getContext('2d')!;

  constructor(readonly canvas: HTMLCanvasElement) {

  }

  tick() {
    getCaveGeometry(this.cave, 0, this.canvas.width);
  }

  draw() {
    const {width, height} = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.drawCaveWalls();
  }

  private drawCaveWalls() {
    const {width, height} = this.canvas;
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    for(let x = 0; x < width; x++) {
      this.ctx.lineTo(x, this.cave.ceiling[x]);
    }
    this.ctx.lineTo(width, 0);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(0, height);
    for(let x = 0; x < width; x++) {
      this.ctx.lineTo(x, this.cave.floor[x]);
    }
    this.ctx.lineTo(width, height);
    this.ctx.fill();
  }
}
