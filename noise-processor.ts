interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare var AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

declare function registerProcessor(
  name: string,
  processorCtor: (new (
    options?: AudioWorkletNodeOptions
  ) => AudioWorkletProcessor) & {
    parameterDescriptors?: AudioParamDescriptor[];
  }
): void;

class NoiseProcessor extends AudioWorkletProcessor {
  process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>) {
    for(const output of outputs) {
      for(const channel of output) {
        for(let i = 0; i < channel.length; i++) {
          channel[i] = Math.random() * 2 - 1;
        }
      }
    }
    return true;
  }
}

registerProcessor('noise-processor', NoiseProcessor);
