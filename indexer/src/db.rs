use crate::parser::ParsedNote;
use rusqlite::{Connection, Result, params};

pub fn init(db_path: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    create_tables(&conn)?;
    Ok(conn)
}

fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS notes (
            slug        TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            description TEXT,
            raw_md      TEXT NOT NULL,
            html        TEXT NOT NULL,
            tags        TEXT NOT NULL,
            toc         TEXT NOT NULL,
            has_latex   INTEGER NOT NULL,
            formatter TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS links (
            source_slug TEXT NOT NULL,
            target_slug TEXT NOT NULL,
            is_embed    INTEGER DEFAULT 0,
            PRIMARY KEY (source_slug, target_slug)
        );

        CREATE TABLE IF NOT EXISTS tags (
            tag         TEXT NOT NULL,
            note_slug   TEXT NOT NULL,
            PRIMARY KEY (tag, note_slug)
        );
    ")?;
    Ok(())
}

pub fn  write_all(conn: &Connection, notes: &[ParsedNote]) -> Result<()> {
    conn.execute_batch("
            DELETE FROM tags;
            DELETE FROM links;
            DELETE FROM notes;"
    )?;
    let tx = conn.unchecked_transaction()?;


    for note in notes {
        let tags_json = serde_json::to_string(&note.tags).unwrap();
        let toc_json = serde_json::to_string(&note.toc).unwrap();
        let formatter_json = serde_json::to_string(&note.formatter).unwrap();

        tx.execute(
            "INSERT OR REPLACE INTO notes\
            (slug, title, description, raw_md, html, tags, toc, has_latex, formatter)\
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                note.slug,
                note.title,
                note.description,
                note.raw_md,
                note.html,
                tags_json,
                toc_json,
                note.has_latex as i32,
                formatter_json,
            ],
        )?;

        for link in &note.links{
            tx.execute(
                "INSERT OR REPLACE INTO links (source_slug, target_slug, is_embed)\
                VALUES (?1, ?2, 0)",
                params![note.slug,link],
            )?;
        }

        for embed in &note.embeds {
            tx.execute(
                "INSERT OR REPLACE INTO links (source_slug, target_slug, is_embed)
                VALUES (?1, ?2, 1)",
                params![note.slug, embed],
            )?;
        }

        for tag in &note.tags{
            tx.execute(
                "INSERT OR REPLACE INTO tags (tag, note_slug) VALUES (?1, ?2)",
                params![tag ,note.slug],
            )?;
        }
    }
    tx.commit()?;
    Ok(())
}
