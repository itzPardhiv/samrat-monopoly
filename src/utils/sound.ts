class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq: number, duration = 0.12, type: OscillatorType = 'triangle', gainVal = 0.08) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio errors in headless browsers
    }
  }

  playDiceRoll() {
    this.playTone(320, 0.07, 'triangle', 0.07);
    setTimeout(() => this.playTone(440, 0.08, 'triangle', 0.08), 65);
    setTimeout(() => this.playTone(587, 0.12, 'sine', 0.09), 130);
  }

  playBuyDeed() {
    this.playTone(523.25, 0.1, 'sine', 0.09);
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.09), 90);
    setTimeout(() => this.playTone(783.99, 0.18, 'triangle', 0.1), 180);
  }

  playAuctionBid() {
    this.playTone(600, 0.09, 'sine', 0.08);
    setTimeout(() => this.playTone(750, 0.11, 'sine', 0.08), 75);
  }

  playEventCard() {
    this.playTone(440, 0.12, 'sine', 0.08);
    setTimeout(() => this.playTone(554.37, 0.15, 'triangle', 0.08), 100);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.2, 'triangle', 0.1), idx * 110);
    });
  }
}

export const soundFX = new SoundEngine();
