use std::path::Path;
use std::error::Error;
use crate::parser::convert_to_webp;

pub fn process_images(vault_path: &Path, images: &[String]) -> Result<(), Box<dyn Error>> {
    let cache_dir = vault_path.join(".cache");
    std::fs::create_dir_all(&cache_dir)?;

    for image in images {
        let input = vault_path.join(image);
        if !input.exists() {
            eprintln!("Image not found: {}", input.display());
            continue;
        }

        // build output path — swap extension to .webp
        let stem = input.file_stem().unwrap_or_default().to_string_lossy();
        let output = cache_dir.join(format!("{}.webp", stem));

        if output.exists() {
            continue; // already converted, skip
        }

        match convert_to_webp(&input, &output) {
            Ok(_) => println!("Converted: {} → {}", image, output.display()),
            Err(e) => eprintln!("Failed to convert {}: {}", image, e),
        }
    }
    Ok(())
}

pub fn process_videos(vault_path: &Path, videos: &[String]) -> Result<(), Box<dyn Error>> {
    let cache_dir = vault_path.join(".cache");
    std::fs::create_dir_all(&cache_dir)?;

    for video in videos {
        let input = vault_path.join(video);
        if !input.exists() {
            eprintln!("Video not found: {}", input.display());
            continue;
        }

        let stem = input.file_stem().unwrap_or_default().to_string_lossy();
        let thumb = cache_dir.join(format!("thumb-{}.webp", stem));

        if thumb.exists() {
            continue; // already generated, skip
        }

        // call ffmpeg(The Goat) to extract frame at 1 second
        let status = std::process::Command::new("ffmpeg")
            .args([
                "-i", input.to_str().unwrap(),
                "-ss", "00:00:01",
                "-vframes", "1",
                "-q:v", "2",
                thumb.to_str().unwrap(),
            ])
            .output();


        match status {
            Ok(out) if out.status.success() => {
                println!("Thumbnail: {} → {}", video, thumb.display())
            }
            Ok(out) => eprintln!(
                "ffmpeg failed for {}: {}",
                video,
                String::from_utf8_lossy(&out.stderr)
            ),
            Err(e) => eprintln!("ffmpeg not found or failed: {}", e),
        }
    }
    Ok(())
}