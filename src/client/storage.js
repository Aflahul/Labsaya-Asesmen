export function createProgressStore(storage, id) {
  const key = `pulau:progress:v1:${id}`;
  let blocked = false,
    expectedRaw = storage.getItem(key);
  return {
    raw() {
      return storage.getItem(key);
    },
    load() {
      const raw = storage.getItem(key);
      expectedRaw = raw;
      if (!raw) return { participantId: id, sessions: [] };
      let p;
      try {
        p = JSON.parse(raw);
        if (p.participantId !== id || !Array.isArray(p.sessions)) throw Error();
      } catch {
        blocked = true;
        throw Error(
          "Data lokal rusak. Penulisan dihentikan; unduh data asli dari Pengaturan sebelum pemulihan.",
        );
      }
      return p;
    },
    save(p) {
      if (storage.getItem(key) !== expectedRaw) {
        blocked = true;
        throw Error("Cache berubah di luar sesi ini; data asli dipertahankan.");
      }
      if (blocked)
        throw Error(
          "Cache rusak dipertahankan; pulihkan cadangan atau hapus cache dengan konfirmasi.",
        );
      const next = JSON.stringify({ ...p, participantId: id });
      storage.setItem(key, next);
      expectedRaw = next;
    },
    allowReplace() {
      blocked = false;
      expectedRaw = storage.getItem(key);
    },
    clear() {
      storage.removeItem(key);
      expectedRaw = null;
      blocked = false;
    },
  };
}
