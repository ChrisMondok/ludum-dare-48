import type {Game} from './game';
import {Vector} from './math.js';
import {INPUT} from './input.js';

export class Submarine {
  headlightAngle = 0;

  velocity = {x: 0, y: 0};

  air = 60 * 5 * 1000; //five minutes of air
  readonly maxAir = this.air;

  private buoyancy = 0;
  private spotlightGradient: CanvasGradient|undefined;
  private glowGradient: CanvasGradient|undefined;
  private ballastAirUsageRate = 10;

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
    this.air -= dt * 1000;
    if(INPUT.up > 0) this.air -= dt * 1000 * this.ballastAirUsageRate;
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
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    //buoyancy meter
    ctx.beginPath();
    ctx.arc(this.x, this.y, 32, Math.PI * 0.75, Math.PI * 1.25, false);
    ctx.arc(this.x, this.y, 42, Math.PI * 1.25, Math.PI * 0.75, true);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    const end = this.buoyancy * 0.25 * Math.PI;
    ctx.arc(this.x, this.y, 32, Math.PI, Math.PI + end, this.buoyancy < 0);
    ctx.arc(this.x, this.y, 42, Math.PI + end, Math.PI, this.buoyancy > 0);
    ctx.closePath();
    ctx.fill();

    //air meter
    ctx.beginPath();
    ctx.arc(this.x, this.y, 32, Math.PI * -0.25, Math.PI * 0.25, false);
    ctx.arc(this.x, this.y, 42, Math.PI * 0.25, Math.PI * -0.25, true);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = INPUT.up > 0 ? '#F88' : 'white';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 32, Math.PI * -0.25 * (this.air / this.maxAir), Math.PI * 0.25 * (this.air / this.maxAir), false);
    ctx.arc(this.x, this.y, 42, Math.PI * 0.25 * (this.air / this.maxAir), Math.PI * -0.25 * (this.air / this.maxAir), true);
    ctx.closePath();
    ctx.fill();
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
