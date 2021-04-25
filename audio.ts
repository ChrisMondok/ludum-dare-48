export const audioContext = new AudioContext();

export const airEscapeGain = audioContext.createGain();
airEscapeGain.gain.value = 0;
airEscapeGain.connect(audioContext.destination);

export const ambienceBiquad = audioContext.createBiquadFilter();
ambienceBiquad.frequency.value = 4000;
ambienceBiquad.connect(audioContext.destination);

export const ambienceGain = audioContext.createGain();
ambienceGain.gain.value = 0;
ambienceGain.connect(ambienceBiquad);

audioContext.audioWorklet.addModule('dist/noise-processor.js').then(_x => {
  const noise = new AudioWorkletNode(audioContext, 'noise-processor');
  noise.connect(airEscapeGain);
  noise.connect(ambienceGain);
});
