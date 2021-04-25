declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

const MAX_BUBBLES = 100;

const bubbleNoise = new SimplexNoise();

const bubbles = new Array(100).fill(undefined).map(() => ({
  x: 0,
  y: 0,
  size: 0,
}));

let nextIndex = 0;

export function addBubble(x: number, y: number) {
  bubbles[nextIndex].x = x;
  bubbles[nextIndex].y = y;
  bubbles[nextIndex].size = 2;
  nextIndex = (nextIndex + 1) % MAX_BUBBLES;
}

export function tickBubbles(dt: number) {
  for(const bubble of bubbles) {
    if(bubble.size === 0) continue;
    bubble.x += dt * 100 * bubbleNoise.noise2D(bubble.x / 10, bubble.y / 10);
    bubble.y -= dt * 100;
    bubble.size += dt;
    if(bubble.size > 5) bubble.size = 0;
    if(bubble.y < bubble.size) bubble.size = 0;
  }
}

export function drawBubbles(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  for(const bubble of bubbles) {
    if(bubble.size === 0) continue;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.size, 0, 2 * Math.PI, false);
    ctx.stroke();
  }
}
