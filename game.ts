declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

import {Submarine} from './submarine.js';
import {PX_PER_FATHOM} from './math.js';

export class Game {
  readonly cave: CaveGeometry = {ceiling: [], floor: [], center: []};
  readonly ctx: CanvasRenderingContext2D;
  readonly offset = {x: 0, y: 0};
  readonly submarine: Submarine;

  width: number;
  height: number;

  private readonly noise = new SimplexNoise('ld48');

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.getCaveGeometry(this.cave, 0, canvas.width);
    this.submarine = new Submarine(this, canvas.width / 2, this.cave.center[Math.floor(canvas.width / 2)]);
    this.width = canvas.width;
    this.height = canvas.height;
    (window as any).ctx = this.ctx;
    (window as any).game = this;
  }

  tick(dt: number) {
    this.getCaveGeometry(this.cave, this.offset.x, this.offset.x + this.width);
    this.submarine.tick(dt);
    this.adjustCamera();
  }

  draw() {
    this.ctx.fillStyle = 'skyblue';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.translate(-this.offset.x, -this.offset.y);
    this.drawBackground();
    this.submarine.draw(this.ctx);
    this.drawCaveWalls();
    this.submarine.drawHud(this.ctx);
    this.ctx.resetTransform();
    if((window as any).debug) this.drawDebug();
    this.drawHud();
  }

  private drawHud() {
    this.ctx.font = '16px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'white';
    const offset = PX_PER_FATHOM * Math.floor(this.offset.y / PX_PER_FATHOM);
    for(let i = 0; i < this.height + PX_PER_FATHOM; i += PX_PER_FATHOM) {
      const y = i + offset;
      if(y < 0) continue;
      this.ctx.fillText((y / PX_PER_FATHOM).toString(), 10, y - this.offset.y);
    }

    this.ctx.fillText('fathoms', 10 + this.ctx.measureText('00 ').width, 10 - Math.min(this.offset.y + 10, 0));

    this.ctx.textAlign = 'right';
    const airMessage = this.getRemainingAirTime();
    const contemplationMessage = `contemplation: ${Math.floor(this.submarine.contemplation)}`
    let y = 24;
    this.ctx.fillText(airMessage, this.width - 24, y);
    y += 12 + this.ctx.measureText(airMessage).actualBoundingBoxDescent;
    this.ctx.fillText(contemplationMessage, this.width - 24, y);
    if(this.submarine.isContemplating) {
      y += 12 + this.ctx.measureText(contemplationMessage).actualBoundingBoxDescent;
      const cps = Math.floor(this.submarine.getContemplationRate() * 100) / 100;
      this.ctx.fillText( `+ ${cps}/s`, this.width - 24, y);
    }

    if(this.submarine.air < 0) {
      const fadeAmount = Math.min(1, this.submarine.air / -5000);
      const blackness = `rgba(0, 0, 0, ${fadeAmount}`;
      this.ctx.fillStyle = blackness;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${fadeAmount})`;
      this.ctx.font = '48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Game Over', this.width / 2, this.height / 2);
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText('Your Score: 0', this.width/2, this.height / 2 + 24 + this.ctx.measureText('Game Over').actualBoundingBoxDescent);
    }
  }

  private getRemainingAirTime() {
    const air = Math.max(this.submarine.air, 0);
    const seconds = Math.floor(air / 1000) % 60;
    const minutes = Math.floor(air / 60_000);
    return `${minutes.toString()}:${seconds.toString().padStart(2, '0')} air remaining`;
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

  getCaveGeometry(out: CaveGeometry, xStart: number, xEnd: number): void {
    for(let i = 0; i < xEnd - xStart; i++) {
      const x = i + xStart;

      const difficulty = this.getDifficulty(x);

      const depth = x / 3;
      const height = 80 + 500 * (1-difficulty);

      const centerJagginess = 100 * difficulty;
      const wallJagginess = Math.min(10, height * difficulty);

      const wavelength = 50 + difficulty * 50;
      out.center[i] = depth + centerJagginess * this.noise.noise2D(x / wavelength, depth / wavelength);
      out.ceiling[i] = out.center[i] - (height / 2);
      out.ceiling[i] += wallJagginess * this.noise.noise2D(x / wavelength, out.ceiling[i] / wavelength);
      if(out.ceiling[i] < 0) out.ceiling[i] = -4000;
      out.floor[i] = out.center[i] + (height / 2);
      out.floor[i] += wallJagginess * this.noise.noise2D(x / wavelength, out.floor[i] / wavelength);
    }
  }

  private drawBackground() {
    this.ctx.fillStyle = '#447799';
    this.ctx.beginPath();
    this.ctx.rect(this.offset.x, Math.max(this.offset.y, 0), this.width, this.height);
    const maxLightDepth = 50 * PX_PER_FATHOM;
    const depth = Math.max(0, this.offset.y);
    const darkness = Math.min(1, depth / maxLightDepth);
    this.ctx.fill();
    this.ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
    this.ctx.fill();
  }

  private drawCaveWalls() {
    this.ctx.save();
    this.ctx.resetTransform();
    this.ctx.beginPath();
    this.ctx.rect(0, Math.max(0, -this.offset.y), this.width, this.height);
    this.ctx.clip();
    this.ctx.translate(0, -this.offset.y);
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.offset.y);
    for(let x = 0; x < this.width; x++) {
      this.ctx.lineTo(x, this.cave.ceiling[x]);
    }
    this.ctx.lineTo(this.width, this.offset.y);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height + this.offset.y);
    for(let x = 0; x < this.width; x++) {
      this.ctx.lineTo(x, this.cave.floor[x]);
    }
    this.ctx.lineTo(this.width, this.height + this.offset.y);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawDebug() {
    this.ctx.strokeStyle = 'lime';
    this.ctx.beginPath();
    for(let x = 0; x < this.width; x++) this.ctx.lineTo(x, this.cave.center[x] - this.offset.y);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'red';
    this.ctx.strokeRect(0.5, this.height - 100.5, this.width - 1, 99);
    this.ctx.beginPath();
    for(let x = 0; x < this.width; x++) {
      const difficulty = this.getDifficulty(x + this.offset.x);
      this.ctx.lineTo(x, this.height - 100 * difficulty);
    }
    this.ctx.stroke();
  }

  private getDifficulty(x: number) {
    let scaled = x / 5000;
    if(scaled < 1) return Math.pow(scaled, 2) / 3;
    scaled /= 2;
    const secondPart = 1 - 1/scaled + 2;
    return secondPart / 3;
  }

  private adjustCamera() {
    this.offset.x = this.submarine.x - this.width / 2;
    this.offset.y = this.submarine.y - this.height / 2;
  }
}

export interface CaveGeometry {
  ceiling: number[];
  floor: number[];
  center: number[];
}
