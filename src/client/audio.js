export function createAudio() {
  let ctx,
    muted = localStorage.getItem("pulau:mute") === "true";
  return {
    get muted() {
      return muted;
    },
    unlock() {
      try {
        ctx ??= new AudioContext();
        ctx.resume();
      } catch {}
    },
    setMuted(v) {
      muted = v;
      localStorage.setItem("pulau:mute", String(v));
    },
    play(type) {
      if (muted || !ctx) return;
      const notes = {
        click: [330],
        move: [440],
        wrong: [220, 196],
        right: [523, 659],
        success: [523, 659, 784],
        portal: [392, 523, 784],
        travel: [196, 294],
        level: [523, 659, 784, 1047],
      }[type] || [440];
      notes.forEach((hz, i) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain(),
          t = ctx.currentTime + i * 0.12;
        o.type = "sine";
        o.frequency.value = hz;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.035, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.23);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.25);
      });
    },
  };
}
