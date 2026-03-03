mod db;
mod graph;
mod indexer;
mod parser;

fn main() {
    let path = std::path::Path::new("test.md");
    match parser::parse_note(path) {
        Ok(note) => {
            println!("slug: {}", note.slug);
            println!("title: {}", note.title);
            println!("tags: {:?}", note.tags);
            println!("links: {:?}", note.links);
            println!("has_latex: {}", note.has_latex);
            println!("toc entries: {}", note.toc.len());
            println!("html preview: {}", &note.html[..200.min(note.html.len())]);
        }
        Err(e) => println!("error: {}", e),
    }
}
