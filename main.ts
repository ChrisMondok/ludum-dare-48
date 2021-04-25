declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

import {Game} from './game.js';
import {Input} from './input.js';
import {audioContext, masterGain} from './audio.js';
import {doneLoadingImages} from './images.js';

let game: Game|undefined;

let currentMenu: HTMLDivElement|null = null;

addEventListener('load', () => {
  const canvas = document.querySelector('canvas')!;
  const input = new Input();

  let previousTime = 0;
  function main(time: number) {
    if(previousTime) {
      const dt = Math.min(0.12, (time - previousTime) / 1000);
      input.tick();
      if(game && currentState === 'playing') {
        game.tick(dt);
        game.draw();
      }

      if(currentMenu && Math.abs(input.vScroll) > 0.1) {
        currentMenu.scrollTop += Math.floor(input.vScroll * dt * 1000);
      }
    }
    previousTime = time;
    requestAnimationFrame(main);
  }

  requestAnimationFrame(main);

  addEventListener('resize', resizeCanvas);

  addEventListener('keydown', ({key}) => {
    if(key === 'Escape') setGameState('paused');
  });

  addEventListener('blur', () => setGameState('paused'));
  addEventListener('focus', () => currentMenu?.querySelector('button')?.focus());

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
  setGameState = function(state: GameState) {
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

    currentMenu = document.querySelector<HTMLDivElement>(`#${state}`);
    currentMenu?.querySelector('button')?.focus();

    masterGain.gain.value = state === 'playing' ? 1 : 0;

    currentState = state;
  }

  setGameState('main-menu');

  doneLoadingImages().then(() => {
    const startButton = (document.getElementById('start-button') as HTMLButtonElement);
    startButton.disabled = false;
    startButton.focus();
  });
});

type GameState = 'main-menu'|'paused'|'playing'|'how-to-play'|'game-over';

export let setGameState: (state: GameState) => void;
