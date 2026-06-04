#!/bin/bash
# Setup basic UFW firewall rules for GestaoCasa deployment

# Allow SSH
ufw allow OpenSSH

# Allow HTTP (Nginx) and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow PocketBase (Kong proxy) on port 8091 (external)
ufw allow 8091/tcp

# Enable firewall
ufw --force enable

echo "UFW rules applied."
