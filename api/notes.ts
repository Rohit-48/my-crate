import { Hono } from "hono";
import db from "./db";
import { error } from "console";

const notes = new Hono();

notes.get("/", (c)=>{
  const rows = db.prepare(`
    SELECT slug, title, description, tags, has_latex
    FROM notes
    `).all();

    return c.json(rows.map((row: any) => ({
    ...row,
    tags: JSON.parse(row.tags),
  })));
});

notes.get("/:slug", (c) => {
  const slug = c.req.param("slug");

  const note = db.prepare(`
    SELECT * FROM notes WHERE slug = ?
    `).get(slug);

    if(!note) return c.json({error: "note not found"}, 404);

    const n = note as any;
    return c.json({
      ...n,
      tags: JSON.parse(n.tags),
      toc: JSON.parse(n.toc),
      formatter: JSON.parse(n.formatter),
    });
});

notes.get("/:slug/backlinks", (c) => {
  const slug = c.req.param("slug");

  const backlinks = db.prepare(`
    SELECT n.slug, n.title
    FROM notes n 
    JOIN links l ON n.slug = l.source_slug
    WHERE l.target_slug  = ?
    `).all(slug);

    return c.json(backlinks);
});

export default notes;