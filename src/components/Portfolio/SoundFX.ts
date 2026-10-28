/**
 * Procedural Web Audio API sound synthesis.
 * Generates tactile mechanical keyboard clicks and subtle UI feedback
 * completely in code with ZERO external audio files or 404 dependencies.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * High-tactile mechanical switch click (crisp click transient + lower housing resonance)
   */
  public playKeyClick(pitchModifier: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      // 1. Click transient (high snap)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400 * pitchModifier, t);
      osc.frequency.exponentialRampToValueAtTime(320 * pitchModifier, t + 0.035);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.035);

      // 2. Switch housing bottom-out "thock"
      const thockOsc = this.ctx.createOscillator();
      const thockGain = this.ctx.createGain();
      thockOsc.type = 'sine';
      thockOsc.frequency.setValueAtTime(180 * pitchModifier, t + 0.005);
      thockOsc.frequency.exponentialRampToValueAtTime(45 * pitchModifier, t + 0.06);

      thockGain.gain.setValueAtTime(0.12, t + 0.005);
      thockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      thockOsc.connect(thockGain);
      thockGain.connect(this.ctx.destination);
      thockOsc.start(t + 0.005);
      thockOsc.stop(t + 0.065);
    } catch {
      // AudioContext policy or restricted environment
    }
  }

  /**
   * Subtle futuristic hover blip
   */
  public playHoverBlip() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.04);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch {}
  }
}

export const soundFX = new SoundManager();
