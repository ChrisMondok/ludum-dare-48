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
