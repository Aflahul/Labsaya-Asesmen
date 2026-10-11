// Measure the same grid that lays out the islands, including responsive reflow.
export function connectIslands(grid) {
  const svg = grid.querySelector(".map-links");
  const cards = [...grid.querySelectorAll(".island-card")];
  const draw = () => {
    const bounds = grid.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    const points = cards.map((card) => {
      const art = card.querySelector(".island-art");
      // offset geometry excludes the decorative floating transform.
      return {
        x: card.offsetLeft + art.offsetLeft + art.offsetWidth / 2,
        y: card.offsetTop + art.offsetTop + art.offsetHeight / 2,
      };
    });
    svg
      .querySelector("path")
      .setAttribute(
        "d",
        points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" "),
      );
  };
  const observer = new ResizeObserver(draw);
  observer.observe(grid);
  cards.forEach((card) => observer.observe(card));
  draw();
  return () => observer.disconnect();
}
