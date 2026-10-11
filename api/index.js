import { buildApp } from "../src/server/app.js";
export function createVercelHandler(getApp = () => buildApp()) {
  let ready;
  return async function handler(req, res) {
    try {
      const app = await (ready ??= getApp());
      await app.ready();
      app.server.emit("request", req, res);
    } catch {
      ready = null;
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(
        JSON.stringify({
          error: {
            code: "SERVER_CONFIG",
            message: "Layanan database belum dikonfigurasi.",
          },
        }),
      );
    }
  };
}
export default createVercelHandler();
