export const audioContext = new AudioContext();

export const masterGain = audioContext.createGain();
masterGain.gain.value = 0;
masterGain.connect(audioContext.destination);

export const airEscapeGain = audioContext.createGain();
airEscapeGain.gain.value = 0;
airEscapeGain.connect(masterGain);

export const ambienceBiquad = audioContext.createBiquadFilter();
ambienceBiquad.frequency.value = 4000;
ambienceBiquad.connect(masterGain);

export const ambienceGain = audioContext.createGain();
ambienceGain.gain.value = 0;
ambienceGain.connect(ambienceBiquad);

export const pumpGain = audioContext.createGain();
pumpGain.gain.value = 0;
pumpGain.connect(audioContext.destination);

export const pumpOsc = audioContext.createOscillator();
pumpOsc.start();
pumpOsc.type = 'sawtooth';
pumpOsc.connect(pumpGain);

audioContext.audioWorklet.addModule('dist/noise-processor.js').then(_x => {
  const noise = new AudioWorkletNode(audioContext, 'noise-processor');
  noise.connect(airEscapeGain);
  noise.connect(ambienceGain);
});

export type SoundName = 'thunk1'
  | 'thunk2'
  | 'thunk3'
  | 'crash1'
  | 'art-01'
  | 'art-02'
  | 'art-03'
  | 'art-04'
  | 'art-05'
  | 'art-06'
  | 'art-07'
  | 'contemplation-01'
  | 'contemplation-02'
  | 'contemplation-03'
  | 'contemplation-04'
  | 'contemplation-05'
  | 'contemplation-06'
  | 'contemplation-07'
  | 'drowned'

export function playCrashSound() {
  playSound(pickSound(['thunk1', 'thunk2', 'thunk3', 'crash1']));
}

export function playContemplationSound() {
  playSound(pickSound([
    'contemplation-01',
    'contemplation-02',
    'contemplation-03',
    'contemplation-04',
    'contemplation-05',
    'contemplation-06',
    'contemplation-07',
  ]));
}

export function playDrownedSound() {
  playSound('drowned');
}

export function playArtSound() {
  playSound(pickSound([
    'art-01',
    'art-02',
    'art-03',
    'art-04',
    'art-05',
    'art-06',
    'art-07',
  ]));
}

function pickSound(sounds: SoundName[]) {
  return sounds[Math.floor(Math.random() * sounds.length)];
}

function playSound(sound: SoundName) {
  const source = audioContext.createBufferSource()
  source.buffer = soundMap.get(sound)!;
  source.connect(masterGain);
  source.start(audioContext.currentTime);
}

let soundMap: Map<string, AudioBuffer>;

export async function doneLoadingSounds() {
  soundMap = await loadAllSounds();
  return;
}

async function loadAllSounds() {
  const names: SoundName[] = [
    'thunk1',
    'thunk2',
    'thunk3',
    'crash1',
    'contemplation-01',
    'contemplation-02',
    'contemplation-03',
    'contemplation-04',
    'contemplation-05',
    'contemplation-06',
    'contemplation-07',
    'art-01',
    'art-02',
    'art-03',
    'art-04',
    'art-05',
    'art-06',
    'art-07',
    'drowned',
  ];

  const entries = names.map(async n => {
    const buffer = await loadSound(n)
    return [n, buffer] as const;
  });

  return new Map(await Promise.all(entries));
}

async function loadSound(name: SoundName) {
  const data = await fetch(`sounds/${name}.wav`);
  const arrayBuffer = await data.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

var numCoeffs = 64; // The more coefficients you use, the better the approximation
var realCoeffs = new Float32Array(numCoeffs);
var imagCoeffs = new Float32Array(numCoeffs);

realCoeffs[0] = 0.2;
for (var i = 1; i < numCoeffs; i++) { // note i starts at 1
      imagCoeffs[i] = 1 / (i * Math.PI);
}
