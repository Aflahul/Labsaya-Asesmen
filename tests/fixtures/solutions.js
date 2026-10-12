export function solution(m) {
  const r = m.rules;
  if (m.id === "v2p05m04") {
    const answers = {
      design: "Masukan: paket integer, berat float, energi integer, disetujui Boolean. Kebutuhan energi integer. Keluaran: kebutuhan energi dan keputusan string; alasan penundaan atau pesan kesalahan string.",
      solution: "INPUT paket, berat, energi, disetujui. Jika paket < 0 atau berat < 0 atau energi < 0, tampilkan Data tidak valid dan berhenti. Hitung kebutuhan = paket * 2 dan tampilkan kebutuhan. Jika berat <= 10 dan energi >= kebutuhan dan disetujui, tampilkan Berangkat. Selain itu tampilkan Tunda dan semua alasan yang gagal: berat melebihi 10, energi kurang, atau belum disetujui.",
      tests: "A: kebutuhan 12, Berangkat karena berat tepat 10 dan energi tepat cukup. B: kebutuhan 12, Tunda karena energi 10 kurang dari 12. C: kebutuhan 8, Tunda karena berat 11 melebihi 10 dan belum disetujui. D: Data tidak valid; tidak menghitung energi atau menentukan keputusan.",
      reason: "Validasi lebih dahulu agar angka negatif tidak dihitung. Kebutuhan energi harus dihitung sebelum dibandingkan dengan energi tersedia. Berat tepat 10 dan energi tepat cukup diterima. Saya menampilkan semua alasan agar Nara dapat memperbaiki semua masalah sebelum memeriksa ulang.",
    };
    return Object.entries(answers).map(([key, value]) => ({ op: "answer", key, value }));
  }
  if (m.missionVersion === 2)
    return [
      ...Object.entries(r.answers).map(([key, value]) => ({
        op: "answer",
        key,
        value,
      })),
      ...(m.code
        ? [
            {
              op: "answer",
              key: "code",
              value:
                m.kind === "python"
                  ? m.code.replace("/ 4", "/ len(nilai)")
                  : m.code.replace("pop(1)", "pop(2)"),
            },
          ]
        : []),
      ...(m.written
        ? m.written.map(([key]) => ({
            op: "answer",
            key,
            value:
              "Solusi B. Bukti lima nilai 80, tiga nilai 80, kosong menampilkan pesan. Rancangan dan pengujian dijelaskan.",
          }))
        : []),
    ];
  switch (m.kind) {
    case "selection":
      return r.answer.map((index) => ({ op: "toggle", index }));
    case "grouping":
      return r.answer.map((group, index) => ({ op: "place", group, index }));
    case "pattern":
    case "ordering":
      return r.answer.map((value) => ({ op: "add", value }));
    case "robot":
      return r.answer.map((value) => ({ op: "direction", value }));
    case "flowchart":
      return [
        ...r.answer.map((value) => ({ op: "add", value })),
        ...r.symbols.map((value, index) => ({ op: "symbol", value, index })),
        { op: "branch", branch: "yes", value: r.yes },
        { op: "branch", branch: "no", value: r.no },
        { op: "test" },
      ];
    case "pseudocode":
      return [
        ...r.answer.map((value) => ({ op: "add", value })),
        ...(r.boundary ? [{ op: "boundary", value: r.boundary }] : []),
        { op: "test" },
      ];
    case "cpu":
      return r.answer.map((value) => ({ op: "phase", value }));
    case "array":
      return r.readIndex !== undefined
        ? [
            { op: "set", index: 0, value: "A" },
            { op: "set", index: 2, value: "C" },
            { op: "read", index: 1 },
          ]
        : [
            { op: "set", index: 1, value: "Air" },
            { op: "delete", index: 2 },
            { op: "append", value: "Obat" },
          ];
    case "bubble": {
      let x = [...r.initial],
        actions = [];
      for (let p = 0; p < x.length - 1; p++)
        for (let i = 0; i < x.length - 1 - p; i++) {
          const swap = x[i] > x[i + 1];
          actions.push({ op: "compare", swap });
          if (swap) [x[i], x[i + 1]] = [x[i + 1], x[i]];
        }
      return actions;
    }
  }
}
