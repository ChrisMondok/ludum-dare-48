declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

import {Game} from './game.js';
import {Input} from './input.js';
import {audioContext, masterGain} from './audio.js';
import {doneLoadingImages} from './images.js';

let game: Game|undefined;

addEventListener('load', () => {
  const canvas = document.querySelector('canvas')!;
  const input = new Input();

  let previousTime = 0;
  function main(time: number) {
    if(previousTime && currentState === 'playing') {
      const dt = Math.min(0.12, (time - previousTime) / 1000);
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

  addEventListener('resize', resizeCanvas);

  addEventListener('keydown', ({key}) => {
    if(key === 'Escape') pauseOrQuit();
  });

  addEventListener('blur', pauseOrQuit);

  document.querySelectorAll<HTMLButtonElement>('[data-set-state]').forEach(btn => {
    btn.addEventListener('click', () => {
      setGameState(btn.getAttribute('data-set-state')! as GameState);
      btn.blur();
      if(audioContext.state === 'suspended') {
        audioContext.resume()
          .then(() => console.log('audio online'), e => console.error(e));
      }
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
    if(state === 'paused' && !game) return;

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

    masterGain.gain.value = state === 'playing' ? 1 : 0;

    currentState = state;
  }

  setGameState('main-menu');

  doneLoadingImages().then(() => (document.getElementById('start-button') as HTMLButtonElement).disabled = false);

  function pauseOrQuit() {
    if(!game) {
      setGameState('main-menu');
    } else if(game.submarine.air <= 0) {
      setGameState('main-menu');
    } else {
      setGameState('paused');
    }
  }
});

type GameState = 'main-menu'|'paused'|'playing'|'how-to-play';
