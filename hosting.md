# Hosting MY-CRATE in the Cloud

MY-CRATE is composed of an Astro frontend, a Hono API (Bun), a Rust-based markdown indexer, a Rust webhook listener, and a local SQLite database.

Because the app relies on the local file system (a `vault/` directory) and a local SQLite database, **the most reliable way to host MY-CRATE is on a Virtual Private Server (VPS)** rather than serverless platforms (like Vercel or AWS Lambda).

This guide covers how to deploy MY-CRATE on popular cloud providers like DigitalOcean, AWS (EC2), and others.

---

## 1. Prerequisites

Regardless of your cloud provider, your server will need the following installed:

- **Git** (to pull your project and vault)
- **Node.js & npm** (for the Astro frontend)
- **Bun** (for the Hono API)
- **Rust & Cargo** (for compiling the indexer and webhook)

---

## 2. Choosing a Provider

### Option A: DigitalOcean (Recommended for simplicity)

1. Go to your DigitalOcean dashboard and click **Create Droplet**.
2. **Image:** Choose **Ubuntu 24.04** (or NixOS if you prefer using the provided flake).
3. **Size:** A Basic Regular Intel with 1GB or 2GB RAM is plenty.
4. **Authentication:** Add your SSH keys.
5. Create the Droplet and SSH into your new server: `ssh root@<your_droplet_ip>`

### Option B: AWS (Amazon Web Services)

1. Go to the **EC2 Console** and click **Launch Instance**.
2. **AMI:** Select **Ubuntu Server 24.04 LTS**.
3. **Instance Type:** `t3.micro` or `t3.small` (Free Tier eligible) is sufficient.
4. **Key Pair:** Create or select an existing SSH key pair.
5. **Network Settings:** Allow HTTP (80) and HTTPS (443) traffic, plus SSH (22).
6. Launch and SSH into your instance: `ssh -i your-key.pem ubuntu@<your_ec2_ip>`

### Option C: Hetzner / Linode / Vultr

Any standard Linux VPS will work perfectly. Just spin up an Ubuntu or Debian instance and SSH in.

---

## 3. Server Setup & Installation

Once logged into your VPS, run the following commands to prepare the environment:

### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Git, build essentials, and SQLite
sudo apt install -y git curl build-essential libsqlite3-dev

# Install Node.js (via NVM or NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

### Clone Your Repository

```bash
# Clone the MY-CRATE project
git clone https://github.com/yourusername/my-crate.git
cd my-crate

# Note: Your Obsidian Vault lives inside the main project repository at `./vault/`
# Ensure your vault files are present in that directory before proceeding.
```

### Build the Project

```bash
# 1. Build the Astro Frontend
cd web
npm install
npm run build
cd ..

# 2. Install API dependencies
cd api
bun install
cd ..

# 3. Build the Rust binaries (Indexer & Webhook)
cd indexer && cargo build --release && cd ..
cd webhook && cargo build --release && cd ..
```

---

## 4. Initial Database Setup

Before starting the web services, you must run the indexer once to parse your markdown vault and generate the initial SQLite database:

```bash
# Run the Rust indexer to populate ./data/notes.db
./indexer/target/release/indexer --vault ./vault --db ./data/notes.db
```

---

## 5. Running the Application (Systemd)

To keep the application running continuously and automatically restart on reboots, we recommend using **Systemd**, which is built into Ubuntu natively.

You will create three service files for the API, Web, and Webhook components. Ensure you replace `/path/to/my-crate` with your actual absolute project path.

### 1. API Service
Create `/etc/systemd/system/my-crate-api.service`:

```ini
[Unit]
Description=MY-CRATE API (Hono)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/my-crate/api
ExecStart=/root/.bun/bin/bun run index.ts
Environment=PORT=3001
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. Web Service (Astro SSR)
Create `/etc/systemd/system/my-crate-web.service`:

```ini
[Unit]
Description=MY-CRATE Web Frontend (Astro)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/my-crate/web
ExecStart=/usr/bin/node ./dist/server/entry.mjs
Environment=PORT=4321
Environment=HOST=127.0.0.1
Restart=always

[Install]
WantedBy=multi-user.target
```

### 3. Webhook Listener
Create `/etc/systemd/system/my-crate-webhook.service`:

```ini
[Unit]
Description=MY-CRATE Git Webhook Listener
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/my-crate/webhook
ExecStart=/path/to/my-crate/webhook/target/release/webhook
Environment=WEBHOOK_SECRET=your_super_secret_string
Environment=VAULT_PATH=../vault
Environment=DB_PATH=../data/notes.db
Environment=INDEXER_PATH=../indexer/target/release/indexer
Environment=PORT=3002
Restart=always

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
sudo systemctl daemon-reload

sudo systemctl enable my-crate-api my-crate-web my-crate-webhook
sudo systemctl start my-crate-api my-crate-web my-crate-webhook

# Verify everything is running
sudo systemctl status my-crate-api my-crate-web my-crate-webhook
```

---

## 6. Setting Up Nginx Reverse Proxy & SSL

To access your site via a domain name (e.g., `notes.yourdomain.com`) without typing ports, use Nginx.

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Create an Nginx configuration file: `/etc/nginx/sites-available/my-crate`

```nginx
server {
    server_name notes.yourdomain.com;

    # Frontend (Astro)
    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # API Proxy
    # Note: The trailing slashes on both lines below are critical.
    # They ensure the `/api` prefix is stripped before being passed to Hono.
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
    }

    # Webhook Endpoint (For GitHub/GitLab to ping)
    location /webhook {
        proxy_pass http://127.0.0.1:3002/webhook;
        proxy_set_header Host $host;
    }
}
```

Enable the site and apply SSL:

```bash
sudo ln -s /etc/nginx/sites-available/my-crate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Generate free SSL certificate
sudo certbot --nginx -d notes.yourdomain.com
```

---

## 7. Automating Updates (GitHub Webhooks)

When you push updates to your `vault/` directory in GitHub, your server should update automatically.

1. Go to your repository on **GitHub** > **Settings** > **Webhooks**.
2. Click **Add webhook**.
3. **Payload URL:** `https://notes.yourdomain.com/webhook`
4. **Content type:** `application/json`
5. **Secret:** Match the `WEBHOOK_SECRET` you set in your systemd service.
6. Trigger: Just the `push` event.
7. Save.

Now, whenever you push changes to GitHub, GitHub pings your Rust Webhook listener. The listener executes `git pull` locally and runs the Rust indexer to rebuild the `notes.db` database in milliseconds!