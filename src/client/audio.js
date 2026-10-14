export function createAudio() {
  let ctx,
    muted = localStorage.getItem("pulau:mute") === "true",
    music,
    unlocked = false;
  const storedVolume = Number(localStorage.getItem('pulau:music-volume') ?? 0.12);
  let musicVolume = Number.isFinite(storedVolume) ? Math.max(0, Math.min(0.3, storedVolume)) : 0.12;
  function updateMusic() {
    if (!unlocked || !music) return;
    music.volume = musicVolume;
    if (muted || document.hidden || musicVolume === 0) music.pause();
    else music.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', updateMusic);
  return {
    get muted() {
      return muted;
    },
    unlock() {
      unlocked = true;
      if (!music) {
        music = new Audio('https://opengameart.org/sites/default/files/asami_main_loop_b.mp3');
        music.id = 'background-music';
        music.hidden = true;
        document.body.append(music);
        music.loop = true;
        music.preload = 'none';
      }
      updateMusic();
      try {
        ctx ??= new AudioContext();
        ctx.resume();
      } catch {}
    },
    setMuted(v) {
      muted = v;
      localStorage.setItem("pulau:mute", String(v));
      updateMusic();
    },
    get musicVolume() {
      return musicVolume;
    },
    setMusicVolume(value) {
      if (!Number.isFinite(value)) return;
      musicVolume = Math.max(0, Math.min(0.3, value));
      localStorage.setItem('pulau:music-volume', String(musicVolume));
      updateMusic();
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
