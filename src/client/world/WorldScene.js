// Scenic layers stay separate from keyboard-accessible mission controls.
export function createWorld(container) {
  container.setAttribute("aria-hidden", "true");
  container.innerHTML =
    '<div class="world-backdrop"></div><img class="world-clouds" src="/game-assets/world-cloud-far.webp" alt=""><img class="arrival-island" alt=""><img class="travel-ship" src="/game-assets/prop-airship.webp" alt="">';
  const background = container.querySelector(".world-backdrop"),
    island = container.querySelector(".arrival-island");
  let done, timeout;
  const api = {
    setScene(slug) {
      background.style.backgroundImage = `url("/game-assets/${slug === "ending" ? "ending-network-restored" : slug ? "scene-" + slug : "world-sky"}.webp")`;
    },
    reset() {
      api.setScene();
    },
    travelTo(slug, kind = "enter") {
      api.skip();
      const flying = kind === "enter" || kind === "island";
      api.setScene(flying ? null : slug);
      if (flying) island.src = `/game-assets/island-${slug}.webp`;
      container.dataset.transition = kind;
      container.classList.add("travelling");
      return new Promise((resolve) => {
        done = () => {
          api.setScene(slug);
          resolve();
        };
        timeout = setTimeout(
          api.skip,
          document.body.classList.contains("reduced-motion") ||
            document.body.classList.contains("low-effects")
            ? 20
            : kind === "island"
              ? 4200
              : kind === "enter"
                ? 3000
                : kind === "boss"
                  ? 2200
                  : 900,
        );
      });
    },
    skip() {
      clearTimeout(timeout);
      container.classList.remove("travelling");
      delete container.dataset.transition;
      const resolve = done;
      done = null;
      resolve?.();
    },
    setReducedMotion(v) {
      document.body.classList.toggle("reduced-motion", v);
      if (v) api.skip();
    },
    setQuality(v) {
      document.body.classList.toggle("low-effects", v === "low");
    },
    islandRecovered() {},
    destroy() {
      api.skip();
      container.replaceChildren();
    },
  };
  api.reset();
  api.setReducedMotion(matchMedia("(prefers-reduced-motion: reduce)").matches);
  return api;
}
