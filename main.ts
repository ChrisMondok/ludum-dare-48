declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

import {Game} from './game.js';
import {Input} from './input.js';

addEventListener('load', () => {
  const canvas = document.querySelector('canvas')!;

  const input = new Input();
  const level = new Game(canvas);

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

  addEventListener('resize', () => {
    resizeCanvas();
  });

  resizeCanvas();

  function resizeCanvas() {
    const {width, height} = canvas.getBoundingClientRect();
    level.width = canvas.width = width;
    level.height = canvas.height = height;
  }
});
