import { Hono } from "hono";
import db from "../db"

const graph = new Hono();

graph.get("/", (c) => {
  const notes = db.prepare(`SELECT slug, title FROM notes`).all();
  const links = db.prepare(`SELECT source_slug, target_slug, is_embed FROM links`).all();


  return c.json({
    nodes : notes,
    edges: links,
 });
});

export default graph;