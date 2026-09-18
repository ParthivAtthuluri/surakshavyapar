// Audio utility for Suraksha Vyapar: Payment Chimes & High-Priority Scam Buzzing Alarms

let audioCtxInstance: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtxInstance || audioCtxInstance.state === 'closed') {
      audioCtxInstance = new AudioCtx();
    }
    if (audioCtxInstance.state === 'suspended') {
      audioCtxInstance.resume();
    }
    return audioCtxInstance;
  } catch (e) {
    console.warn('AudioContext not available:', e);
    return null;
  }
}

/**
 * Play a pleasant two-tone chime when a legitimate UPI payment succeeds.
 */
export function playChimeTone(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.1); // A5

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    console.warn('Failed to play chime:', e);
  }
}

/**
 * Play an urgent, unmistakable buzzing alarm sound when a scam or reverse-pull is blocked.
 * Emits rapid, piercing buzzer pulses (sawtooth + square waves with low-frequency rumble).
 */
export function playBuzzingAlarmSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulseCount = 4;
    const pulseDuration = 0.22; // length of each buzz burst
    const gap = 0.08; // gap between buzzes

    for (let i = 0; i < pulseCount; i++) {
      const startTime = now + i * (pulseDuration + gap);
      const endTime = startTime + pulseDuration;

      // 1. Harsh industrial buzzer oscillator (Sawtooth 180Hz -> 140Hz)
      const buzzOsc = ctx.createOscillator();
      buzzOsc.type = 'sawtooth';
      buzzOsc.frequency.setValueAtTime(200, startTime);
      buzzOsc.frequency.linearRampToValueAtTime(140, endTime);

      // 2. High-pitch piercing alarm siren harmonic (Square wave 920Hz / 780Hz alternate)
      const sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'square';
      sirenOsc.frequency.setValueAtTime(920, startTime);
      sirenOsc.frequency.setValueAtTime(760, startTime + pulseDuration * 0.5);

      // 3. Modulator for rapid harsh "electrical buzz" vibration (45Hz square)
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(50, startTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(80, startTime);
      lfo.connect(buzzOsc.frequency);

      // Master gain envelope for this pulse
      const pulseGain = ctx.createGain();
      pulseGain.gain.setValueAtTime(0.001, startTime);
      pulseGain.gain.linearRampToValueAtTime(0.45, startTime + 0.02); // fast attack
      pulseGain.gain.setValueAtTime(0.40, startTime + pulseDuration * 0.7);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, endTime); // clean cutoff

      buzzOsc.connect(pulseGain);
      sirenOsc.connect(pulseGain);
      pulseGain.connect(ctx.destination);

      buzzOsc.start(startTime);
      buzzOsc.stop(endTime);
      sirenOsc.start(startTime);
      sirenOsc.stop(endTime);
      lfo.start(startTime);
      lfo.stop(endTime);
    }
  } catch (e) {
    console.error('Failed to play buzzing alarm sound:', e);
  }
}
