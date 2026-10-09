export function createProgressStore(storage, id) {
  const key = `pulau:progress:v1:${id}`;
  return {
    load() {
      const raw = storage.getItem(key);
      if (!raw) return { participantId: id, sessions: [] };
      let p;
      try {
        p = JSON.parse(raw);
      } catch {
        throw Error("Data lokal rusak; jangan hapus sebelum mencadangkan.");
      }
      if (p.participantId !== id || !Array.isArray(p.sessions))
        throw Error("Data lokal tidak valid");
      return p;
    },
    save(p) {
      storage.setItem(key, JSON.stringify({ ...p, participantId: id }));
    },
    clear() {
      storage.removeItem(key);
    },
  };
}
