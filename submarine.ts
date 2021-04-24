import type {Game} from './game';
import {distanceSquared} from './math.js';
import {INPUT} from './input.js';

export class Submarine {
  headlightAngle = 0;

  private velocity = {x: 0, y: 0};
  private buoyancy = 0;

  private readonly ballastFillRate = 2;
  private readonly horizontalAcceleration = 100;
  private readonly verticalAcceleration = 50;
  private readonly drag = 0.5;
  
  constructor(readonly level: Game, public x: number, public y: number) {}

  tick(dt: number) {
    this.buoyancy += this.ballastFillRate * INPUT.up * dt;
    this.buoyancy = Math.max(-1, Math.min(1, this.buoyancy));
    switch(INPUT.aimMode) {
      case 'joystick':
        if(distanceSquared(INPUT.rightAxis) > 0.1) {
          this.headlightAngle = Math.atan2(INPUT.rightAxis.y, INPUT.rightAxis.x);
        }
        break;
      case 'mouse':
        this.headlightAngle = Math.atan2(INPUT.mouse.y - this.level.offset.y - this.y, INPUT.mouse.x - this.level.offset.x - this.x);
        break;
    }

    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    this.velocity.x += this.horizontalAcceleration * INPUT.right * dt;
    this.velocity.y -= this.buoyancy * this.verticalAcceleration * dt;
    this.velocity.x -= this.velocity.x * this.drag * dt;
    this.velocity.y -= this.velocity.y * this.drag * dt;
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
    ctx.stroke();
  }

  drawHud(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    //buoyancy meter
    const bmLeftEdge = this.velocity.x < 0 ? this.x + 30.5 : this.x - 40.5;
    ctx.strokeRect(bmLeftEdge, this.y - 32, 10, 64);
    ctx.fillStyle = 'white';
    ctx.fillRect(bmLeftEdge, this.y + 0, 10, - 32 * this.buoyancy);
  }
}
