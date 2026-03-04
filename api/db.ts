import Database from "better-sqlite3";
import path from "path"

const DB_PATH = path.resolve(process.env.DB_PATH ?? "../data/notes.db");

const db = new Database(DB_PATH, {readonly:true}); //  the API only reads. Only the Rust indexer write no conflicts chillus!!

export default db
