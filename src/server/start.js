import { buildApp } from "./app.js";
import fastifyStatic from "@fastify/static";
import path from "node:path";
try {
  process.loadEnvFile();
} catch {}
try {
  const app = await buildApp();
  await app.register(fastifyStatic, {
    root: path.resolve("dist"),
    wildcard: false,
  });
  app.get("/", (req, reply) => reply.sendFile("index.html"));
  await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT) || 3000 });
  console.log("Server aplikasi siap.");
} catch {
  console.error("Server gagal dimulai. Periksa DATABASE_URL dan hasil build.");
  process.exitCode = 1;
}
