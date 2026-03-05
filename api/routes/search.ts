import { Hono } from "hono";
import db from "../db";
import tags from "./tags";

const search = new Hono();

search.get("/", (c) => {
  const notes = db.prepare(`
    SELECT slug, title, description, tags, raw_md
    FROM notes
  `).all() as any[];

  return c.json(notes.map((n) => ({
    ...n,
    tags: JSON.parse(n.tags),
  })));
});

export default search;