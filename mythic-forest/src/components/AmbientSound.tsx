"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AmbientNodes = {
  context: AudioContext;
  windSource: AudioBufferSourceNode;
  windFilter: BiquadFilterNode;
  windGain: GainNode;
  resonanceOsc: OscillatorNode;
  resonanceGain: GainNode;
  birdOsc: OscillatorNode;
  birdGain: GainNode;
  masterGain: GainNode;
};

function createBrownNoiseBuffer(context: AudioContext) {
  const bufferSize = context.sampleRate * 2;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    const brown = (lastOut + 0.02 * white) / 1.02;
    lastOut = brown;
    data[i] = brown * 0.6;
  }
  return buffer;
}

function setupSoundscape(): AmbientNodes {
  const context = new AudioContext();

  const masterGain = context.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(context.destination);

  // Wind bed
  const windSource = context.createBufferSource();
  windSource.buffer = createBrownNoiseBuffer(context);
  windSource.loop = true;

  const windFilter = context.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 320;
  windFilter.Q.value = 0.8;

  const windGain = context.createGain();
  windGain.gain.value = 0.28;

  windSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(masterGain);

  // Divine resonance
  const resonanceOsc = context.createOscillator();
  resonanceOsc.type = "sine";
  resonanceOsc.frequency.value = 172;

  const resonanceGain = context.createGain();
  resonanceGain.gain.value = 0.0;

  resonanceOsc.connect(resonanceGain);
  resonanceGain.connect(masterGain);

  // Distant birds / chimes
  const birdOsc = context.createOscillator();
  birdOsc.type = "triangle";
  birdOsc.frequency.value = 1024;

  const birdGain = context.createGain();
  birdGain.gain.value = 0;

  const birdFilter = context.createBiquadFilter();
  birdFilter.type = "highpass";
  birdFilter.frequency.value = 850;
  birdFilter.Q.value = 1.6;

  birdOsc.connect(birdFilter);
  birdFilter.connect(birdGain);
  birdGain.connect(masterGain);

  windSource.start();
  resonanceOsc.start();
  birdOsc.start();

  return {
    context,
    windSource,
    windFilter,
    windGain,
    resonanceOsc,
    resonanceGain,
    birdOsc,
    birdGain,
    masterGain,
  };
}

export default function AmbientSound() {
  const nodesRef = useRef<AmbientNodes | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    return () => {
      if (!nodesRef.current) return;
      nodesRef.current.windSource.stop();
      nodesRef.current.resonanceOsc.stop();
      nodesRef.current.birdOsc.stop();
      nodesRef.current.context.close();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !nodesRef.current) return;
    const {
      masterGain,
      resonanceGain,
      windFilter,
      birdGain,
      context,
      windGain,
    } = nodesRef.current;
    const now = context.currentTime;

    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(0.7, now + 6);

    resonanceGain.gain.cancelScheduledValues(now);
    resonanceGain.gain.linearRampToValueAtTime(0.1, now + 8);
    resonanceGain.gain.setTargetAtTime(0.03, now + 12, 5);

    windFilter.frequency.setTargetAtTime(360, now, 4);
    windFilter.frequency.setTargetAtTime(260, now + 9, 6);

    windGain.gain.setTargetAtTime(0.28, now, 5);
    windGain.gain.setTargetAtTime(0.18, now + 6, 6);

    birdGain.gain.cancelScheduledValues(now);
    birdGain.gain.linearRampToValueAtTime(0.02, now + 4);
    birdGain.gain.setTargetAtTime(0.006, now + 9, 6);
  }, [enabled]);

  const enableSound = async () => {
    try {
      if (!nodesRef.current) {
        nodesRef.current = setupSoundscape();
      }
      const ctx = nodesRef.current.context;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      setEnabled(true);
    } catch (error) {
      console.error("Unable to start ambient sound", error);
      setAvailable(false);
    }
  };

  const hint = useMemo(() => {
    if (!available) return "Audio unavailable";
    return enabled ? "Immersive audio active" : "Enable immersive audio";
  }, [available, enabled]);

  return (
    <div className="pointer-events-auto">
      <button
        type="button"
        onClick={enableSound}
        disabled={!available || enabled}
        className="rounded-full bg-white/10 px-5 py-2 text-sm uppercase tracking-[0.4em] text-amber-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-amber-200/60"
      >
        {hint}
      </button>
    </div>
  );
}

