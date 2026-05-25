mod db;
mod indexer;
mod parser;
mod media;

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
    
    // collect all media: videos and images across all notes in short FETCH
    let all_images: Vec<String> = notes.iter().flat_map(|n| n.images.clone()).collect();
    let all_videos: Vec<String> = notes.iter().flat_map(|n| n.videos.clone()).collect();

    // processing of media
    if !all_images.is_empty(){
        println!("processing {} images...", all_images.len());
        media::process_images(&args.vault, &all_images).expect("Images Processing Failed");
    }
    if !all_videos.is_empty(){
        println!("processing {}", all_videos.len());
        media::process_videos(&args.vault, &all_videos).expect("Video Processing Failed")
    }
    let conn = db::init(args.db.to_str().unwrap()).expect("failed to open db");
    db::write_all(&conn, &notes).expect("Failed to write to db");

    println!("Done. {} notes written to db choom!", notes.len());

}

