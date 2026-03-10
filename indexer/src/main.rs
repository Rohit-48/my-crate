mod db;
mod indexer;
mod parser;

use clap::Parser;
use std::path::PathBuf;


#[derive(Debug, Parser)]
#[command(author, version, about = "Vault Indexer")]
pub struct CliArgs{
    #[arg(long, help = "Path to the Vault")]
    pub vault: PathBuf,
    #[arg(long, help = "Path to SQLite DB")]
    pub db: PathBuf,
}
fn main() {
    let args = CliArgs::parse();

    println!("Indexing Vault: {:?}", args.vault);

    let notes = indexer::run(&args.vault);
    println!("parsed {} notes", notes.len());

    let conn = db::init(args.db.to_str().unwrap()).expect("failed to open db");
    db::write_all(&conn, &notes).expect("Failed to write to db");

    println!("Done. {} notes written to db choom!", notes.len());

}

