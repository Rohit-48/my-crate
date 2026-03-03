use crate::parser::ParsedNote;
use rusqlite::{Connection, Result, params};

pub fn init(db_path: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    create_tables(&conn)?;
    Ok(conn)
}

fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "\
            CREATE TABLE IF NOT EXIST notes(
                slug            TEXT PRIMARY KEY,
                title           TEXT NOT NULL,
                description     TEXT,
                raw_md      TEXT NOT NULL,
                html        TEXT NOT NULL,
                tags        TEXT NOT NULL,
                toc         TEXT NOT NULL,
                has_taken   INTEGER NOT NULL,
                formatter   TEXT NOT NULL
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
    ",
    )?;
    Ok(())
}
