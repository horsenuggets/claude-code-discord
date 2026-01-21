#!/bin/bash

# Create DigitalOcean droplet for claude-code-discord

DIGITALOCEAN_API_TOKEN=$(cat ./digitalocean-api-token.key 2>/dev/null || echo "$DO_API_TOKEN")

if [ -z "$DIGITALOCEAN_API_TOKEN" ]; then
    echo "Error: No API token found. Set DO_API_TOKEN or create digitalocean-api-token.key"
    exit 1
fi

# Read cloud-init file and base64 encode it
CLOUD_INIT=$(base64 < ./cloud-init.yaml)

curl -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DIGITALOCEAN_API_TOKEN" \
    -d "{
        \"name\": \"claude-code-discord\",
        \"size\": \"s-2vcpu-2gb\",
        \"region\": \"sfo3\",
        \"image\": \"ubuntu-24-04-x64\",
        \"ssh_keys\": [33321886],
        \"user_data\": \"$(cat ./cloud-init.yaml | sed 's/"/\\"/g' | tr '\n' ' ')\"
    }" \
    "https://api.digitalocean.com/v2/droplets"
