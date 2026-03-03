use pulldown_cmark::{Options, Parser};
use regex::Regex;
use serde_json::Value;
use std::error::Error;
use std::path::Path;
use std::sync::LazyLock;

#[derive(Debug, PartialEq, Clone, Copy)] // Derive Macros
pub enum HeadingLevel {
    H1 = 1,
    H2 = 2,
    H3 = 3,
    H4 = 4,
    H5 = 5,
    H6 = 6,
}
#[derive(Debug, Clone)]
pub struct Heading {
    pub level: HeadingLevel,
    pub text: String,
    pub anchor: String,
}

#[derive(Debug, Clone)]
pub struct ParsedNote {
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub raw_md: String,
    pub html: String,
    pub links: Vec<String>,
    pub embeds: Vec<String>,
    pub tags: Vec<String>,
    pub toc: Vec<Heading>,
    pub has_latex: bool,
    pub frontmatter: Value,
}

pub fn parse_note(path: &Path) -> Result<ParsedNote, Box<dyn Error>> {
    let raw = std::fs::read_to_string(path)?;
    let (formatter_str, markdown) = split_formatter(&raw);

    println!("formatter: {:?}", formatter_str);
    println!("markdown: {:?}", markdown);

    todo!()
}

// spilt-formatter to split md file attributes
fn split_formatter(raw: &str) -> (&str, &str) {
    if raw.starts_with("---") {
        let after_first = &raw[3..];
        if let Some(end) = after_first.find("---") {
            let formatter = &after_first[..end];
            let content = &after_first[end + 3..];
            return (formatter.trim(), content.trim());
        }
    }
    ("", raw.trim())
}

// embeds and wikilinks
static LINK_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(!)?\[\[([^\]|]+)(?:\|[^\]]+)?\]\]").unwrap());
fn extract_links(markdown: &str) -> (Vec<String>, Vec<String>) {
    let mut wikilinks = Vec::new();
    let mut embeds = Vec::new();

    let re = Regex::new(r"(!)?\[\[([^\]|]+)(?:\|[^\]]+)?\]\]").unwrap(); // read regex to understand that god lang
    for cap in re.captures_iter(markdown) {
        let is_embed = cap.get(1).is_some();
        let target = cap.get(2).map(|m| m.as_str().trim().to_string()).unwrap();

        if is_embed {
            embeds.push(target);
        } else {
            wikilinks.push(target);
        }
    }
    (wikilinks, embeds)
}

// title and tags
fn parse_formatter(yaml_str: &str) -> (Option<String>, Option<String>, Vec<String>, Value) {
    let yaml: Value =
        serde_yaml::from_str(yaml_str).unwrap_or(Value::Object(serde_json::Map::new()));

    // grabing the title
    let title = yaml
        .get("title")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    // grabing desciptions
    let description = yaml
        .get("desciption")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let mut tags = Vec::new();
    if let Some(tags_val) = yaml.get("tags") {
        if let Some(tag_list) = tags_val.as_array() {
            for t in tag_list {
                if let Some(tag_str) = t.as_str() {
                    tags.push(tag_str.to_string());
                }
            }
        } else if let Some(single_tag) = tags_val.as_str() {
            tags.push(single_tag.to_string());
        }
    }
    (title, description, tags, yaml) // (Option<String>, Vec<String>, Value)
}

// parsig body(content)
fn parse_content(markdown: &str) -> (String, Vec<Heading>, bool) {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);

    let parser = Parser::new_ext(markdown, options);
    let mut toc = Vec::new();
    let mut has_latex = false;

    // checking latext
    if markdown.contains('$') {
        has_latex = true;
    }

    let mut events = Vec::new();
    let mut in_heading = false;
    let mut heading_level = HeadingLevel::H1;
    let mut heading_text = String::new();

    for event in parser {
        match &event {
            pulldown_cmark::Event::Start(pulldown_cmark::Tag::Heading { level, .. }) => {
                in_heading = true;
                heading_level = match level {
                    pulldown_cmark::HeadingLevel::H1 => HeadingLevel::H1,
                    pulldown_cmark::HeadingLevel::H2 => HeadingLevel::H2,
                    pulldown_cmark::HeadingLevel::H3 => HeadingLevel::H3,
                    pulldown_cmark::HeadingLevel::H4 => HeadingLevel::H4,
                    pulldown_cmark::HeadingLevel::H5 => HeadingLevel::H5,
                    pulldown_cmark::HeadingLevel::H6 => HeadingLevel::H6,
                };
                heading_text.clear();
            }
            pulldown_cmark::Event::Text(text) if in_heading => {
                heading_text.push_str(text);
            }
            pulldown_cmark::Event::End(pulldown_cmark::TagEnd::Heading(_)) => {
                if in_heading {
                    let anchor = heading_text
                        .to_lowercase()
                        .replace(' ', "-")
                        .replace(|c: char| !c.is_alphabetic() && c != '-', "");
                    toc.push(Heading {
                        level: heading_level,
                        text: heading_text.clone(),
                        anchor,
                    });
                    in_heading = false;
                }
            }
            _ => {}
        }
        events.push(event);
    }

    let mut html = String::new();
    pulldown_cmark::html::push_html(&mut html, events.into_iter());

    (html, toc, has_latex)
}
