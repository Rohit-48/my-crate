/* take vault_path
   → walk every .md file recursively
   → call parse_note on each
   → collect into Vec<ParsedNote>
   → return it */


use crate::parser::{parse_note, ParsedNote};
use std::path::Path;
use walkdir::WalkDir;

pub fn run(vault_path: &Path) -> Vec<ParsedNote>{
    let mut notes = Vec::new();

    for entry in WalkDir::new(vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map(|ext| ext == "md").unwrap_or(false))
    {
        match parse_note(entry.path()) {
            Ok(note) => notes.push(note),
            Err(e) => eprintln!("Failed to parse {:?}:{}", entry.path(),e),
        }
    }
    notes
}