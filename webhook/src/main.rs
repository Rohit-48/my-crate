use axum::{
    Router,
    body::Bytes,
    extract::State,
    http::{HeaderMap, StatusCode},
    routing::post,
};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::process::Command;
use std::sync::Arc;

struct AppState {
    webhook_secret: String,
    vault_path: String,
    db_path: String,
    indexer_path: String,
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        webhook_secret: std::env::var("WEBHOOK_SECRET").expect("WEBHOOK_SECRET Not Set"),
        vault_path: std::env::var("VAULT_PATH").expect("VAULT_PATH Not Set"),
        db_path: std::env::var("DB_PATH").expect("DB_PATH Not Set"),
        indexer_path: std::env::var("INDEXER_PATH").expect("INDEXER_PATH Not Set"),
    });

    let app = Router::new()
        .route("/webhook", post(handle_webhook))
        .with_state(state);

    let listner = tokio::net::TcpListener::bind("0.0.0.0:3002").await.unwrap();
    println!("Webhook Listening on PORT: 3002");
    axum::serve(listner, app).await.unwrap();
}

async fn handle_webhook(
    State(state): State<Arc<AppState>>,
    header: HeaderMap,
    body: Bytes,
) -> StatusCode {
    // if signature is not there
    if !verify_signature(&body, &header, &state.webhook_secret){
        println!("invalid signature - REJECTED!");
        return StatusCode::UNAUTHORIZED;
    }

    // signature is there so matching it
    println!("Signature Verified --- PULLING VAULT");
    let pull = Command::new("git")
        .args(["-C", &state.vault_path, "pull"]) // pulling vault with great git pull cmd
        .output();

    match pull {
        Ok(out) => println!("git pull: {}", std::str::from_utf8(&out.stdout).unwrap_or("")),
        Err(e) => {
            println!("git pull failed: {}", e);
            return  StatusCode::INTERNAL_SERVER_ERROR;
        }
    }

    // hello indexer speaking, plx pick up our call
    println!("RUNNING INDEXER");
    let index = Command::new(&state.indexer_path)
        .args(["--vault", &state.vault_path, "--db", &state.db_path])
        .output();

    match index {
        Ok(out) => println!("indexer: {}", String::from_utf8_lossy(&out.stdout)),
        Err(e) => {
            println!("indexer failed: {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR;
        }
    }
    StatusCode::OK
}

fn verify_signature(body: &Bytes, headers: &HeaderMap, secret: &str) -> bool{
    let sig_header = match headers.get("x-hub-signature-256"){
        Some(v) => v.to_str().unwrap_or(""),
        None => return false,
    };

    let sig_hex = sig_header.strip_prefix("sha256=").unwrap_or("");

    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(body);
    let result = mac.finalize().into_bytes();
    let computed = hex::encode(result);

    computed == sig_hex
}