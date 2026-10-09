export function createActiveTimer({
  now = () => performance.now(),
  onCheckpoint = () => {},
} = {}) {
  let total = 0,
    since = null;
  return {
    start() {
      if (since === null) since = now();
    },
    pause() {
      if (since !== null) {
        total += now() - since;
        since = null;
      }
      onCheckpoint(total);
    },
    readMs() {
      return Math.round(total + (since === null ? 0 : now() - since));
    },
    set(ms) {
      total = ms;
      since = null;
    },
    dispose() {
      this.pause();
    },
  };
}
