// Deliberately bounded Python teaching subset; never eval/Function or execute host code.
export function runPython(source, inputs = {}) {
  const vars = Object.create(null),
    outputs = [],
    trace = [];
  let steps = 0;
  function finite(v) {
    if (typeof v === "number" && !Number.isFinite(v))
      throw Error("Hasil angka terlalu besar");
    if (Array.isArray(v)) {
      if (v.length > 50) throw Error("Maksimal 50 elemen list");
      for (const item of v) scalar(item);
    }
    return v;
  }
  function scalar(v) {
    if (Array.isArray(v)) throw Error("Latihan ini memakai list satu dimensi");
    return finite(v);
  }
  function expr(text) {
    const tokens =
      text.match(
        /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+(?:\.\d+)?|[A-Za-z_]\w*|[+\-*/()[\],]/g,
      ) || [];
    if (tokens.join("").replace(/\s/g, "") !== text.replace(/\s/g, ""))
      throw Error("Ekspresi belum didukung");
    let i = 0;
    function atom() {
      if (++steps > 3000) throw Error("Program terlalu panjang");
      let t = tokens[i++],
        v;
      if (t === "-") return -atom();
      if (t === "(") {
        v = calc();
        if (tokens[i++] !== ")") throw Error("Kurung belum ditutup");
      } else if (t === "[") {
        v = [];
        if (tokens[i] !== "]") {
          do {
            v.push(calc());
            if (tokens[i] !== ",") break;
            i++;
          } while (tokens[i] !== "]");
        }
        if (tokens[i++] !== "]") throw Error("List belum ditutup");
      } else if (/^\d/.test(t || "")) v = Number(t);
      else if (/^['"]/.test(t || "")) v = t.slice(1, -1);
      else if (["sum", "len"].includes(t) && tokens[i] === "(") {
        i++;
        const arr = calc();
        if (tokens[i++] !== ")" || !Array.isArray(arr))
          throw Error("sum/len membutuhkan list");
        if (t === "sum" && !arr.every((x) => typeof x === "number"))
          throw Error("sum membutuhkan angka");
        v = t === "sum" ? arr.reduce((a, b) => a + b, 0) : arr.length;
      } else if (t && Object.hasOwn(vars, t)) v = vars[t];
      else throw Error(`Variabel ${t || ""} belum tersedia`);
      while (tokens[i] === "[") {
        i++;
        const n = calc();
        if (
          tokens[i++] !== "]" ||
          !Array.isArray(v) ||
          !Number.isInteger(n) ||
          n < 0 ||
          n >= v.length
        )
          throw Error("Indeks di luar list");
        v = v[n];
      }
      return v;
    }
    function term() {
      let v = atom();
      while (["*", "/"].includes(tokens[i])) {
        const op = tokens[i++],
          b = atom();
        if (
          typeof v !== "number" ||
          typeof b !== "number" ||
          (op === "/" && b === 0)
        )
          throw Error("Operasi angka tidak valid");
        v = op === "*" ? v * b : v / b;
      }
      return v;
    }
    function calc() {
      let v = term();
      while (["+", "-"].includes(tokens[i])) {
        const op = tokens[i++],
          b = term();
        if (typeof v !== "number" || typeof b !== "number")
          throw Error("Gunakan angka untuk operasi");
        v = op === "+" ? v + b : v - b;
      }
      return v;
    }
    const v = finite(calc());
    if (i !== tokens.length) throw Error("Periksa sintaks ekspresi");
    return v;
  }
  try {
    if (typeof source !== "string" || source.length > 6000)
      throw Error("Kode terlalu panjang");
    const lines = source.split("\n");
    if (lines.length > 80) throw Error("Maksimal 80 baris");
    const assigned = new Set();
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue;
      let m;
      if ((m = line.match(/^print\((.*)\)$/)))
        outputs.push(structuredClone(expr(m[1])));
      else if ((m = line.match(/^(\w+)\.(append|pop)\((.*)\)$/))) {
        const a = vars[m[1]];
        if (!Array.isArray(a)) throw Error("Objek bukan list");
        if (m[2] === "append") {
          if (a.length >= 50) throw Error("List terlalu panjang");
          a.push(scalar(expr(m[3])));
        } else {
          const idx = m[3] ? expr(m[3]) : a.length - 1;
          if (!Number.isInteger(idx) || idx < 0 || idx >= a.length)
            throw Error("Indeks di luar list");
          a.splice(idx, 1);
        }
      } else if ((m = line.match(/^(\w+)\[(.+)\]\s*=\s*(.+)$/))) {
        const a = vars[m[1]],
          idx = expr(m[2]);
        if (
          !Array.isArray(a) ||
          !Number.isInteger(idx) ||
          idx < 0 ||
          idx >= a.length
        )
          throw Error("Indeks di luar list");
        a[idx] = scalar(expr(m[3]));
      } else if ((m = line.match(/^(\w+)\s*=\s*(.+)$/))) {
        const key = m[1];
        const value = expr(m[2]);
        vars[key] =
          !assigned.has(key) && Object.hasOwn(inputs, key)
            ? structuredClone(finite(inputs[key]))
            : value;
        assigned.add(key);
      } else
        throw Error(
          "Gunakan assignment, list, sum, len, append, pop, atau print pada latihan ini",
        );
      trace.push({ line, variables: structuredClone(vars) });
    }
    return { ok: true, outputs, trace, variables: vars };
  } catch (e) {
    return { ok: false, error: e.message, outputs, trace };
  }
}
