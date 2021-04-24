declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

import {Input} from './input.js';
import {Submarine} from './submarine.js';

const NOISE = new SimplexNoise('floor');

addEventListener('load', () => {
  const canvas = document.querySelector('canvas')!;

  const input = new Input();
  const level = new Game(input, canvas);

  let previousTime = 0;
  function main(time: number) {
    if(previousTime) {
      const dt = (time - previousTime) / 1000;
      input.tick();
      level.tick(dt);
      level.draw();
    }
    previousTime = time;
    requestAnimationFrame(main);
  }

  requestAnimationFrame(main);
});


interface CaveGeometry {
  ceiling: number[];
  floor: number[];
}

export class Game {
  readonly cave: CaveGeometry = {ceiling: [], floor: []};
  readonly ctx = this.canvas.getContext('2d')!;
  readonly offset = {x: 0, y: 0};

  readonly submarine: Submarine;

  constructor(readonly input: Input, readonly canvas: HTMLCanvasElement) {
    this.submarine = new Submarine(this, 300, 300);
    (window as any).ctx = this.ctx;
  }

  tick(dt: number) {
    this.getCaveGeometry(this.cave, 0, this.canvas.width);
    this.submarine.tick(dt);
  }

  draw() {
    const {width, height} = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.submarine.draw(this.ctx);
    this.drawCaveWalls();
    this.submarine.drawHud(this.ctx);
  }

  trace(out: {x: number, y: number}, origin: {x: number, y: number}, destination: {x: number, y: number}) {
    const slope = (destination.y - origin.y) / (destination.x - origin.x);
    out.x = origin.x;
    const dx = Math.abs(destination.x - origin.x);
    const increment = origin.x < destination.x ? 1 : -1;
    for(let i = 0; i < dx; i++) {
      out.x = origin.x + increment * i;
      out.y = origin.y + increment * slope * i;

      // TODO: there should probably be a function to get cave geometry to deal with when this goes
      // off screen, as the cave geometry won't be set there.
      if(out.y > this.cave.floor[out.x - this.offset.x]) return;
      if(out.y < this.cave.ceiling[out.x - this.offset.y]) return;
    }
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

  private getCaveGeometry(out: CaveGeometry, xStart: number, xEnd: number): void {
    for(let i = 0; i < xEnd - xStart; i++) {
      const x = i + xStart;
      out.ceiling[i] = 100 * NOISE.noise2D(x / 100, 0) + 100;
      out.floor[i] = this.cave.ceiling[i] + 300 + 100  * NOISE.noise2D(x / 100, 1);
    }
  }

}
