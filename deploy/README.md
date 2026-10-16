# Deploy

`digitalocean-user-data.sh` is cloud-init user-data for a fresh Ubuntu 24.04 droplet (4 GB minimum for the default model). It installs Docker and Caddy, clones the repo, starts the stack, and puts it behind HTTPS on `<droplet-ip>.sslip.io` - HTTPS is required for microphone access in the browser.

Create the droplet with the user-data (after substituting the ElevenLabs key and repo URL), wait ~5 minutes for the model pull, then open `https://<ip>.sslip.io`.
