import { Hono } from 'hono'
import { cors } from "hono/cors";
import { startTime } from 'hono/timing';


const app = new Hono()

app.use("/*", cors());

app.get("/", (c) => c.json({status: "Dandy"}));

export default {
  port: process.env.PORT ?? 3001,
  fetch: app.fetch
};