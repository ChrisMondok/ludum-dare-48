declare var SimplexNoise: typeof import('./node_modules/simplex-noise/simplex-noise.js');

import {Game} from './game.js';
import {Input} from './input.js';
import {audioContext, masterGain, doneLoadingSounds} from './audio.js';
import {doneLoadingImages} from './images.js';

let game: Game|undefined;

let currentMenu: HTMLDivElement|null = null;

addEventListener('load', () => {
  const canvas = document.querySelector('canvas')!;
  const input = new Input();
  const gallery = document.getElementById('gallery')!;

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
          .then(() => console.log('audio resumed'), e => console.error(e));
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

    if(state === 'playing' && !game) {
      moveGallery(document.body);
      game = new Game(canvas);
      while(gallery.firstChild) gallery.removeChild(gallery.firstChild);
    }

    if(state === 'main-menu' && game) {
      game.ctx.clearRect(0, 0, game.ctx.canvas.width, game.ctx.canvas.height);
      game = undefined;
    }

    masterGain.gain.value = state === 'playing' ? 1 : 0;


    if(currentState) document.body.classList.remove(currentState);
    document.body.classList.add(state);

    currentMenu = document.querySelector<HTMLDivElement>(`#${state}`);
    currentMenu?.querySelector('button')?.focus();

    if(state === 'game-over') {
      moveGallery(document.querySelector('#game-over .gallery-container')!);
    }

    currentState = state;
  }

  setGameState('main-menu');

  Promise.all([doneLoadingImages(), doneLoadingSounds()]).then(() => {
    const startButton = (document.getElementById('start-button') as HTMLButtonElement);
    startButton.disabled = false;
    startButton.focus();
  });

  function moveGallery(where: HTMLElement) {
    // const {left, top} = gallery.getBoundingClientRect();
    // gallery.style.width = width+'px';
    // gallery.style.height = height+'px';
    // gallery.classList.add('dont-move');
    where.appendChild(gallery);
    // const updatedPosition = gallery.getBoundingClientRect();
    // gallery.style.translate = `${left - updatedPosition.left}px ${top - updatedPosition.top}px`;
    // requestAnimationFrame(() => {
    //   gallery.classList.remove('dont-move');
    //   gallery.style.translate = '';
    // });
  }
});

type GameState = 'main-menu'|'paused'|'playing'|'how-to-play'|'game-over';

export let setGameState: (state: GameState) => void;
