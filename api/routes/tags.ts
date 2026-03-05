import { Hono } from "hono";
import db from "../db";

const tags = new Hono();

tags.get("/", (c) => {
  const rows = db.prepare(`
    SELECT tag, COUNT(*) as count
    FROM tags
    GROUP BY tag
    ORDER BY count DESC
    `).all();
    return c.json(rows);
});

tags.get("/:tag", (c) => {
  const tag = c.req.param("tag");
  const notes = db.prepare(`
    SELECT n.slug, n.title, n.description, n.tags
    FROM notes n
    JOIN tags t ON n.slug = t.note_slug
    WHERE t.tag = ?
    `).all(tag);

    return c.json(notes.map((n:any) => ({
      ...n,
      tags: JSON.parse(n.tags),
    })));
});

export default tags;