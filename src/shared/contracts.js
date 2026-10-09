export function validateEvent(e) {
  if (
    !e ||
    typeof e.id !== "string" ||
    typeof e.sessionId !== "string" ||
    !Number.isInteger(e.seq) ||
    e.seq < 1 ||
    !["action", "submit", "run", "hint", "reset", "checkpoint"].includes(
      e.type,
    ) ||
    !Number.isFinite(e.activeMs) ||
    e.activeMs < 0 ||
    !e.payload ||
    typeof e.payload !== "object"
  )
    throw new Error("Event tidak valid");
  return e;
}
export function canonicalJson(value) {
  if (Array.isArray(value))
    return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonicalJson(value[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
