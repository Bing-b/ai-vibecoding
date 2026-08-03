/**
 * Xiangqi Audio Synthesizer using Web Audio API
 */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playSelect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playMove() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Wooden thud / piece placement sound
    const now = this.ctx.currentTime;
    
    // Primary thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // High tap click
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(300, now + 0.02);

    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
    osc2.start(now);
    osc2.stop(now + 0.02);
  }

  playCapture() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Heavy wooden strike
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Crack noise
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.05);

    gain2.gain.setValueAtTime(0.3, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
    osc2.start(now);
    osc2.stop(now + 0.05);
  }

  playCheck() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Urgent double warning chime
    [0, 0.12].forEach((delay, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 587.33 : 880, now + delay); // D5 then A5
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0.3, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.4);
    });
  }
}

const sounds = new SoundEffects();
