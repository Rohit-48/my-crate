import { Hono } from "hono";
import { cors } from "hono/cors";
import notes from "./routes/notes";

const app = new Hono();

app.use("/*", cors());
app.get("/", (c) => c.json({ status: "ok" }));
app.route("/api/notes", notes);

export default {
  port: process.env.PORT ?? 3001,
  fetch: app.fetch,
};