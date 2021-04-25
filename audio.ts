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

audioContext.audioWorklet.addModule('dist/noise-processor.js').then(_x => {
  const noise = new AudioWorkletNode(audioContext, 'noise-processor');
  noise.connect(airEscapeGain);
  noise.connect(ambienceGain);
});

export type SoundName = 'thunk1' | 'thunk2' | 'thunk3' | 'crash1';

export function playSound(sound: SoundName) {
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
  const names: SoundName[] = ['thunk1', 'thunk2', 'thunk3', 'crash1'];

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
