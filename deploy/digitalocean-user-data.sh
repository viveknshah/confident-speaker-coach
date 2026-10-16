#!/bin/bash
# Cloud-init user-data for a fresh Ubuntu 24.04 droplet (4 GB RAM min).
# Substitute __ELEVENLABS_KEY__ and __REPO__ before creating the droplet.
set -eux
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-v2 caddy
systemctl enable --now docker caddy

cd /opt
git clone __REPO__ confident-speaker-coach
cd confident-speaker-coach
cat > .env <<ENVEOF
ELEVENLABS_API_KEY=__ELEVENLABS_KEY__
ENVEOF
docker compose up -d --build

# TLS via sslip.io so the browser mic (getUserMedia) works - no domain needed.
IP=$(curl -s ifconfig.me)
cat > /etc/caddy/Caddyfile <<CADDYEOF
${IP}.sslip.io
reverse_proxy localhost:3000
CADDYEOF
systemctl reload caddy

# Firewall: web only
ufw allow 80,443/tcp
ufw --force enable
