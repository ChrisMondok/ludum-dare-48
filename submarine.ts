import type {Game} from './game';
import {Vector} from './math.js';
import {INPUT} from './input.js';

export class Submarine {
  headlightAngle = 0;

  velocity = {x: 0, y: 0};
  private buoyancy = 0;
  private spotlightGradient: CanvasGradient|undefined;
  private glowGradient: CanvasGradient|undefined;

  private readonly ballastFillRate = 2;
  private readonly horizontalAcceleration = 100;
  private readonly verticalAcceleration = 66;
  private readonly drag = 0.5;
  
  constructor(readonly level: Game, public x: number, public y: number) {}

  tick(dt: number) {
    this.buoyancy += this.ballastFillRate * INPUT.up * dt;
    this.buoyancy = Math.max(-1, Math.min(1, this.buoyancy));
    switch(INPUT.aimMode) {
      case 'joystick':
        if(Vector.distanceSquared(INPUT.rightAxis) > 0.1) {
          this.headlightAngle = Math.atan2(INPUT.rightAxis.y, INPUT.rightAxis.x);
        }
        break;
      case 'mouse':
        this.headlightAngle = Math.atan2(INPUT.mouse.y + this.level.offset.y - this.y, INPUT.mouse.x + this.level.offset.x - this.x);
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
    this.spotlightGradient = this.spotlightGradient ?? this.createSpotlightGradient(ctx);
    this.glowGradient = this.glowGradient ?? this.createGlowGradient(ctx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = 'silver';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.fillStyle = this.spotlightGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 500, this.headlightAngle - 0.2, this.headlightAngle + 0.2, false);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.fillStyle = this.glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 128, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.restore();
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

  private createSpotlightGradient(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    return gradient;
  }

  private createGlowGradient(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 128);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    return gradient;
  }
}
