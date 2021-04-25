declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

import {playArtSound} from './audio.js';

const noise = new SimplexNoise();
const noise2 = new SimplexNoise();

export function makeArt(width = 48, height = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'black';


  const complexity = Math.floor(Math.random() * 7) + 1;

  for(let i = 0; i < complexity; i++) {
    const artMode = Math.floor(Math.random() * artBits.length);
    chooseColor(ctx);
    chooseLineWidth(ctx);
    artBits[artMode](ctx);
  }

  const img = new Image(width, height);
  img.src = canvas.toDataURL();
  document.getElementById('gallery')!.appendChild(img);
  playArtSound();
}

const artBits = [drawRectangle, drawLine, drawWave, drawWandering];

function chooseColor(ctx: CanvasRenderingContext2D) {
  const color = '#'+Math.floor(Math.random() * 0xFFFFFF).toString(16);
  ctx.strokeStyle = ctx.fillStyle = color;
}

function chooseLineWidth(ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = Math.random() * 4;
}

function drawWandering(ctx: CanvasRenderingContext2D) {
  let x = ctx.canvas.width * Math.random();
  let y = ctx.canvas.height * Math.random();

  ctx.beginPath();
  ctx.moveTo(x, y);
  for(let i = 0; i < 1000; i++) {
    x += noise.noise2D(x / 100, y / 100);
    y += noise2.noise2D(x / 100, y / 100);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawRectangle(ctx: CanvasRenderingContext2D) {
  const {width, height} = ctx.canvas;
  const rx = Math.random() * width;
  const ry = Math.random() * height;
  const rw = Math.random() * (width - rx);
  const rh = Math.random() * (height - ry);
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  if(Math.random() > 0.6) ctx.stroke();
  else ctx.fill();
}

function drawLine(ctx: CanvasRenderingContext2D) {
  const {width, height} = ctx.canvas;

  ctx.beginPath();
  ctx.moveTo(Math.random() * width, Math.random() * height);
  ctx.lineTo(Math.random() * width, Math.random() * height);
  ctx.stroke();
}

function drawWave(ctx: CanvasRenderingContext2D) {
  const slope = Math.pow(Math.random(), 2) * 2;

  const yOffset = Math.random() * ctx.canvas.width;
  const wavyness = Math.pow(Math.random(), 4) * ctx.canvas.height;

  ctx.beginPath();
  for(let x = 0; x < ctx.canvas.width; x++) {
    ctx.lineTo(x, yOffset + noise.noise2D(x / 10, 0) * wavyness + x*slope);
  }
  ctx.stroke();
}

(window as any).makeArt = makeArt;
