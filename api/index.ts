import { Hono } from "hono";
import { cors } from "hono/cors";
import notes from "./routes/notes";
import graph from "./routes/graph";
import search from "./routes/search";
import tags from "./routes/tags";

const app = new Hono();

app.use("/*", cors());
app.get("/", (c) => c.json({ status: "ok" }));
app.route("/api/notes", notes);
app.route("/api/graph", graph);
app.route("/api/tags", tags);
app.route("/api/search", search);

export default {
      port: process.env.PORT ?? 3001,
      fetch: app.fetch,
};
