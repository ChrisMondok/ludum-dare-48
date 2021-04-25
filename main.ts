declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

import {Game} from './game.js';
import {Input} from './input.js';

let game: Game|undefined;

addEventListener('load', () => {
  const canvas = document.querySelector('canvas')!;
  const input = new Input();


  let previousTime = 0;
  function main(time: number) {
    if(previousTime && currentState === 'playing') {
      const dt = (time - previousTime) / 1000;
      input.tick();
      if(game) {
        game.tick(dt);
        game.draw();
      }
    }
    previousTime = time;
    requestAnimationFrame(main);
  }

  requestAnimationFrame(main);

  addEventListener('resize', () => {
    resizeCanvas();
  });

  addEventListener('keydown', ({key}) => {
    if(key === 'Escape') setGameState('paused');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-set-state]').forEach(btn => {
    btn.addEventListener('click', () => {
      setGameState(btn.getAttribute('data-set-state')! as GameState);
      btn.blur();
    });
  });

  resizeCanvas();

  function resizeCanvas() {
    const {width, height} = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    if(game) {
      game.width = width;
      game.height = height;
    }
  }

  let currentState: GameState;
  function setGameState(state: GameState) {
    if(currentState === state) return;
    if(state === 'paused' && currentState !== 'playing') return;
    if(currentState) document.body.classList.remove(currentState);
    document.body.classList.add(state);

    if(state === 'playing' && !game) {
      game = new Game(canvas);
    }

    if(state === 'main-menu' && game) {
      game.ctx.clearRect(0, 0, game.ctx.canvas.width, game.ctx.canvas.height);
      game = undefined;
    }

    document.querySelector<HTMLButtonElement>(`#${state} button`)?.focus();

    currentState = state;
  }

  setGameState('main-menu');
});

type GameState = 'main-menu'|'paused'|'playing'|'how-to-play';
