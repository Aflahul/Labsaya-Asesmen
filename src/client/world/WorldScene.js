import Phaser from "phaser";
const colors = [
  0x86cfb6, 0xefc777, 0xb4abd9, 0x8ec9dc, 0x92b8eb, 0xe1aa80, 0xa9d0d9,
  0xc1d38e, 0xdba5c7,
];
export function createWorld(container) {
  let scene,
    done,
    travelTween,
    reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
    low = false;
  class World extends Phaser.Scene {
    create() {
      scene = this;
      this.points = [];
      const w = this.scale.width,
        h = this.scale.height;
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x132c46, 0x213e54, 0x4b7485, 0x718d98, 1);
      bg.fillRect(0, 0, w, h);
      this.add.circle(w * 0.77, h * 0.23, 75, 0xf3dfb0, 0.1);
      this.add.circle(w * 0.77, h * 0.23, 48, 0xffedc0, 0.12);
      const stars = this.add.graphics();
      for (let i = 0; i < 60; i++) {
        stars.fillStyle(0xffffff, 0.15 + (i % 4) / 12);
        stars.fillCircle(
          (i * 131) % w,
          (i * 71) % (h * 0.65),
          i % 3 === 0 ? 1.5 : 1,
        );
      }
      this.clouds = [];
      for (let i = 0; i < 10; i++) {
        const cloud = this.add.container(
          (i * 187) % w,
          h * (0.15 + (i % 4) * 0.2),
        );
        for (let j = 0; j < 5; j++)
          cloud.add(
            this.add.ellipse(
              j * 45,
              Math.sin(j) * 12,
              110,
              30,
              0xf4f5e8,
              0.045,
            ),
          );
        this.clouds.push(cloud);
      }
      const links = this.add.graphics();
      for (let i = 0; i < 9; i++) {
        const col = i % 3,
          row = Math.floor(i / 3);
        const x = w * (0.18 + col * 0.32) + (row === 1 ? -w * 0.07 : 0),
          y = h * (0.32 + row * 0.23);
        this.points.push({ x, y });
        if (i) {
          const p = this.points[i - 1];
          links.lineStyle(1, 0xb5d9d7, 0.2);
          links.lineBetween(p.x, p.y, x, y);
        }
      }
      this.islands = [];
      for (let i = 0; i < 9; i++) {
        const { x, y } = this.points[i];
        this.islands.push(this.drawIsland(x, y, i));
      }
      const t = this.add.graphics();
      const tx = w * 0.78,
        ty = h * 0.16;
      t.fillStyle(0xb3ced4, 0.35);
      t.fillTriangle(tx - 22, ty + 30, tx + 22, ty + 30, tx, ty - 64);
      t.fillStyle(0xe3d4a6, 0.5);
      t.fillRect(tx - 9, ty - 20, 18, 45);
      t.lineStyle(1, 0xe5dcb7, 0.6);
      t.strokeTriangle(tx - 22, ty + 30, tx + 22, ty + 30, tx, ty - 64);
      this.add
        .text(tx, ty + 44, "MENARA AWAN", {
          fontFamily: "Georgia",
          fontSize: "11px",
          color: "#d4e3dc",
          letterSpacing: 3,
        })
        .setOrigin(0.5);
      this.ship = this.add.container(this.points[0].x, this.points[0].y - 74);
      this.ship.add(this.add.ellipse(0, 0, 25, 12, 0xf5d093));
      this.ship.add(this.add.triangle(0, -9, 0, 0, 15, 8, 0, 15, 0xf4efe1));
      this.tweens.add({
        targets: this.ship,
        y: this.ship.y - 7,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
    drawIsland(x, y, i) {
      const c = this.add.container(x, y),
        g = this.add.graphics();
      const size = Math.min(105, this.scale.width / 8);
      g.fillStyle(0x244458);
      g.fillTriangle(-size, -2, size, -2, 12, size * 0.85);
      g.fillStyle(0x365768);
      g.fillTriangle(-size, -2, 12, size * 0.85, -size * 0.3, size * 0.55);
      g.fillStyle(0x1d364c);
      g.fillTriangle(size, -2, 12, size * 0.85, size * 0.47, size * 0.37);
      g.fillStyle(colors[i], 0.85);
      g.fillEllipse(0, -5, size * 2, 53);
      g.fillStyle(0xd6e7c2, 0.18);
      g.fillEllipse(-15, -11, size * 1.6, 25);
      c.add(g);
      const buildings = this.add.graphics();
      buildings.fillStyle(0xe6dfc0, 0.9);
      buildings.fillRect(-23, -55, 40, 45);
      buildings.fillStyle(0x6d8a92);
      buildings.fillTriangle(-30, -55, 23, -55, -5, -81);
      buildings.fillStyle(0x233f50);
      buildings.fillRect(-6, -31, 11, 21);
      for (let k = 0; k < 3; k++) {
        buildings.fillStyle(i === 6 ? 0x9ee3e4 : 0xf9d58a, 0.7);
        buildings.fillRect(-16 + k * 12, -45, 6, 9);
      }
      if (i === 0 || i === 7) {
        buildings.fillStyle(0xa97855);
        buildings.fillRect(28, -28, 20, 19);
        buildings.fillRect(44, -42, 16, 29);
      }
      if (i === 1 || i === 5) {
        buildings.lineStyle(4, 0xe4cb95);
        buildings.strokeCircle(34, -31, 16);
        buildings.lineBetween(18, -31, 50, -31);
        buildings.lineBetween(34, -47, 34, -15);
      }
      if (i === 6) {
        buildings.lineStyle(2, 0x9fefde, 0.7);
        buildings.lineBetween(-60, -17, -30, -17);
        buildings.lineBetween(20, -17, 62, -17);
      }
      c.add(buildings);
      for (let j = 0; j < 3; j++) {
        const tree = this.add.graphics(),
          px = -size * 0.65 + j * size * 0.25;
        tree.fillStyle(0x475e4c);
        tree.fillRect(px, -34, 4, 23);
        tree.fillStyle(0x426f62);
        tree.fillTriangle(px - 13, -27, px + 16, -27, px + 2, -60);
        tree.fillStyle(0x628e70);
        tree.fillTriangle(px - 10, -38, px + 12, -38, px + 1, -69);
        c.add(tree);
      }
      this.tweens.add({
        targets: c,
        y: y - 5,
        duration: 2000 + i * 113,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      return c;
    }
    update(time, delta) {
      if (reduced) return;
      this.clouds?.forEach((c, i) => {
        c.x += delta * (low ? 0.002 : 0.007) * (1 + (i % 3));
        if (c.x > this.scale.width + 150) c.x = -220;
      });
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: container.clientWidth,
    height: container.clientHeight,
    transparent: true,
    scene: World,
    render: { antialias: true },
    audio: { noAudio: true },
  });
  const api = {
    travelTo(id) {
      api.skip();
      return new Promise((resolve) => {
        done = resolve;
        const wait = () => {
          if (!scene?.points) {
            setTimeout(wait, 50);
            return;
          }
          const p = scene.points[id - 1];
          scene.cameras.main.pan(
            p.x,
            p.y,
            reduced ? 0 : 1900,
            "Sine.easeInOut",
          );
          scene.cameras.main.zoomTo(
            reduced ? 1 : 1.6,
            reduced ? 0 : 1900,
            "Sine.easeInOut",
          );
          travelTween = scene.tweens.add({
            targets: scene.ship,
            x: p.x,
            y: p.y - 74,
            duration: reduced ? 20 : 1900,
            ease: "Sine.inOut",
            onComplete: () => api.skip(),
          });
        };
        wait();
      });
    },
    skip() {
      travelTween?.stop();
      travelTween = null;
      if (done) {
        const resolve = done;
        done = null;
        resolve();
      }
    },
    reset() {
      if (scene) {
        scene.cameras.main.setZoom(1);
        scene.cameras.main.centerOn(
          game.scale.width / 2,
          game.scale.height / 2,
        );
      }
    },
    setReducedMotion(v) {
      reduced = v;
      if (v) api.skip();
    },
    setQuality(v) {
      low = v === "low";
    },
    islandRecovered(id) {
      const c = scene?.islands[id - 1];
      if (c) {
        c.setAlpha(1);
        const p = scene.points[id - 1];
        scene.add.circle(p.x, p.y - 55, 10, 0xf9df88, 0.6);
      }
    },
    destroy() {
      api.skip();
      game.destroy(true);
    },
  };
  return api;
}
