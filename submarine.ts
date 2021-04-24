import type {Level} from './main';

export class Submarine {
  headlightAngle = 0;

  private velocity = {x: 0, y: 0};
  private buoyancy = 1;
  
  private traceEnd = {x: 0, y: 0};

  constructor(readonly level: Level, public x: number, public y: number) {

  }

  tick(dt: number) {
    this.headlightAngle = Math.atan2(this.level.mouse.y - this.y, this.level.mouse.x - this.x);
    this.level.trace(this.traceEnd, this, this.level.mouse);
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
    this.velocity.y -= this.buoyancy * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 12, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.arc(this.x, this.y, 500, this.headlightAngle - 0.2, this.headlightAngle + 0.2, false);
    ctx.lineTo(this.x, this.y);
    ctx.fill();

    ctx.strokeStyle = 'lime';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.traceEnd.x, this.traceEnd.y);
    ctx.stroke();
  }
}
