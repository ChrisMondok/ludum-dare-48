import type {Game, CaveGeometry} from './game';
import {Vector, PX_PER_FATHOM} from './math.js';
import {INPUT} from './input.js';
import {Image} from './images.js';
import {airEscapeGain, ambienceBiquad, ambienceGain} from './audio.js';

export class Submarine {
  air = 60 * 5 * 1000; //five minutes of air
  contemplation = 0;
  isContemplating = false;

  @Image("images/submarine.png")
  readonly image!: HTMLImageElement;

  private velocity = {x: 0, y: 0};
  private readonly width = 32;
  private readonly height = 16;

  private headlightAngle = 0;

  private readonly maxAir = this.air;

  private buoyancy = 0;
  private readonly ballastAirUsageRate = 10;
  private readonly ballastFillRate = 2;

  private readonly horizontalAcceleration = 100;
  private readonly verticalAcceleration = 66;
  private readonly gravityInAir = 132;
  private readonly drag = 0.5;

  private readonly penetration = {x: 0, y: 0};

  private spotlightGradient: CanvasGradient|undefined;
  private glowGradient: CanvasGradient|undefined;

  private xscale = 1;

  private readonly caveGeometry: CaveGeometry = {
    ceiling: [],
    floor: [],
    center: []
  };
  
  constructor(readonly level: Game, public x: number, public y: number) {}

  tick(dt: number) {
    if(this.air > 0) {
      this.handleInput(dt);

      if(this.isContemplating) this.contemplation += dt * this.getContemplationRate();
    }

    this.buoyancy = Math.max(-1, Math.min(1, this.buoyancy));

    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    const submergedAmount = Math.min(1, Math.max((this.y + this.height/2) / this.height, 0));
    this.velocity.y -= this.buoyancy * this.verticalAcceleration * submergedAmount * dt;
    this.velocity.y += (1 - submergedAmount) * this.gravityInAir * dt;
    this.velocity.x -= this.velocity.x * this.drag * dt;
    this.velocity.y -= this.velocity.y * this.drag * dt;
    if(this.y > this.height / 2) {
      this.air -= dt * 1000;
    }

    this.doCollision(dt);

    if(this.velocity.x > 0) this.xscale = 1;
    if(this.velocity.x < 0) this.xscale = -1;

    ambienceBiquad.frequency.value = 200 + 4000 * Math.max(0, Math.min(1, 1 - (this.y / 1000)));
    ambienceGain.gain.value = Math.min(1, Math.sqrt(Vector.distanceSquared(this.velocity)) / 1000);
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.spotlightGradient = this.spotlightGradient ?? this.createSpotlightGradient(ctx);
    this.glowGradient = this.glowGradient ?? this.createGlowGradient(ctx);
    ctx.save();
    ctx.translate(this.x, this.y);

    if(this.y > 35 * PX_PER_FATHOM && !this.isContemplating) {
      ctx.fillStyle = this.spotlightGradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 500, this.headlightAngle - 0.2, this.headlightAngle + 0.2, false);
      ctx.lineTo(0, 0);
      ctx.fill();
    }

    if(this.y > 15 * PX_PER_FATHOM) {
      ctx.fillStyle = this.glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 128, 0, 2 * Math.PI, false);
      ctx.fill();
    }

    ctx.scale(this.xscale, 1);
    ctx.drawImage(this.image, -this.width/2, -this.height / 2);
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
    const airAmount = Math.max(this.air, 0) / this.maxAir;
    ctx.arc(this.x, this.y, 32, Math.PI * -0.25 * airAmount, Math.PI * 0.25 * airAmount, false);
    ctx.arc(this.x, this.y, 42, Math.PI * 0.25 * airAmount, Math.PI * -0.25 * airAmount, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.penetration.x + this.x, this.penetration.y + this.y);
    ctx.stroke();
  }

  getContemplationRate() {
    return Math.pow(this.y / 2000, 2);
  }

  private doCollision(dt: number) {
    if(dt == 100000) return;

    Vector.copy(this.penetration, Vector.ZERO);
    const startX = Math.floor(this.x - this.width / 2);
    this.level.getCaveGeometry(this.caveGeometry, startX, startX + this.width);
    if(this.caveGeometry.floor.length !== this.width) throw new Error('oh no');

    let totalPenentration = 0

    for(let i = 0; i < this.width; i++) {
      // const xOffset = ((i / this.width) * 2 - 1) * this.width + 1;
      const yOffset = Math.sin(Math.PI * (i / this.width)) * this.height / 2;
      const y = this.y + yOffset;
      const penetrationDepth = -Math.min(0, this.caveGeometry.floor[i] - y);
      totalPenentration += penetrationDepth;
    }

    let slope = 0;
    if(totalPenentration > 0) {
      for(let i = 1; i < this.caveGeometry.floor.length; i++) {
        slope += this.caveGeometry.floor[i] - this.caveGeometry.floor[i - 1];
      }
      slope /= this.caveGeometry.floor.length;
    }

    this.penetration.x = slope * totalPenentration;
    this.penetration.y = -totalPenentration;

    this.x += this.penetration.x * dt;
    this.y += this.penetration.y * dt;
    this.velocity.x += this.penetration.x * dt;
    this.velocity.y += this.penetration.y * dt;
  }

  private handleInput(dt: number) {
    this.isContemplating = INPUT.contemplate;

    if(!this.isContemplating) {
      this.velocity.x += this.horizontalAcceleration * INPUT.right * dt;
      this.buoyancy += this.ballastFillRate * INPUT.up * dt;
      if(INPUT.up > 0) this.air -= dt * 1000 * this.ballastAirUsageRate;

      airEscapeGain.gain.value = 0.3 * Math.max((this.buoyancy + 1) / 2, 0) * Math.max(0, -INPUT.up);

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
    }
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
