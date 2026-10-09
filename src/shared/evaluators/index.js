const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function initialState(m) {
  return {
    selected: [],
    placements: {},
    sequence: [],
    symbols: {},
    yes: "",
    no: "",
    boundary: 0,
    pos: m.rules.start || [0, 0],
    array: [...(m.rules.initial || [])],
    operations: [],
    read: null,
    step: 0,
    pc: 0,
    ir: "",
    acc: 0,
    output: null,
    pair: 0,
    pass: 0,
    tested: false,
    trace: [],
  };
}
export function applyAction(m, old, a) {
  const s = structuredClone(old),
    r = m.rules;
  const allowed = {
    selection: ["toggle"],
    grouping: ["place"],
    pattern: ["add", "remove", "move"],
    ordering: ["add", "remove", "move"],
    robot: ["direction"],
    flowchart: ["add", "remove", "move", "symbol", "branch", "test"],
    pseudocode: ["add", "remove", "move", "boundary", "test"],
    cpu: ["phase"],
    array: r.operations,
    bubble: ["compare"],
  }[m.kind];
  if (!allowed?.includes(a.op))
    return { state: old, errors: ["Operasi tidak sesuai misi"] };
  let error = "";
  const text = (v) => typeof v === "string" && v.length <= 100;
  switch (a.op) {
    case "toggle":
      if (!Number.isInteger(a.index) || !r.items?.[a.index]) {
        error = "Objek tidak valid";
        break;
      }
      s.selected = s.selected.includes(a.index)
        ? s.selected.filter((i) => i !== a.index)
        : [...s.selected, a.index];
      break;
    case "place":
      if (!r.items?.[a.index] || !r.groups?.[a.group]) {
        error = "Kategori tidak valid";
        break;
      }
      s.placements[a.index] = a.group;
      break;
    case "symbol":
      if (
        !r.items?.[a.index] ||
        !["Terminator", "Input/output", "Decision", "Process"].includes(a.value)
      ) {
        error = "Simbol tidak valid";
        break;
      }
      s.symbols[a.index] = a.value;
      break;
    case "branch":
      if (
        !["yes", "no"].includes(a.branch) ||
        !["Besar", "Kecil"].includes(a.value)
      ) {
        error = "Cabang tidak valid";
        break;
      }
      s[a.branch] = a.value;
      break;
    case "boundary":
      if (!Number.isInteger(a.value) || Math.abs(a.value) > 1000) {
        error = "Batas tidak valid";
        break;
      }
      s.boundary = a.value;
      break;
    case "add":
      if (
        s.sequence.length >= 30 ||
        (r.items ? !r.items[a.value] : !r.options?.includes(a.value))
      ) {
        error = "Blok tidak valid";
        break;
      }
      s.sequence.push(a.value);
      s.tested = false;
      break;
    case "remove":
      if (
        !Number.isInteger(a.index) ||
        a.index < 0 ||
        a.index >= s.sequence.length
      ) {
        error = "Indeks tidak valid";
        break;
      }
      s.sequence.splice(a.index, 1);
      s.tested = false;
      break;
    case "move": {
      const j = a.index + a.delta;
      if (
        !Number.isInteger(a.index) ||
        ![-1, 1].includes(a.delta) ||
        j < 0 ||
        j >= s.sequence.length
      ) {
        error = "Urutan tidak valid";
        break;
      }
      [s.sequence[a.index], s.sequence[j]] = [
        s.sequence[j],
        s.sequence[a.index],
      ];
      s.tested = false;
      break;
    }
    case "direction": {
      const d = { Atas: [0, -1], Bawah: [0, 1], Kiri: [-1, 0], Kanan: [1, 0] }[
        a.value
      ];
      if (!d) {
        error = "Arah tidak valid";
        break;
      }
      const p = [s.pos[0] + d[0], s.pos[1] + d[1]];
      if (
        p.some((v) => v < 0 || v >= r.size) ||
        r.walls.some((w) => equal(w, p))
      ) {
        error = "Robot menabrak batu atau tepi pulau";
        break;
      }
      s.pos = p;
      s.sequence.push(a.value);
      break;
    }
    case "phase": {
      if (
        m.kind !== "cpu" ||
        s.step >= r.answer.length ||
        a.value !== r.answer[s.step]
      ) {
        error = "Urutan CPU belum tepat: fetch → decode → execute";
        break;
      }
      const ins = r.program[s.pc];
      if (a.value === "Fetch") s.ir = ins;
      if (a.value === "Execute") {
        if (ins.startsWith("LOAD")) s.acc = Number(ins.split(" ")[1]);
        if (ins.startsWith("ADD")) s.acc += Number(ins.split(" ")[1]);
        if (ins === "OUTPUT") s.output = s.acc;
        s.pc++;
      }
      s.step++;
      break;
    }
    case "set":
    case "delete":
    case "read":
    case "append":
      if (m.kind !== "array" || !r.operations.includes(a.op)) {
        error = "Operasi tidak tersedia";
        break;
      }
      if (
        a.op !== "append" &&
        (!Number.isInteger(a.index) || a.index < 0 || a.index >= s.array.length)
      ) {
        error = "Indeks di luar array";
        break;
      }
      if (["set", "append"].includes(a.op) && !text(a.value)) {
        error = "Isi elemen tidak valid";
        break;
      }
      if (a.op === "set") s.array[a.index] = a.value.trim();
      if (a.op === "delete") s.array.splice(a.index, 1);
      if (a.op === "append") {
        if (s.array.length >= 20) {
          error = "Array penuh";
          break;
        }
        s.array.push(a.value.trim());
      }
      if (a.op === "read") s.read = { index: a.index, value: s.array[a.index] };
      s.operations.push(a.op);
      break;
    case "compare": {
      if (m.kind !== "bubble" || s.pass >= s.array.length - 1) {
        error = "Pengurutan sudah selesai";
        break;
      }
      const needs = s.array[s.pair] > s.array[s.pair + 1];
      if (typeof a.swap !== "boolean" || a.swap !== needs) {
        error = needs
          ? "Pasangan ini perlu ditukar."
          : "Pasangan ini sudah terurut; jangan ditukar.";
        break;
      }
      if (a.swap)
        [s.array[s.pair], s.array[s.pair + 1]] = [
          s.array[s.pair + 1],
          s.array[s.pair],
        ];
      s.pair++;
      if (s.pair >= s.array.length - 1 - s.pass) {
        s.pass++;
        s.pair = 0;
      }
      break;
    }
    case "test":
      s.tested = true;
      break;
    default:
      error = "Tindakan tidak dikenal";
  }
  if (error) return { state: old, errors: [error] };
  s.trace.push({ op: a.op, ...a });
  return { state: s, errors: [] };
}
export function evaluate(m, s) {
  const r = m.rules;
  let checks = [];
  switch (m.kind) {
    case "selection":
      checks = r.items.map(
        (_, i) => s.selected.includes(i) === r.answer.includes(i),
      );
      break;
    case "grouping":
      checks = r.answer.map((v, i) => s.placements[i] === v);
      break;
    case "pattern":
    case "ordering":
      checks = r.answer.map((v, i) => s.sequence[i] === v);
      checks.push(s.sequence.length === r.answer.length);
      break;
    case "robot":
      checks = [equal(s.pos, r.goal)];
      break;
    case "flowchart":
      checks = [
        ...r.answer.map((v, i) => s.sequence[i] === v),
        ...r.symbols.map((v, i) => s.symbols[i] === v),
        s.yes === r.yes,
        s.no === r.no,
        s.tested,
        s.sequence.length === r.answer.length,
      ];
      break;
    case "pseudocode":
      checks = [
        ...r.answer.map((v, i) => s.sequence[i] === v),
        s.sequence.length === r.answer.length,
        s.tested,
      ];
      if (r.operation === "classify") checks.push(s.boundary === r.boundary);
      break;
    case "cpu":
      checks = [s.step === r.answer.length, s.output === 7];
      break;
    case "array":
      checks = [
        ...r.answer.map((v, i) => s.array[i] === v),
        s.array.length === r.answer.length,
        ...r.operations.map((op) => s.operations.includes(op)),
      ];
      if (r.readIndex !== undefined)
        checks.push(
          s.read?.index === r.readIndex &&
            s.read?.value === r.answer[r.readIndex],
        );
      break;
    case "bubble":
      checks = [equal(s.array, r.answer), s.pass === s.array.length - 1];
      break;
  }
  const accuracy = Math.round(
    (100 * checks.filter(Boolean).length) / (checks.length || 1),
  );
  return {
    complete: checks.length > 0 && checks.every(Boolean),
    accuracy,
    errors: checks.every(Boolean) ? [] : ["Tujuan belum tercapai"],
    feedback: checks.every(Boolean)
      ? "Sistem pulau berhasil dipulihkan!"
      : "Masih ada bagian yang belum sesuai. Periksa tujuan dan jejak tindakan.",
  };
}
export function runProgram(blocks, input) {
  if (!Array.isArray(blocks) || blocks.length > 1000)
    return { output: null, trace: [], errors: ["Batas langkah terlampaui"] };
  let value = input;
  const trace = [];
  for (const b of blocks) {
    if (b === "double") value *= 2;
    else if (b !== "input" && b !== "output")
      return { output: null, trace, errors: ["Instruksi tidak dikenal"] };
    trace.push(value);
  }
  return { output: value, trace, errors: [] };
}
