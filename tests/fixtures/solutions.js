export function solution(m) {
  const r = m.rules;
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
