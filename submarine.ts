import type {Game, CaveGeometry} from './game';
import {Vector, PX_PER_FATHOM} from './math.js';
import {INPUT} from './input.js';
import {Image} from './images.js';
import {airEscapeGain, ambienceBiquad, ambienceGain, playSound} from './audio.js';

export class Submarine {
  air = 60 * 8 * 1000;
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

  private damage = 0;
  private readonly leakAtMaxDamage = 2;

  private readonly caveGeometry: CaveGeometry = {
    ceiling: [],
    floor: [],
    center: []
  };

  private showQuitWarning = 0;
  private crashSoundCooldown = 0;
  
  constructor(readonly game: Game, public x: number, public y: number) {
    document.getElementById('score')!.textContent = Math.floor(this.contemplation).toString();
  }

  tick(dt: number) {
    if(this.air > 0) {
      this.handleInput(dt);

      if(this.isContemplating) this.contemplation += dt * this.game.getContemplationRate(this.y);
    }

    this.buoyancy = Math.max(-1, Math.min(1, this.buoyancy));

    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    const submergedAmount = Math.min(1, Math.max((this.y + this.height/2) / this.height, 0));
    this.velocity.y -= this.buoyancy * this.verticalAcceleration * submergedAmount * dt;
    this.velocity.y += (1 - submergedAmount) * this.gravityInAir * dt;
    this.velocity.x -= this.velocity.x * this.drag * dt;
    this.velocity.y -= this.velocity.y * this.drag * dt;
    if(this.y > this.height / 2 || this.air < 0) {
      this.air -= dt * 1000;
      this.air -= dt * 1000 * this.leakAtMaxDamage * this.damage / 100;
    }

    this.doCollision(dt);

    if(this.velocity.x > 0) this.xscale = 1;
    if(this.velocity.x < 0) this.xscale = -1;

    ambienceBiquad.frequency.value = 200 + 4000 * Math.max(0, Math.min(1, 1 - (this.y / 1000)));
    ambienceGain.gain.value = 0.5 * Math.min(1, Math.sqrt(Vector.distanceSquared(this.velocity)) / 1000);

    this.showQuitWarning = Math.max(0, this.showQuitWarning - dt);
    this.crashSoundCooldown = Math.max(0, this.crashSoundCooldown - dt);
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

    if(this.showQuitWarning > 0) {
      ctx.fillStyle = '#FAA';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillText('you must be at the surface to exit', this.x, this.y + 50);
    }

    if((window as any).debug) {
      ctx.strokeStyle = 'red';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.penetration.x + this.x, this.penetration.y + this.y);
      ctx.stroke();
    }
  }

  private doCollision(dt: number) {
    Vector.copy(this.penetration, Vector.ZERO);
    const startX = Math.floor(this.x - this.width / 2);
    this.game.getCaveGeometry(this.caveGeometry, startX, startX + this.width);
    if(this.caveGeometry.floor.length !== this.width) throw new Error('oh no');

    let floorPenetration = 0
    let ceilingPenetration = 0;

    for(let i = 0; i < this.width; i++) {
      const yOffset = Math.sin(Math.PI * (i / this.width)) * this.height / 2;
      floorPenetration -= Math.min(0, this.caveGeometry.floor[i] - (this.y + yOffset));
      ceilingPenetration -= Math.min(0, (this.y - yOffset) - this.caveGeometry.ceiling[i]);
    }

    if(floorPenetration > 0) {
      let slope = 0;
      for(let i = 1; i < this.caveGeometry.floor.length; i++) {
        slope += this.caveGeometry.floor[i] - this.caveGeometry.floor[i - 1];
      }
      slope /= this.caveGeometry.floor.length;
      this.penetration.x += slope * floorPenetration;
      this.penetration.y += -floorPenetration;
    }

    if(ceilingPenetration > 0) {
      let slope = 0;
      for(let i = 1; i < this.caveGeometry.floor.length; i++) {
        slope += this.caveGeometry.ceiling[i] - this.caveGeometry.ceiling[i - 1];
      }
      slope /= this.caveGeometry.ceiling.length;
      this.penetration.x -= slope * ceilingPenetration;
      this.penetration.y += ceilingPenetration;
    }


    this.x += this.penetration.x * dt;
    this.y += this.penetration.y * dt;
    this.velocity.x += this.penetration.x * dt;
    this.velocity.y += this.penetration.y * dt;

    const crashAmount = Vector.distanceSquared(this.penetration)
    if(crashAmount > 2000) {
      this.damage += crashAmount / 10000;
      console.log(this.damage);
      if(this.crashSoundCooldown === 0) {
        this.crashSoundCooldown = 0.1 + Math.random() * 0.3;
        const soundToPlay = (['thunk1', 'thunk2', 'thunk3', 'crash1'] as const)[Math.floor(Math.random() * 4)];
        playSound(soundToPlay);
      }
    }
  }

  private handleInput(dt: number) {
    if(INPUT.quit) this.endGame();
    this.isContemplating = INPUT.contemplate;

    if(!this.isContemplating) {
      this.velocity.x += this.horizontalAcceleration * INPUT.right * dt;
      this.buoyancy += this.ballastFillRate * INPUT.up * dt;
      if(INPUT.up > 0) this.air -= dt * 1000 * this.ballastAirUsageRate;

      airEscapeGain.gain.value = 0.2 * Math.max((this.buoyancy + 1) / 2, 0) * Math.max(0, -INPUT.up);

      switch(INPUT.aimMode) {
        case 'joystick':
          if(Vector.distanceSquared(INPUT.rightAxis) > 0.1) {
            this.headlightAngle = Math.atan2(INPUT.rightAxis.y, INPUT.rightAxis.x);
          }
          break;
        case 'mouse':
          this.headlightAngle = Math.atan2(INPUT.mouse.y + this.game.offset.y - this.y, INPUT.mouse.x + this.game.offset.x - this.x);
          break;
      }
    }
  }

  private endGame() {
    if(this.y > this.height) {
      this.showQuitWarning = 3;
      return;
    }
    this.game.endGame(this.contemplation);
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
